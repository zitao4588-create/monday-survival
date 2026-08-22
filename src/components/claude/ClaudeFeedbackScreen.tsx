import bgFeedbackOriginal from "../../assets/claude-ui/bg-feedback-clean-2x.jpg";
import bgFeedbackNoPreview from "../../assets/claude-ui/bg-feedback-no-preview-2x.jpg";
import type { ChoiceViewModel, StatViewModel } from "../visualTypes";
import { ClaudeStats } from "./ClaudeRoundScreen";

export interface ClaudeFeedbackScreenProps {
  currentRound: number;
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
    return "短暂省力不等于没有成本，变化已经记到账上。";
  }

  return "这一步改变了节奏，变化已经记到账上。";
}

export function ClaudeFeedbackScreen({
  currentRound,
  onContinue,
  selectedChoice,
  stats,
  totalRounds
}: ClaudeFeedbackScreenProps) {
  const feedbackLines = splitFeedback(selectedChoice.description);
  const subcopy = getFeedbackSubcopy(selectedChoice);
  const isFinalRound = currentRound >= totalRounds;

  return (
    <section className="ms-claude-screen ms-claude-screen--feedback" aria-label="选择反馈">
      <img className="ms-claude-bg" src={bgFeedbackOriginal} alt="" aria-hidden="true" />
      <img
        className="ms-claude-bg ms-claude-bg--feedback-preview-cover"
        src={bgFeedbackNoPreview}
        alt=""
        aria-hidden="true"
      />

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

      <section className="ms-claude-settlement" aria-label={isFinalRound ? "本局结算" : "本回合结算"}>
        <div className="ms-claude-settlement__label">{isFinalRound ? "本局结算" : "本回合结算"}</div>
        <h2>{isFinalRound ? "你的周一人格已生成" : "状态已更新"}</h2>
        <p>{isFinalRound ? "最后一笔变化已记账，继续查看结果" : "本回合变化已记账，继续进入下一回合"}</p>
      </section>

      <button className="ms-claude-feedback-button" type="button" onClick={onContinue} aria-label="继续">
        <span className="ms-visually-hidden">继续</span>
      </button>
    </section>
  );
}
