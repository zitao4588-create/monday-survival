import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { applyTurnEcho, type GameProgress } from "./gameCore";
import { FixedIntroOverlay } from "./components/fixed-intro/FixedIntroOverlay";
import { FixedFeedbackScreen } from "./components/fixed-feedback/FixedFeedbackScreen";
import {
  FixedResultScreen,
  type ResultShareStatus
} from "./components/fixed-result/FixedResultScreen";
import { FixedRoundScreen } from "./components/fixed-round/FixedRoundScreen";
import { FixedRoundStage } from "./components/fixed-round/FixedRoundStage";
import { FixedScreenStage } from "./components/fixed-screen/FixedScreenStage";
import type { ChoiceViewModel, EventViewModel, ResultViewModel } from "./components/visualTypes";
import fixedResultBackground from "./assets/backgrounds/result-background-fixed@2x.jpg";
import {
  calculateMondayResult,
  chooseMondayAction,
  createMondayRun,
  getNaturalWeekSelection,
  isMondayRunComplete,
  mondayTurns
} from "./game";
import { toChoiceViewModel, toEventViewModel, toResultViewModel, toStatViewModels } from "./gameViewModels";
import { createResultPosterDataUrl } from "./resultPoster";
import { toResultPresentation, type ResultPresentation } from "./resultPresentation";
import { createResultShareText } from "./resultShare";
import { hasSeenIntro, markIntroSeen } from "./introState";
import {
  clearLocalHistory,
  formatLocalHistoryDate,
  readLocalHistory,
  readSoundEnabled,
  saveLocalHistoryEntry,
  writeSoundEnabled
} from "./localHistory";
import { emitProductEvent, type ProductEventHandler } from "./productEvents";
import { createSoundPlayer } from "./sound";

const isXhsBuild = import.meta.env.MODE === "xhs";
const activeWeekSelection = getNaturalWeekSelection();
const activeMondayTurns = activeWeekSelection.turns;

export interface MondaySurvivalGameProps {
  onEvent?: ProductEventHandler;
}

const previewChoices = mondayTurns[0].choices.map(toChoiceViewModel);
const previewSelectedChoice = previewChoices[0];
const previewRoundStats = toStatViewModels({ energy: 70, mood: 60, score: 0 });
const previewFeedbackStats = toStatViewModels(
  { energy: 78, mood: 64, score: 12 },
  { energy: 8, mood: 4, score: 12 }
);
const previewResultStats = toStatViewModels({ energy: 52, mood: 92, score: 78 });
const previewResult: ResultViewModel = {
  description: "你守住节奏，完整下班。",
  personaLabel: "边界感幸存者",
  personaQuote: "守住边界，就是高级生存力。",
  title: "体面下班"
};
const previewResultPresentation = toResultPresentation(
  previewResult,
  previewResultStats,
  { history: [mondayTurns[mondayTurns.length - 1].choices[0].id] },
  mondayTurns
);

const eventVisuals: EventViewModel["visual"][] = ["alarm", "train", "coffee", "alarm", "coffee"];

function getStaticScreen() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const pathScreen = pathParts.find((part) => part === "intro" || part === "round" || part === "feedback" || part === "result");
  const screen = new URLSearchParams(window.location.search).get("screen") ?? pathScreen;

  return screen === "intro" || screen === "round" || screen === "feedback" || screen === "result" ? screen : null;
}

function getEventViewModel(turnIndex: number, tags: readonly string[] = []) {
  const turn = activeMondayTurns[Math.min(turnIndex, activeMondayTurns.length - 1)];
  return toEventViewModel(applyTurnEcho(turn, tags), eventVisuals[turnIndex] ?? "alarm");
}

function getChoiceViewModels(turnIndex: number) {
  return activeMondayTurns[turnIndex].choices.map(toChoiceViewModel);
}

function getStatDelta(before: GameProgress, after: GameProgress) {
  return {
    energy: after.energy - before.energy,
    mood: after.mood - before.mood,
    score: after.score - before.score
  };
}

function PreviewRound({ showIntro = false, onStart }: { showIntro?: boolean; onStart?: () => void }) {
  return (
    <FixedRoundStage>
      <div aria-hidden={showIntro ? "true" : undefined} className={showIntro ? "ms-fixed-intro-underlay" : undefined} inert={showIntro ? true : undefined}>
        <FixedRoundScreen
          choices={previewChoices}
          currentRound={1}
          event={toEventViewModel(mondayTurns[0], "alarm")}
          stats={previewRoundStats}
          totalRounds={mondayTurns.length}
        />
      </div>
      {showIntro ? <FixedIntroOverlay onStart={onStart} /> : null}
    </FixedRoundStage>
  );
}

function StaticIntroScreen() {
  const [showIntro, setShowIntro] = useState(true);

  return <PreviewRound showIntro={showIntro} onStart={() => setShowIntro(false)} />;
}

function StaticMondayScreen({ screen }: { screen: "feedback" | "intro" | "result" | "round" }) {
  if (screen === "intro") {
    return <StaticIntroScreen />;
  }

  if (screen === "round") {
    return <PreviewRound />;
  }

  if (screen === "feedback") {
    return (
      <FixedScreenStage>
        <FixedFeedbackScreen
          currentRound={1}
          isRunComplete={false}
          selectedChoice={previewSelectedChoice}
          stats={previewFeedbackStats}
          totalRounds={mondayTurns.length}
        />
      </FixedScreenStage>
    );
  }

  return (
    <FixedScreenStage>
      <FixedResultScreen data={previewResultPresentation} />
    </FixedScreenStage>
  );
}

interface FeedbackState {
  after: GameProgress;
  before: GameProgress;
  selectedChoice: ChoiceViewModel;
}

type ShareNavigator = {
  clipboard?: {
    writeText(text: string): Promise<void>;
  };
  share?: (data: { text?: string; title?: string; url?: string }) => Promise<void>;
};

function getShareUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}${window.location.pathname}`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

function PlayableMondaySurvivalGame({ onEvent }: MondaySurvivalGameProps) {
  const [progress, setProgress] = useState(createMondayRun);
  const [phase, setPhase] = useState<"feedback" | "intro" | "result" | "round">(
    () => hasSeenIntro() ? "round" : "intro"
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [shareStatus, setShareStatus] = useState<ResultShareStatus>("idle");
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState(readLocalHistory);
  const [soundEnabled, setSoundEnabled] = useState(readSoundEnabled);
  const eventHandlerRef = useRef(onEvent);
  const continueInFlightRef = useRef(false);
  const gameOpenEmittedRef = useRef(false);
  const historySavedRef = useRef(false);
  const imageGenerationInFlightRef = useRef(false);
  const lastViewEventRef = useRef("");
  const runStartEmittedRef = useRef(false);
  const runStartSourceRef = useRef<"replay" | "returning">("returning");
  const shareInFlightRef = useRef(false);
  const soundPlayerRef = useRef(createSoundPlayer());

  useEffect(() => {
    eventHandlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!gameOpenEmittedRef.current) {
      gameOpenEmittedRef.current = true;
      emitProductEvent(eventHandlerRef.current, "game_open", {
        build: isXhsBuild ? "xhs" : "h5",
        weekKey: activeWeekSelection.weekKey
      });
    }

    const viewKey = phase === "round"
      ? `round:${progress.turnIndex}`
      : phase === "result"
        ? `result:${progress.history.join(",")}`
        : phase;

    if (lastViewEventRef.current === viewKey) {
      return;
    }

    if (phase === "intro") {
      emitProductEvent(eventHandlerRef.current, "intro_view");
    } else if (phase === "round") {
      if (progress.turnIndex === 0 && !runStartEmittedRef.current) {
        runStartEmittedRef.current = true;
        emitProductEvent(eventHandlerRef.current, "game_start", {
          source: runStartSourceRef.current,
          weekKey: activeWeekSelection.weekKey
        });
      }
      emitProductEvent(eventHandlerRef.current, "round_view", {
        round: Math.min(progress.turnIndex + 1, activeMondayTurns.length),
        weekKey: activeWeekSelection.weekKey
      });
    } else if (phase === "result") {
      const result = calculateMondayResult(progress);
      emitProductEvent(eventHandlerRef.current, "result_view", {
        outcome: result.outcome,
        weekKey: activeWeekSelection.weekKey
      });
    }

    lastViewEventRef.current = viewKey;
  }, [phase, progress]);

  useEffect(() => {
    if (phase !== "result" || historySavedRef.current) {
      return;
    }

    historySavedRef.current = true;
    const result = calculateMondayResult(progress);
    const resultViewModel = toResultViewModel(result, progress);
    setHistory(saveLocalHistoryEntry({
      date: formatLocalHistoryDate(),
      energy: progress.energy,
      mood: progress.mood,
      outcome: result.title,
      persona: resultViewModel.personaLabel,
      score: progress.score,
      weekKey: activeWeekSelection.weekKey
    }));
  }, [phase, progress]);

  useLayoutEffect(() => {
    function resetScroll() {
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [phase, resultImageUrl]);

  function restart() {
    setProgress(createMondayRun());
    setFeedback(null);
    setPhase("round");
    setShareStatus("idle");
    setResultImageUrl(null);
    historySavedRef.current = false;
    runStartEmittedRef.current = false;
    runStartSourceRef.current = "replay";
    emitProductEvent(eventHandlerRef.current, "restart");
  }

  function startRun() {
    markIntroSeen();
    setPhase("round");
    runStartEmittedRef.current = true;
    emitProductEvent(eventHandlerRef.current, "game_start", {
      source: "intro",
      weekKey: activeWeekSelection.weekKey
    });
  }

  function choose(choice: ChoiceViewModel) {
    const currentTurn = activeMondayTurns[progress.turnIndex];
    const gameChoice = currentTurn?.choices.find((candidate) => candidate.id === choice.id);

    if (!gameChoice) {
      return;
    }

    const before = progress;
    const after = chooseMondayAction(before, gameChoice);
    setProgress(after);
    setFeedback({ after, before, selectedChoice: choice });
    continueInFlightRef.current = false;
    setShareStatus("idle");
    setResultImageUrl(null);
    setPhase("feedback");
    const statDelta = getStatDelta(before, after);
    const isDanger = statDelta.energy <= -15
      || statDelta.mood <= -15
      || statDelta.score <= -15;
    if (soundEnabled) {
      soundPlayerRef.current.play(isDanger ? "danger" : "choice");
    }
    emitProductEvent(eventHandlerRef.current, "choice_selected", {
      choiceId: choice.id,
      danger: isDanger,
      round: before.turnIndex + 1
    });
  }

  function continueRun() {
    if (continueInFlightRef.current) {
      return;
    }

    continueInFlightRef.current = true;
    const nextPhase = isMondayRunComplete(progress) ? "result" : "round";
    if (nextPhase === "result" && soundEnabled) {
      const outcome = calculateMondayResult(progress).outcome;
      if (outcome === "win" || outcome === "fail") {
        soundPlayerRef.current.play(outcome);
      }
    }
    setPhase(nextPhase);
    emitProductEvent(eventHandlerRef.current, "feedback_continue", {
      round: Math.min(progress.turnIndex + 1, activeMondayTurns.length),
      screen: nextPhase
    });
  }

  async function createResultImage(data: ResultPresentation) {
    if (imageGenerationInFlightRef.current) {
      return;
    }

    imageGenerationInFlightRef.current = true;
    setShareStatus("generating");

    try {
      const imageUrl = await createResultPosterDataUrl(fixedResultBackground, data);
      setResultImageUrl(imageUrl);
      setShareStatus("ready");
      emitProductEvent(eventHandlerRef.current, "result_image_generated", {
        result: data.todayEnding
      });
    } catch {
      setResultImageUrl(null);
      setShareStatus("failed");
    } finally {
      imageGenerationInFlightRef.current = false;
    }
  }

  async function shareResultText(data: ResultPresentation) {
    if (isXhsBuild || shareInFlightRef.current) {
      return;
    }

    shareInFlightRef.current = true;
    const nav = navigator as unknown as ShareNavigator;
    const url = getShareUrl();
    const text = createResultShareText(data);
    const shareText = `${text}\n${url}`;
    const shareMethod = nav.share ? "native" : "clipboard";
    emitProductEvent(eventHandlerRef.current, "share_attempted", {
      method: shareMethod,
      result: data.todayEnding
    });

    try {
      if (nav.share) {
        setShareStatus("sharing");

        try {
          await nav.share({
            text,
            title: "今天你能熬过周一吗",
            url
          });
          setShareStatus("shared");
          emitProductEvent(eventHandlerRef.current, "share_completed", {
            method: "native",
            result: data.todayEnding
          });
          return;
        } catch (error) {
          if (isAbortError(error)) {
            setShareStatus("cancelled");
            return;
          }

          if (!nav.clipboard?.writeText) {
            setShareStatus("failed");
            return;
          }
        }
      }

      if (!nav.clipboard?.writeText) {
        setShareStatus("failed");
        return;
      }

      try {
        await nav.clipboard.writeText(shareText);
        setShareStatus("copied");
        emitProductEvent(eventHandlerRef.current, "share_completed", {
          method: "clipboard",
          result: data.todayEnding
        });
      } catch {
        setShareStatus("failed");
      }
    } finally {
      shareInFlightRef.current = false;
    }
  }

  function toggleSound() {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    writeSoundEnabled(nextEnabled);
    if (nextEnabled) {
      soundPlayerRef.current.play("choice");
    }
  }

  function clearHistory() {
    clearLocalHistory();
    setHistory([]);
  }

  if (phase === "result" || (phase !== "feedback" && isMondayRunComplete(progress))) {
    const result = calculateMondayResult(progress);
    const stats = toStatViewModels(progress);
    const resultViewModel = toResultViewModel(result, progress);
    const resultPresentation = toResultPresentation(resultViewModel, stats, progress, activeMondayTurns);

    return (
      <FixedScreenStage>
        <FixedResultScreen
          data={resultPresentation}
          history={history}
          onClearHistory={clearHistory}
          onCloseResultImage={() => {
            setResultImageUrl(null);
            setShareStatus("idle");
          }}
          onRestart={restart}
          onShareText={isXhsBuild ? undefined : () => void shareResultText(resultPresentation)}
          onToggleSound={toggleSound}
          onCreateResultImage={() => void createResultImage(resultPresentation)}
          resultImageUrl={resultImageUrl}
          shareStatus={shareStatus}
          soundEnabled={soundEnabled}
        />
      </FixedScreenStage>
    );
  }

  if (phase === "feedback" && feedback) {
    const isRunComplete = isMondayRunComplete(feedback.after);

    return (
      <FixedScreenStage>
        <FixedFeedbackScreen
          currentRound={Math.min(feedback.before.turnIndex + 1, activeMondayTurns.length)}
          isRunComplete={isRunComplete}
          onContinue={continueRun}
          selectedChoice={feedback.selectedChoice}
          stats={toStatViewModels(feedback.after, getStatDelta(feedback.before, feedback.after))}
          totalRounds={activeMondayTurns.length}
        />
      </FixedScreenStage>
    );
  }

  const currentTurnIndex = Math.min(progress.turnIndex, activeMondayTurns.length - 1);

  if (phase === "intro") {
    return (
      <FixedRoundStage>
        <div aria-hidden="true" className="ms-fixed-intro-underlay" inert>
          <FixedRoundScreen
            choices={getChoiceViewModels(currentTurnIndex)}
            currentRound={currentTurnIndex + 1}
            event={getEventViewModel(currentTurnIndex, progress.tags)}
            stats={toStatViewModels(progress)}
            totalRounds={activeMondayTurns.length}
          />
        </div>
        <FixedIntroOverlay onStart={startRun} />
      </FixedRoundStage>
    );
  }

  return (
    <FixedRoundStage>
      <FixedRoundScreen
        choices={getChoiceViewModels(currentTurnIndex)}
        currentRound={currentTurnIndex + 1}
        event={getEventViewModel(currentTurnIndex, progress.tags)}
        onChoose={choose}
        stats={toStatViewModels(progress)}
        totalRounds={activeMondayTurns.length}
      />
    </FixedRoundStage>
  );
}

export function MondaySurvivalGame(props: MondaySurvivalGameProps = {}) {
  const staticScreen = getStaticScreen();

  if (staticScreen) {
    return <StaticMondayScreen screen={staticScreen} />;
  }

  return <PlayableMondaySurvivalGame {...props} />;
}
