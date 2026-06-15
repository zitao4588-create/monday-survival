export type GameOutcome = "win" | "survive" | "fail";

export type GamePlatform = "h5" | "mobile-web" | "pwa" | "app-shell";
export type GameStatus = "idea" | "prototype" | "playtest" | "released";

export interface GameMetadata {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  status: GameStatus;
  platforms: GamePlatform[];
  estimatedSessionMinutes: number;
  tags: string[];
}

export interface ChoiceEffect {
  scoreDelta: number;
  energyDelta?: number;
  moodDelta?: number;
}

export interface GameChoice {
  id: string;
  label: string;
  description: string;
  effect: ChoiceEffect;
}

export interface GameTurn {
  id: string;
  title: string;
  body: string;
  choices: GameChoice[];
}

export interface GameProgress {
  score: number;
  energy: number;
  mood: number;
  turnIndex: number;
  history: string[];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createGameProgress(): GameProgress {
  return {
    score: 0,
    energy: 70,
    mood: 60,
    turnIndex: 0,
    history: []
  };
}

export function applyChoice(progress: GameProgress, choice: GameChoice): GameProgress {
  return {
    score: progress.score + choice.effect.scoreDelta,
    energy: clamp(progress.energy + (choice.effect.energyDelta ?? 0), 0, 100),
    mood: clamp(progress.mood + (choice.effect.moodDelta ?? 0), 0, 100),
    turnIndex: progress.turnIndex + 1,
    history: [...progress.history, choice.id]
  };
}

export function getOutcome(progress: GameProgress): GameOutcome {
  if (progress.energy <= 0 || progress.mood <= 0 || progress.score < -10) {
    return "fail";
  }

  if (progress.score >= 38 && progress.energy >= 25 && progress.mood >= 25) {
    return "win";
  }

  return "survive";
}
