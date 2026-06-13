import type { GameChoice, GameProgress, GameTurn } from "./gameCore";
import type { MondayResult } from "./game";
import type { ChoiceViewModel, EventViewModel, ResultViewModel, StatViewModel } from "./components/visualTypes";

const choiceVisuals = ["water", "alarm", "coffee"] as const;

const resultPersonas = {
  win: {
    label: "边界感幸存者",
    quote: "在混乱里守住边界，就是一种高级生存力。"
  },
  survive: {
    label: "缓存型打工人",
    quote: "今天没有满血通关，但你至少把自己带回了家。"
  },
  fail: {
    label: "急需补给者",
    quote: "周一暂时赢了这一局，先补觉，再复盘。"
  }
};

export function splitTurnTitle(title: string) {
  const match = title.match(/^(\d{2}:\d{2})\s+(.+)$/);

  if (!match) {
    return {
      time: "",
      title
    };
  }

  return {
    time: match[1],
    title: match[2]
  };
}

export function toEventViewModel(turn: GameTurn, visual: EventViewModel["visual"] = "alarm"): EventViewModel {
  const parts = splitTurnTitle(turn.title);

  return {
    body: turn.body,
    time: parts.time,
    title: parts.title,
    visual
  };
}

export function toChoiceViewModel(choice: GameChoice, index: number): ChoiceViewModel {
  return {
    description: choice.description,
    effects: {
      energy: choice.effect.energyDelta ?? 0,
      mood: choice.effect.moodDelta ?? 0,
      score: choice.effect.scoreDelta
    },
    id: choice.id,
    label: choice.label,
    visual: choiceVisuals[index] ?? "coffee"
  };
}

export function toStatViewModels(progress: Pick<GameProgress, "energy" | "mood" | "score">, delta?: Partial<Record<"energy" | "mood" | "score", number>>): StatViewModel[] {
  return [
    {
      delta: delta?.energy,
      kind: "energy",
      label: "能量",
      value: progress.energy
    },
    {
      delta: delta?.mood,
      kind: "mood",
      label: "心情",
      value: progress.mood
    },
    {
      delta: delta?.score,
      kind: "score",
      label: "得分",
      value: progress.score
    }
  ];
}

export function toResultViewModel(result: MondayResult): ResultViewModel {
  const persona = resultPersonas[result.outcome];

  return {
    description: result.description,
    personaLabel: persona.label,
    personaQuote: persona.quote,
    title: result.title
  };
}
