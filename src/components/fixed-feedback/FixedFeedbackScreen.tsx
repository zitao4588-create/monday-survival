import feedbackBackground from "../../assets/backgrounds/feedback-background-fixed@2x.jpg";
import { formatPerformance, getStatSegmentCount } from "../../gameViewModels";
import "../../styles/fixed-feedback.css";
import { ChoiceIcon } from "../ChoiceIcon";
import { ViewportAssist } from "../ViewportAssist";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "../skin/SkinIcon";

export interface FixedFeedbackScreenProps {
  currentRound: number;
  nextEvent?: EventViewModel;
  onContinue?: () => void;
  selectedChoice: ChoiceViewModel;
  stats: StatViewModel[];
  totalRounds: number;
}

const statKinds: StatViewModel["kind"][] = ["energy", "mood", "score"];

const statIcons: Record<StatViewModel["kind"], SkinIconName> = {
  energy: "energy",
  mood: "mood",
  score: "score"
};

function getDisplayValue(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : String(delta);
}

function splitFeedback(text: string) {
  if (text.length <= 13) {
    return [text];
  }

  const commaIndex = text.search(/[，,]/);
  if (commaIndex >= Math.floor(text.length * 0.4) && commaIndex <= Math.ceil(text.length * 0.65)) {
    return [text.slice(0, commaIndex + 1), text.slice(commaIndex + 1)];
  }

  const splitIndex = Math.ceil(text.length * 0.6);
  return [text.slice(0, splitIndex), text.slice(splitIndex)];
}

function describeDelta(kind: StatViewModel["kind"], delta: number) {
  const amount = Math.abs(delta);

  if (delta === 0) {
    return `${kind === "energy" ? "能量" : kind === "mood" ? "心情" : "绩效"}不变`;
  }

  if (kind === "energy") {
    return delta > 0 ? `能量回升 ${amount}` : `能量消耗 ${amount}`;
  }

  if (kind === "mood") {
    return delta > 0 ? `心情提升 ${amount}` : `心情下降 ${amount}`;
  }

  return delta > 0 ? `绩效增加 ${amount}` : `绩效减少 ${amount}`;
}

function getFeedbackSummary(selectedChoice: ChoiceViewModel, stats: StatViewModel[]) {
  const effects = statKinds.map((kind) => {
    const stat = stats.find((candidate) => candidate.kind === kind);
    return describeDelta(kind, stat?.delta ?? selectedChoice.effects[kind]);
  });

  return `“${selectedChoice.label}”让${effects.join("，")}。`;
}

function FixedFeedbackStat({ stat }: { stat: StatViewModel }) {
  const isPerformance = stat.kind === "score";
  const displayValue = getDisplayValue(stat.value);
  const fillCount = getStatSegmentCount(stat.kind, displayValue);
  const renderedValue = isPerformance ? formatPerformance(stat.value) : displayValue;
  const deltaTone = stat.delta === undefined
    ? ""
    : stat.delta > 0
      ? " is-positive"
      : stat.delta < 0
        ? " is-negative"
        : " is-neutral";

  return (
    <article
      className={`ms-fixed-feedback-stat ms-fixed-feedback-stat--${stat.kind}`}
      data-stat-kind={stat.kind}
      aria-label={`${stat.label} ${renderedValue}${isPerformance ? "" : "/100"}${stat.delta === undefined ? "" : `，变化 ${formatDelta(stat.delta)}`}`}
    >
      <div className="ms-fixed-feedback-stat__heading">
        <SkinIcon name={statIcons[stat.kind]} />
        <strong>{stat.label}</strong>
        <span>{renderedValue}</span>
        {isPerformance ? null : <small>/100</small>}
      </div>
      {isPerformance ? null : (
        <div className="ms-fixed-feedback-stat__bar" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span className={index < fillCount ? "is-filled" : undefined} key={index} />
          ))}
        </div>
      )}
      {stat.delta === undefined ? null : (
        <strong className={`ms-fixed-feedback-stat__delta${deltaTone}`} data-delta-kind={stat.kind}>
          {formatDelta(stat.delta)}
        </strong>
      )}
    </article>
  );
}

export function FixedFeedbackScreen({
  currentRound,
  nextEvent,
  onContinue,
  selectedChoice,
  stats,
  totalRounds
}: FixedFeedbackScreenProps) {
  const orderedStats = statKinds
    .map((kind) => stats.find((stat) => stat.kind === kind))
    .filter((stat): stat is StatViewModel => Boolean(stat));
  const feedbackLines = splitFeedback(selectedChoice.description);
  const feedbackSummary = getFeedbackSummary(selectedChoice, orderedStats);
  const isFinalRound = currentRound >= totalRounds;
  const continueLabel = nextEvent ? "继续" : "查看结果";

  return (
    <section className="ms-fixed-feedback-screen" aria-label="选择反馈">
      <img
        className="ms-fixed-feedback-background"
        src={feedbackBackground}
        alt=""
        aria-hidden="true"
      />

      <header className="ms-fixed-feedback-header">
        <div className="ms-fixed-feedback-header__copy">
          <h1>活过周一</h1>
          <p>打工人生存测试</p>
        </div>
        <div className="ms-fixed-feedback-header__round" aria-label={`第 ${currentRound}/${totalRounds} 回合`}>
          <span>第</span>
          <strong>{currentRound}</strong>
          <span>/ {totalRounds} 回合</span>
        </div>
      </header>

      <section className="ms-fixed-feedback-stats" aria-label="选择后的状态">
        {orderedStats.map((stat) => <FixedFeedbackStat key={stat.kind} stat={stat} />)}
      </section>

      <div className="ms-fixed-feedback-selected">
        <span>已选择：</span>
        <strong>{selectedChoice.label}</strong>
      </div>

      <article className="ms-fixed-feedback-message">
        <div
          aria-hidden="true"
          className="ms-fixed-feedback-message__icon"
          data-fixed-choice-icon={selectedChoice.visual}
        >
          <ChoiceIcon name={selectedChoice.visual} />
        </div>
        <h2>
          {feedbackLines.map((line) => <span key={line}>{line}</span>)}
        </h2>
        <p aria-atomic="true" aria-live="polite" role="status">{feedbackSummary}</p>
      </article>

      {nextEvent ? (
        <section className="ms-fixed-feedback-next" aria-label="下一事件预告">
          <strong className="ms-fixed-feedback-next__label">下一事件预告</strong>
          <div className="ms-fixed-feedback-next__time">
            <SkinIcon name="alarm" />
            <time>{nextEvent.time}</time>
          </div>
          <h2>{nextEvent.title}</h2>
          <p>{nextEvent.body}</p>
          {nextEvent.visual ? (
            <SkinIcon className="ms-fixed-feedback-next__visual" name={nextEvent.visual} />
          ) : null}
        </section>
      ) : (
        <section className="ms-fixed-feedback-next ms-fixed-feedback-next--complete" aria-label="本周结算">
          <strong className="ms-fixed-feedback-next__label">本周结算</strong>
          <div className="ms-fixed-feedback-next__time">
            <SkinIcon name="check" />
            <span>已结束</span>
          </div>
          <h2>{isFinalRound ? "周一已收工" : "本轮提前结束"}</h2>
          <p>
            {isFinalRound
              ? "五个事件已经处理完毕，查看本周生存结果。"
              : "能量或心情已经见底，先查看本周生存结果。"}
          </p>
          <SkinIcon className="ms-fixed-feedback-next__visual" name="coffee" />
        </section>
      )}

      <button
        aria-label={continueLabel}
        className="ms-fixed-feedback-continue"
        type="button"
        onClick={onContinue}
      >
        <span>{continueLabel}</span>
      </button>

      <ViewportAssist actionBottom={853} className="ms-viewport-assist--feedback">
        <button
          aria-label={`${continueLabel}（固定操作）`}
          className="ms-viewport-assist__primary"
          onClick={onContinue}
          type="button"
        >
          {continueLabel}
        </button>
      </ViewportAssist>
    </section>
  );
}
