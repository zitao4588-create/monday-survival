import {
  applyChoice,
  createGameProgress,
  getOutcome,
  type GameChoice,
  type GameOutcome,
  type GameProgress
} from "./gameCore";
import { mondaySurvivalDefinition } from "./data/metadata";
import { mondayResultCopy } from "./data/results";
import { mondayTurns } from "./data/turns";

export { mondaySurvivalDefinition, mondayTurns };

export interface MondayResult {
  outcome: GameOutcome;
  title: string;
  description: string;
}

export function createMondayRun(): GameProgress {
  return createGameProgress();
}

export function chooseMondayAction(progress: GameProgress, choice: GameChoice): GameProgress {
  return applyChoice(progress, choice);
}

export function isMondayRunComplete(progress: GameProgress): boolean {
  return progress.turnIndex >= mondayTurns.length || progress.energy <= 0 || progress.mood <= 0;
}

export function calculateMondayResult(progress: GameProgress): MondayResult {
  const outcome = getOutcome(progress);
  const copy = mondayResultCopy[outcome];
  return {
    outcome,
    title: copy.title,
    description: copy.description
  };
}
