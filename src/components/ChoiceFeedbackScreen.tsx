import { ContinueButton } from "./ContinueButton";
import { FeedbackPaper } from "./FeedbackPaper";
import { PaperHeader } from "./PaperHeader";
import { StatGrid } from "./StatGrid";
import type { ChoiceViewModel, StatViewModel } from "./visualTypes";

export interface ChoiceFeedbackScreenProps {
  currentRound: number;
  onContinue?: () => void;
  selectedChoice: ChoiceViewModel;
  stats: StatViewModel[];
  totalRounds: number;
}

export function ChoiceFeedbackScreen({
  currentRound,
  onContinue,
  selectedChoice,
  stats,
  totalRounds
}: ChoiceFeedbackScreenProps) {
  return (
    <div className="ms-screen ms-screen--feedback">
      <PaperHeader badge={`第 ${currentRound}/${totalRounds} 回合`} />
      <section className="ms-feedback-deck ms-paper ms-paper--light" aria-label="选择反馈回执">
        <span className="ms-paper-tape ms-feedback-deck__tape" aria-hidden="true" />
        <span className="ms-paperclip ms-feedback-deck__clip" aria-hidden="true" />
        <StatGrid ariaLabel="选择后的状态" stats={stats} variant="feedback" />
        <FeedbackPaper selectedChoice={selectedChoice} />
        <div className="ms-feedback-deck__action">
          <ContinueButton onContinue={onContinue} />
        </div>
      </section>
    </div>
  );
}
