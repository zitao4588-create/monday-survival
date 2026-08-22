import feedbackPaper from "../../assets/skin-v2/feedback-paper@2x.png";
import primaryButton from "../../assets/skin-v2/primary-button@2x.png";
import type { ChoiceViewModel, StatViewModel } from "../visualTypes";
import { ChoiceIcon } from "../ChoiceIcon";
import { SkinHeader } from "./SkinHeader";
import { SkinIcon } from "./SkinIcon";
import { SkinStatCard } from "./SkinStatCard";

export interface SkinFeedbackScreenProps {
  currentRound: number;
  onContinue?: () => void;
  selectedChoice: ChoiceViewModel;
  stats: StatViewModel[];
  totalRounds: number;
}

export function SkinFeedbackScreen({
  currentRound,
  onContinue,
  selectedChoice,
  stats,
  totalRounds
}: SkinFeedbackScreenProps) {
  return (
    <div className="ms-skin-screen ms-skin-screen--feedback">
      <SkinHeader badge={`第 ${currentRound}/${totalRounds} 回合`} />

      <div className="ms-skin-stat-grid ms-skin-stat-grid--feedback" aria-label="选择后的状态">
        {stats.map((stat) => (
          <SkinStatCard key={stat.kind} {...stat} />
        ))}
      </div>

      <section className="ms-skin-feedback-paper" aria-label="选择反馈回执">
        <img className="ms-skin-feedback-paper__asset" src={feedbackPaper} alt="" aria-hidden="true" />
        <div className="ms-skin-feedback-paper__selected">
          <ChoiceIcon name={selectedChoice.visual} />
          <span>你选择了</span>
          <strong>{selectedChoice.label}</strong>
        </div>
        <div className="ms-skin-feedback-paper__body">
          <ChoiceIcon className="ms-skin-feedback-paper__hero-icon" name={selectedChoice.visual} />
          <h2>{selectedChoice.description}</h2>
          <p>你决定先照顾好自己，节奏稳一点也没关系。</p>
        </div>
      </section>

      <button className="ms-skin-primary-action ms-skin-feedback-action" type="button" onClick={onContinue}>
        <img className="ms-skin-action__asset" src={primaryButton} alt="" aria-hidden="true" />
        <span>继续撑下去</span>
        <SkinIcon name="check" />
      </button>
    </div>
  );
}
