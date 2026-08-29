import type { ResultViewModel, StatViewModel } from "./components/visualTypes";
import type { GameProgress, GameTurn } from "./gameCore";

export interface ResultKeyChoice {
  id: string;
  impactSummary: string;
  label: string;
}

export interface ResultPresentation {
  description: string;
  energy: number;
  keyChoice: ResultKeyChoice;
  mood: number;
  personaLabel: string;
  personaQuote: string;
  score: number;
  todayEnding: string;
}

function getStatValue(stats: StatViewModel[], kind: StatViewModel["kind"]) {
  return stats.find((stat) => stat.kind === kind)?.value ?? 0;
}

function getLastRealChoice(history: GameProgress["history"], turns: GameTurn[]): ResultKeyChoice {
  const choiceId = history.at(-1);

  if (!choiceId) {
    throw new Error("Result presentation requires at least one real choice");
  }

  const choice = turns.flatMap((turn) => turn.choices).find((candidate) => candidate.id === choiceId);

  if (!choice) {
    throw new Error(`Result presentation cannot find choice: ${choiceId}`);
  }

  return {
    id: choice.id,
    impactSummary: choice.impactSummary,
    label: choice.label
  };
}

export function toResultPresentation(
  result: ResultViewModel,
  stats: StatViewModel[],
  progress: Pick<GameProgress, "history">,
  turns: GameTurn[]
): ResultPresentation {
  return {
    description: result.description,
    energy: getStatValue(stats, "energy"),
    keyChoice: getLastRealChoice(progress.history, turns),
    mood: getStatValue(stats, "mood"),
    personaLabel: result.personaLabel,
    personaQuote: result.personaQuote,
    score: getStatValue(stats, "score"),
    todayEnding: result.title
  };
}
