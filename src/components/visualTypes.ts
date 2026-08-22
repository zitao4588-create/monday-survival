import type { PrintIconName } from "./PrintIcon";
import type { GameChoiceIcon } from "../gameCore";

export type StatKind = "energy" | "mood" | "score";

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
  visual?: PrintIconName;
}

export interface ChoiceViewModel {
  description: string;
  effects: {
    energy: number;
    mood: number;
    score: number;
  };
  id: string;
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
