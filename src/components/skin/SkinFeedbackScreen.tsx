import feedbackPaper from "../../assets/skin-v2/feedback-paper@2x.png";
import nextEventCard from "../../assets/skin-v2/next-event-card@2x.png";
import primaryButton from "../../assets/skin-v2/primary-button@2x.png";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "../visualTypes";
import { SkinHeader } from "./SkinHeader";
import { SkinIcon } from "./SkinIcon";
import { SkinStatCard } from "./SkinStatCard";

export interface SkinFeedbackScreenProps {
  currentRound: number;
  nextEvent?: EventViewModel;
  onContinue?: () => void;
  selectedChoice: ChoiceViewModel;
  stats: StatViewModel[];
  totalRounds: number;
}

export function SkinFeedbackScreen({
  currentRound,
  nextEvent,
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
          <SkinIcon name={selectedChoice.visual} />
          <span>你选择了</span>
          <strong>{selectedChoice.label}</strong>
        </div>
        <div className="ms-skin-feedback-paper__body">
          <SkinIcon className="ms-skin-feedback-paper__hero-icon" name={selectedChoice.visual} />
          <h2>{selectedChoice.description}</h2>
          <p>你决定先照顾好自己，节奏稳一点也没关系。</p>
        </div>
      </section>

      {nextEvent ? (
        <article className="ms-skin-next-card" aria-label="下一事件预告">
          <img className="ms-skin-next-card__asset" src={nextEventCard} alt="" aria-hidden="true" />
          <p className="ms-skin-kicker">下一事件预告</p>
          <h2>
            {nextEvent.time ? <span>{nextEvent.time}</span> : null}
            {nextEvent.title}
          </h2>
          {nextEvent.visual ? <SkinIcon className="ms-skin-next-card__icon" name={nextEvent.visual} /> : null}
          <p>{nextEvent.body}</p>
        </article>
      ) : null}

      <button className="ms-skin-primary-action ms-skin-feedback-action" type="button" onClick={onContinue}>
        <img className="ms-skin-action__asset" src={primaryButton} alt="" aria-hidden="true" />
        <span>继续撑下去</span>
        <SkinIcon name="check" />
      </button>
    </div>
  );
}
