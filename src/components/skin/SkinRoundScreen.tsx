import mainPaperRound from "../../assets/skin-v2/main-paper-round@2x.png";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "../visualTypes";
import { SkinChoiceTicket } from "./SkinChoiceTicket";
import { SkinHeader } from "./SkinHeader";
import { SkinIcon } from "./SkinIcon";
import { SkinStatCard } from "./SkinStatCard";

export interface SkinRoundScreenProps {
  choices: ChoiceViewModel[];
  currentRound: number;
  event: EventViewModel;
  onChoose?: (choice: ChoiceViewModel) => void;
  stats: StatViewModel[];
  totalRounds: number;
}

function splitChineseSentences(text: string) {
  return text.match(/[^。！？]+[。！？]?/g)?.map((line) => line.trim()).filter(Boolean) ?? [text];
}

export function SkinRoundScreen({ choices, currentRound, event, onChoose, stats, totalRounds }: SkinRoundScreenProps) {
  const bodyLines = splitChineseSentences(event.body);

  return (
    <div className="ms-skin-screen ms-skin-screen--round">
      <SkinHeader badge={`第 ${currentRound}/${totalRounds} 回合`} />

      <div className="ms-skin-stat-grid ms-skin-stat-grid--round" aria-label="当前状态">
        {stats.map((stat) => (
          <SkinStatCard key={stat.kind} {...stat} />
        ))}
      </div>

      <section className="ms-skin-round-paper" aria-label="当前回合档案">
        <img className="ms-skin-round-paper__asset" src={mainPaperRound} alt="" aria-hidden="true" />

        <article className="ms-skin-round-event">
          <p className="ms-skin-kicker">当前事件</p>
          <h2 aria-label={event.time ? `${event.time} ${event.title}` : event.title}>
            {event.time ? <span className="ms-skin-time-badge">{event.time}</span> : null}
            <span>{event.title}</span>
          </h2>
          {event.visual ? <SkinIcon className="ms-skin-round-event__watermark" name={event.visual} /> : null}
          <p className="ms-skin-round-event__body">
            {bodyLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </article>

        <div className="ms-skin-choice-list" aria-label="可选行动">
          {choices.map((choice, index) => (
            <SkinChoiceTicket key={choice.id} choice={choice} index={index} onChoose={onChoose} />
          ))}
        </div>
      </section>

      <p className="ms-skin-tip">每个选择都会影响你的能量、心情和得分。</p>
    </div>
  );
}
