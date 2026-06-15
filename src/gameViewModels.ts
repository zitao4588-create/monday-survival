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

function getDynamicPersona(
  result: MondayResult,
  progress?: Pick<GameProgress, "energy" | "mood" | "score">
) {
  if (!progress) {
    return resultPersonas[result.outcome];
  }

  if (result.outcome === "win") {
    if (progress.score >= 60 && progress.energy >= 25) {
      return {
        label: "会议防火墙型",
        quote: "废话穿过你身边时，被自动归档成待办。"
      };
    }

    if (progress.energy < 35) {
      return {
        label: "燃尽通关者",
        quote: "你赢了周一，但电量条已经在写遗书。"
      };
    }

    if (progress.mood >= 80) {
      return {
        label: "情绪避险大师",
        quote: "你没有消灭周一，你只是让它找不到入口。"
      };
    }
  }

  if (result.outcome === "fail") {
    if (progress.energy <= 0) {
      return {
        label: "电量清零型",
        quote: "系统提示：请先充电，再考虑人生和周报。"
      };
    }

    if (progress.mood <= 0) {
      return {
        label: "情绪停机型",
        quote: "微笑服务已下线，剩余功能仅支持沉默。"
      };
    }

    if (progress.score < -10) {
      return {
        label: "绩效滑坡型",
        quote: "你不是没努力，只是努力都投进了错误窗口。"
      };
    }
  }

  if (result.outcome === "survive") {
    if (progress.energy < 25) {
      return {
        label: "低电量幸存者",
        quote: "你抵达下班线时，电池图标已经变成求救信号。"
      };
    }

    if (progress.mood < 25) {
      return {
        label: "微笑崩盘型",
        quote: "表情管理还在营业，内心客服已经离线。"
      };
    }

    if (progress.score < 20) {
      return {
        label: "摸鱼边缘人",
        quote: "今天没翻船，主要感谢水面比较给面子。"
      };
    }

    if (progress.energy >= 70 || progress.mood >= 75) {
      return {
        label: "自救优先型",
        quote: "工作没有完全赢，但你把自己从周一手里抢回来了。"
      };
    }
  }

  return resultPersonas[result.outcome];
}

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

export function toResultViewModel(
  result: MondayResult,
  progress?: Pick<GameProgress, "energy" | "mood" | "score">
): ResultViewModel {
  const persona = getDynamicPersona(result, progress);

  return {
    description: result.description,
    personaLabel: persona.label,
    personaQuote: persona.quote,
    title: result.title
  };
}
