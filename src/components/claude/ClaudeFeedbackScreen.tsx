import bgFeedbackClean from "../../assets/claude-ui/bg-feedback-clean-2x.jpg";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "../visualTypes";
import { SkinIcon } from "../skin/SkinIcon";
import { ClaudeStats } from "./ClaudeRoundScreen";

export interface ClaudeFeedbackScreenProps {
  currentRound: number;
  nextEvent?: EventViewModel;
  onContinue?: () => void;
  selectedChoice: ChoiceViewModel;
  stats: StatViewModel[];
  totalRounds: number;
}

function splitFeedback(text: string) {
  if (text.length <= 13) {
    return [text];
  }

  const commaIndex = text.search(/[，,]/);
  if (commaIndex > 4 && commaIndex < text.length - 4) {
    return [text.slice(0, commaIndex + 1), text.slice(commaIndex + 1)];
  }

  return [text.slice(0, 12), text.slice(12)];
}

export function ClaudeFeedbackScreen({
  currentRound,
  nextEvent,
  onContinue,
  selectedChoice,
  stats,
  totalRounds
}: ClaudeFeedbackScreenProps) {
  const feedbackLines = splitFeedback(selectedChoice.description);

  return (
    <section className="ms-claude-screen ms-claude-screen--feedback" aria-label="选择反馈">
      <img className="ms-claude-bg" src={bgFeedbackClean} alt="" aria-hidden="true" />

      <div className="ms-claude-round-box ms-claude-round-box--feedback">
        <span>第</span>
        <strong>{currentRound}</strong>
        <span>/</span>
        <span>{totalRounds}</span>
        <span>回合</span>
      </div>

      <ClaudeStats showDelta stats={stats} />

      <strong className="ms-claude-chosen-name">{selectedChoice.label}</strong>

      <h2 className="ms-claude-feedback-quote">
        {feedbackLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <p className="ms-claude-feedback-sub">你决定先照顾好自己，节奏稳一点也没关系。</p>

      {nextEvent ? (
        <>
          <div className="ms-claude-next-chip">
            <SkinIcon name="alarm" />
            <span>{nextEvent.time}</span>
          </div>
          <h2 className="ms-claude-next-title">{nextEvent.title}</h2>
          <p className="ms-claude-next-body">{nextEvent.body}</p>
        </>
      ) : null}

      <button className="ms-claude-feedback-button" type="button" onClick={onContinue} aria-label="继续" />
    </section>
  );
}
