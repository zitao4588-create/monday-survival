import { PrintIcon } from "./PrintIcon";
import { SelectedReceipt } from "./SelectedReceipt";
import type { ChoiceViewModel } from "./visualTypes";

export interface FeedbackPaperProps {
  selectedChoice: ChoiceViewModel;
}

export function FeedbackPaper({ selectedChoice }: FeedbackPaperProps) {
  return (
    <article className="ms-feedback-slip ms-paper ms-paper--light">
      <span className="ms-paper-tape ms-feedback-slip__tape" aria-hidden="true" />
      <SelectedReceipt choice={selectedChoice} />
      <div className="ms-feedback-slip__hero">
        <span className="ms-feedback-slip__spark ms-feedback-slip__spark--left" aria-hidden="true" />
        <span className="ms-feedback-slip__spark ms-feedback-slip__spark--right" aria-hidden="true" />
        <div className="ms-feedback-slip__icon" aria-hidden="true">
          <PrintIcon name={selectedChoice.visual} />
        </div>
        <h2>{selectedChoice.description}</h2>
        <p>你决定先照顾好自己，节奏稳一点也没关系。</p>
      </div>
    </article>
  );
}
