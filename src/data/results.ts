import type { GameOutcome } from "../gameCore";

export interface MondayResultCopy {
  title: string;
  description: string;
}

export const mondayResultCopy: Record<GameOutcome, MondayResultCopy> = {
  win: {
    title: "体面下班",
    description: "你不仅活过了周一，还保住了明天的自己。"
  },
  fail: {
    title: "周一把你打包带走",
    description: "能量或心情已经见底，建议立刻补给。"
  },
  survive: {
    title: "勉强存活",
    description: "你撑到了下班，但灵魂还在公司缓存中。"
  }
};
