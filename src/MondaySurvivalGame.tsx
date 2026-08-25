import { useLayoutEffect, useState } from "react";
import type { GameProgress } from "./gameCore";
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
  isMondayRunComplete,
  mondayTurns
} from "./game";
import { toChoiceViewModel, toEventViewModel, toResultViewModel, toStatViewModels } from "./gameViewModels";
import { createResultPosterDataUrl } from "./resultPoster";
import { createResultShareText, toResultShareData } from "./resultShare";

const isXhsBuild = import.meta.env.MODE === "xhs";

export interface MondaySurvivalGameProps {
  onEvent?: (name: string, properties?: Record<string, string | number | boolean>) => void;
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
  description: "你不仅熬过了周一，还保住了明天的自己。",
  personaLabel: "边界感幸存者",
  personaQuote: "在混乱里守住边界，就是一种高级生存力。",
  title: "体面下班"
};

const eventVisuals: EventViewModel["visual"][] = ["alarm", "train", "coffee", "alarm", "coffee"];

function getStaticScreen() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const pathScreen = pathParts.find((part) => part === "round" || part === "feedback" || part === "result");
  const screen = new URLSearchParams(window.location.search).get("screen") ?? pathScreen;

  return screen === "round" || screen === "feedback" || screen === "result" ? screen : null;
}

function getEventViewModel(turnIndex: number) {
  const turn = mondayTurns[Math.min(turnIndex, mondayTurns.length - 1)];
  return toEventViewModel(turn, eventVisuals[turnIndex] ?? "alarm");
}

function getChoiceViewModels(turnIndex: number) {
  return mondayTurns[turnIndex].choices.map(toChoiceViewModel);
}

function getStatDelta(before: GameProgress, after: GameProgress) {
  return {
    energy: after.energy - before.energy,
    mood: after.mood - before.mood,
    score: after.score - before.score
  };
}

function StaticMondayScreen({ screen }: { screen: "feedback" | "result" | "round" }) {
  if (screen === "round") {
    return (
      <FixedRoundStage>
        <FixedRoundScreen
          choices={previewChoices}
          currentRound={1}
          event={toEventViewModel(mondayTurns[0], "alarm")}
          stats={previewRoundStats}
          totalRounds={mondayTurns.length}
        />
      </FixedRoundStage>
    );
  }

  if (screen === "feedback") {
    return (
      <FixedScreenStage>
        <FixedFeedbackScreen
          currentRound={1}
          nextEvent={toEventViewModel(mondayTurns[1], "train")}
          selectedChoice={previewSelectedChoice}
          stats={previewFeedbackStats}
          totalRounds={mondayTurns.length}
        />
      </FixedScreenStage>
    );
  }

  return (
    <FixedScreenStage>
      <FixedResultScreen result={previewResult} stats={previewResultStats} />
    </FixedScreenStage>
  );
}

interface FeedbackState {
  after: GameProgress;
  before: GameProgress;
  selectedChoice: ChoiceViewModel;
}

type ShareNavigator = Navigator & {
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
  const [phase, setPhase] = useState<"feedback" | "result" | "round">("round");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [shareStatus, setShareStatus] = useState<ResultShareStatus>("idle");
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

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
    onEvent?.("restart");
  }

  function choose(choice: ChoiceViewModel) {
    const currentTurn = mondayTurns[progress.turnIndex];
    const gameChoice = currentTurn?.choices.find((candidate) => candidate.id === choice.id);

    if (!gameChoice) {
      return;
    }

    const before = progress;
    const after = chooseMondayAction(before, gameChoice);
    setProgress(after);
    setFeedback({ after, before, selectedChoice: choice });
    setShareStatus("idle");
    setResultImageUrl(null);
    setPhase("feedback");
    onEvent?.("choice_selected", {
      choiceId: choice.id,
      round: before.turnIndex + 1
    });
  }

  function continueRun() {
    const nextPhase = isMondayRunComplete(progress) ? "result" : "round";
    setPhase(nextPhase);
    onEvent?.("continue", {
      round: Math.min(progress.turnIndex + 1, mondayTurns.length),
      screen: nextPhase
    });
  }

  async function createResultImage(result: ResultViewModel, stats: ReturnType<typeof toStatViewModels>) {
    setShareStatus("generating");

    try {
      const imageUrl = await createResultPosterDataUrl(fixedResultBackground, toResultShareData(result, stats));
      setResultImageUrl(imageUrl);
      setShareStatus("ready");
      onEvent?.("result_image_generated", {
        result: result.title
      });
    } catch {
      setResultImageUrl(null);
      setShareStatus("failed");
    }
  }

  async function shareResultText(result: ResultViewModel, stats: ReturnType<typeof toStatViewModels>) {
    if (isXhsBuild) {
      return;
    }

    const nav = navigator as ShareNavigator;
    const url = getShareUrl();
    const text = createResultShareText(result, stats);
    const shareText = `${text}\n${url}`;

    if (nav.share) {
      setShareStatus("sharing");

      try {
        await nav.share({
          text,
          title: "今天你能熬过周一吗",
          url
        });
        setShareStatus("shared");
        onEvent?.("share_result", {
          result: result.title
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
      onEvent?.("share_result", {
        result: result.title
      });
    } catch {
      setShareStatus("failed");
    }
  }

  if (phase === "result" || (phase !== "feedback" && isMondayRunComplete(progress))) {
    const result = calculateMondayResult(progress);
    const stats = toStatViewModels(progress);
    const resultViewModel = toResultViewModel(result, progress);

    return (
      <FixedScreenStage>
        <FixedResultScreen
          onCloseResultImage={() => {
            setResultImageUrl(null);
            setShareStatus("idle");
          }}
          onRestart={restart}
          onShareText={isXhsBuild ? undefined : () => void shareResultText(resultViewModel, stats)}
          onCreateResultImage={() => void createResultImage(resultViewModel, stats)}
          result={resultViewModel}
          resultImageUrl={resultImageUrl}
          shareStatus={shareStatus}
          stats={stats}
        />
      </FixedScreenStage>
    );
  }

  if (phase === "feedback" && feedback) {
    const nextEvent = isMondayRunComplete(feedback.after) ? undefined : getEventViewModel(feedback.after.turnIndex);

    return (
      <FixedScreenStage>
        <FixedFeedbackScreen
          currentRound={Math.min(feedback.before.turnIndex + 1, mondayTurns.length)}
          nextEvent={nextEvent}
          onContinue={continueRun}
          selectedChoice={feedback.selectedChoice}
          stats={toStatViewModels(feedback.after, getStatDelta(feedback.before, feedback.after))}
          totalRounds={mondayTurns.length}
        />
      </FixedScreenStage>
    );
  }

  const currentTurnIndex = Math.min(progress.turnIndex, mondayTurns.length - 1);

  return (
    <FixedRoundStage>
      <FixedRoundScreen
        choices={getChoiceViewModels(currentTurnIndex)}
        currentRound={currentTurnIndex + 1}
        event={getEventViewModel(currentTurnIndex)}
        onChoose={choose}
        stats={toStatViewModels(progress)}
        totalRounds={mondayTurns.length}
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
