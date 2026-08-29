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
import { getMondayTurnsForDate, getNaturalWeekSelection } from "./weeklyTurns";

export { getMondayTurnsForDate, getNaturalWeekSelection, mondaySurvivalDefinition, mondayTurns };

export const MONDAY_ROUND_COUNT = 5;

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
  return progress.turnIndex >= MONDAY_ROUND_COUNT || progress.energy <= 0 || progress.mood <= 0;
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
