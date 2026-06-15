import type { GameOutcome } from "../gameCore";

export interface MondayResultCopy {
  title: string;
  description: string;
}

export const mondayResultCopy: Record<GameOutcome, MondayResultCopy> = {
  win: {
    title: "体面下班",
    description: "你把周一折成一份待办，带着完整灵魂离开工位。"
  },
  fail: {
    title: "周一把你打包带走",
    description: "它没有杀死你，但已经把你拖进会议纪要附件。"
  },
  survive: {
    title: "勉强存活",
    description: "你撑到了下班，灵魂还在公司缓存中排队释放。"
  }
};
