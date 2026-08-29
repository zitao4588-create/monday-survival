import type { GameOutcome } from "../gameCore";

export interface MondayResultCopy {
  title: string;
  description: string;
}

export const mondayResultCopy: Record<GameOutcome, MondayResultCopy> = {
  win: {
    title: "体面下班",
    description: "你守住节奏，完整下班。"
  },
  fail: {
    title: "周一把你打包带走",
    description: "周一占了上风，先休息再说。"
  },
  survive: {
    title: "勉强存活",
    description: "你撑到下班，灵魂正在回家。"
  }
};
