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

function getFeedbackSubcopy(choice: ChoiceViewModel) {
  const { energy, mood, score } = choice.effects;
  const negativeCount = [energy, mood, score].filter((value) => value < 0).length;

  if (negativeCount >= 2) {
    return "这一步爽是爽，周一已经在小本子上记账。";
  }

  if (score >= 16 && (energy < 0 || mood < 0)) {
    return "绩效往前冲了一格，代价也写进电量表。";
  }

  if (energy + mood >= 20 && score <= 8) {
    return "你先把人保住，工作明天才有操作系统。";
  }

  if (energy > 0 && mood < 0) {
    return "身体启动了，情绪账户被刷了一笔。";
  }

  if (score < 0) {
    return "短暂省力不等于没有成本，下一轮会来收账。";
  }

  return "这一步改变了节奏，下一件事已经在排队。";
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
  const subcopy = getFeedbackSubcopy(selectedChoice);

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
      <p className="ms-claude-feedback-sub">{subcopy}</p>

      {nextEvent ? (
        <>
          <div className="ms-claude-next-chip">
            <SkinIcon name={nextEvent.visual ?? "alarm"} />
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
