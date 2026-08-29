import type { GameChoiceIcon } from "../gameCore";

export type StatKind = "energy" | "mood" | "score";
export type EventVisual = "alarm" | "coffee" | "train";

export interface StatViewModel {
  kind: StatKind;
  label: string;
  value: number;
  delta?: number;
}

export interface EventViewModel {
  body: string;
  time: string;
  title: string;
  visual?: EventVisual;
}

export interface ChoiceViewModel {
  description: string;
  effects: {
    energy: number;
    mood: number;
    score: number;
  };
  id: string;
  impactSummary: string;
  label: string;
  preview: string;
  visual: GameChoiceIcon;
}

export interface ResultViewModel {
  description: string;
  personaLabel: string;
  personaQuote: string;
  title: string;
}
