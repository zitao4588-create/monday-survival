import { useState } from "react";
import type { GameProgress } from "./gameCore";
import { ComponentLab } from "./components/component-lab/ComponentLab";
import { ClaudeFeedbackScreen } from "./components/claude/ClaudeFeedbackScreen";
import { ClaudeGameStage } from "./components/claude/ClaudeGameStage";
import { ClaudeResultScreen } from "./components/claude/ClaudeResultScreen";
import { ClaudeRoundScreen } from "./components/claude/ClaudeRoundScreen";
import type { ChoiceViewModel, EventViewModel, ResultViewModel } from "./components/visualTypes";
import bgResultClean from "./assets/claude-ui/bg-result-clean-2x.jpg";
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
  description: "你不仅活过了周一，还保住了明天的自己。",
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

function getComponentLab() {
  if (new URLSearchParams(window.location.search).get("lab") === "components") {
    return true;
  }

  const path = window.location.pathname.toLowerCase();
  return path.includes("components") || path.endsWith("/lab") || path.endsWith("/lab/");
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
      <ClaudeGameStage>
        <ClaudeRoundScreen
          choices={previewChoices}
          currentRound={1}
          event={toEventViewModel(mondayTurns[0], "alarm")}
          stats={previewRoundStats}
          totalRounds={mondayTurns.length}
        />
      </ClaudeGameStage>
    );
  }

  if (screen === "feedback") {
    return (
      <ClaudeGameStage>
        <ClaudeFeedbackScreen
          currentRound={1}
          nextEvent={toEventViewModel(mondayTurns[1], "train")}
          selectedChoice={previewSelectedChoice}
          stats={previewFeedbackStats}
          totalRounds={mondayTurns.length}
        />
      </ClaudeGameStage>
    );
  }

  return (
    <ClaudeGameStage>
      <ClaudeResultScreen result={previewResult} stats={previewResultStats} />
    </ClaudeGameStage>
  );
}

interface FeedbackState {
  after: GameProgress;
  before: GameProgress;
  selectedChoice: ChoiceViewModel;
}

type ShareStatus = "copied" | "failed" | "generating" | "idle" | "ready";

type ShareNavigator = Navigator & {
  share?: (data: { text?: string; title?: string; url?: string }) => Promise<void>;
};

function getShareUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}${window.location.pathname}`;
}

function PlayableMondaySurvivalGame({ onEvent }: MondaySurvivalGameProps) {
  const [progress, setProgress] = useState(createMondayRun);
  const [phase, setPhase] = useState<"feedback" | "result" | "round">("round");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

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
      const imageUrl = await createResultPosterDataUrl(bgResultClean, toResultShareData(result, stats));
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
    const nav = navigator as ShareNavigator;
    const url = getShareUrl();
    const text = createResultShareText(result, stats);

    try {
      if (nav.share) {
        await nav.share({
          text,
          title: "今天你能活过周一吗",
          url
        });
      } else if (nav.clipboard?.writeText) {
        await nav.clipboard.writeText(`${text}\n${url}`);
      } else {
        throw new Error("No share or clipboard API available");
      }

      setShareStatus("copied");
      onEvent?.("share_result", {
        result: result.title
      });
    } catch {
      try {
        await nav.clipboard?.writeText?.(`${text}\n${url}`);
        setShareStatus("copied");
      } catch {
      setShareStatus("failed");
    }
  }
  }

  if (phase === "result" || (phase !== "feedback" && isMondayRunComplete(progress))) {
    const result = calculateMondayResult(progress);
    const stats = toStatViewModels(progress);
    const resultViewModel = toResultViewModel(result, progress);

    return (
      <ClaudeGameStage>
        <ClaudeResultScreen
          onCloseResultImage={() => setResultImageUrl(null)}
          onRestart={restart}
          onShareText={() => void shareResultText(resultViewModel, stats)}
          onCreateResultImage={() => void createResultImage(resultViewModel, stats)}
          result={resultViewModel}
          resultImageUrl={resultImageUrl}
          shareStatus={shareStatus}
          stats={stats}
        />
      </ClaudeGameStage>
    );
  }

  if (phase === "feedback" && feedback) {
    const nextEvent = isMondayRunComplete(feedback.after) ? undefined : getEventViewModel(feedback.after.turnIndex);

    return (
      <ClaudeGameStage>
        <ClaudeFeedbackScreen
          currentRound={Math.min(feedback.before.turnIndex + 1, mondayTurns.length)}
          nextEvent={nextEvent}
          onContinue={continueRun}
          selectedChoice={feedback.selectedChoice}
          stats={toStatViewModels(feedback.after, getStatDelta(feedback.before, feedback.after))}
          totalRounds={mondayTurns.length}
        />
      </ClaudeGameStage>
    );
  }

  const currentTurnIndex = Math.min(progress.turnIndex, mondayTurns.length - 1);

  return (
    <ClaudeGameStage>
      <ClaudeRoundScreen
        choices={getChoiceViewModels(currentTurnIndex)}
        currentRound={currentTurnIndex + 1}
        event={getEventViewModel(currentTurnIndex)}
        onChoose={choose}
        stats={toStatViewModels(progress)}
        totalRounds={mondayTurns.length}
      />
    </ClaudeGameStage>
  );
}

export function MondaySurvivalGame(props: MondaySurvivalGameProps = {}) {
  if (getComponentLab()) {
    return <ComponentLab />;
  }

  const staticScreen = getStaticScreen();

  if (staticScreen) {
    return <StaticMondayScreen screen={staticScreen} />;
  }

  return <PlayableMondaySurvivalGame {...props} />;
}
