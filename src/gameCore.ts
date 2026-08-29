export type GameOutcome = "win" | "survive" | "fail";

export type GameTurnPeriod = "wake-up" | "commute" | "morning" | "afternoon" | "closing";

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

export type GameChoiceIcon =
  | "calendar-clock"
  | "coffee"
  | "door-open"
  | "eye-off"
  | "laptop"
  | "list-filter"
  | "message-circle-warning"
  | "message-square-reply"
  | "notebook-pen"
  | "notebook-text"
  | "panels-top-left"
  | "power"
  | "sandwich"
  | "shower-head"
  | "smartphone";

export interface GameChoice {
  id: string;
  label: string;
  preview: string;
  description: string;
  impactSummary: string;
  visual: GameChoiceIcon;
  effect: ChoiceEffect;
  tags: string[];
}

export interface GameTurn {
  id: string;
  period: GameTurnPeriod;
  title: string;
  body: string;
  choices: GameChoice[];
  echoes?: Record<string, string>;
}

export interface GameProgress {
  score: number;
  energy: number;
  mood: number;
  turnIndex: number;
  history: string[];
  tags: string[];
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
    history: [],
    tags: []
  };
}

export function applyChoice(progress: GameProgress, choice: GameChoice): GameProgress {
  return {
    score: progress.score + choice.effect.scoreDelta,
    energy: clamp(progress.energy + (choice.effect.energyDelta ?? 0), 0, 100),
    mood: clamp(progress.mood + (choice.effect.moodDelta ?? 0), 0, 100),
    turnIndex: progress.turnIndex + 1,
    history: [...progress.history, choice.id],
    tags: [...progress.tags, ...choice.tags]
  };
}

export function applyTurnEcho(turn: GameTurn, tags: readonly string[]): GameTurn {
  const matchedTag = Object.keys(turn.echoes ?? {}).find((tag) => tags.includes(tag));

  if (!matchedTag) {
    return turn;
  }

  return {
    ...turn,
    body: turn.echoes?.[matchedTag] ?? turn.body
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
