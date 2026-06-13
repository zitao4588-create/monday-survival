import { ChoiceList } from "./ChoiceList";
import { EventPaper } from "./EventPaper";
import { PaperHeader } from "./PaperHeader";
import { StatGrid } from "./StatGrid";
import { TipNote } from "./TipNote";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "./visualTypes";

export interface RoundScreenProps {
  choices: ChoiceViewModel[];
  currentRound: number;
  event: EventViewModel;
  onChoose?: (choice: ChoiceViewModel) => void;
  stats: StatViewModel[];
  totalRounds: number;
}

export function RoundScreen({ choices, currentRound, event, onChoose, stats, totalRounds }: RoundScreenProps) {
  return (
    <div className="ms-screen ms-screen--round">
      <PaperHeader badge={`第 ${currentRound}/${totalRounds} 回合`} />
      <StatGrid ariaLabel="当前状态" stats={stats} />
      <section className="ms-round-file ms-paper ms-paper--light" aria-label="当前回合档案">
        <span className="ms-paper-tape ms-round-file__tape" aria-hidden="true" />
        <span className="ms-paperclip ms-round-file__clip" aria-hidden="true" />
        <div className="ms-coffee-ring ms-round-file__coffee" aria-hidden="true" />
        <div className="ms-round-file__holes" aria-hidden="true" />
        <EventPaper event={event} label="当前事件" />
        <ChoiceList choices={choices} onChoose={onChoose} />
      </section>
      <TipNote>每个选择都会影响你的能量、心情和得分。</TipNote>
    </div>
  );
}
