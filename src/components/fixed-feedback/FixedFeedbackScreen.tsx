import { useEffect, useState } from "react";
import feedbackBackground from "../../assets/backgrounds/feedback-background-fixed@2x.jpg";
import {
  formatPerformance,
  getPerformanceMeterSegments,
  getStatSegmentCount
} from "../../gameViewModels";
import "../../styles/fixed-feedback.css";
import { ChoiceIcon } from "../ChoiceIcon";
import { ViewportAssist } from "../ViewportAssist";
import type { ChoiceViewModel, StatViewModel } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "../skin/SkinIcon";

export interface FixedFeedbackScreenProps {
  currentRound: number;
  isRunComplete: boolean;
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
  const renderedValue = isPerformance ? formatPerformance(stat.value) : displayValue;
  const performanceSegments = isPerformance ? getPerformanceMeterSegments(stat.value) : null;
  const fillCount = isPerformance ? 0 : getStatSegmentCount(stat.kind, stat.value);
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
      <div
        className={`ms-fixed-feedback-stat__bar${isPerformance ? " ms-performance-meter" : ""}`}
        data-performance-direction={isPerformance ? (stat.value < 0 ? "negative" : stat.value > 0 ? "positive" : "zero") : undefined}
        aria-hidden="true"
      >
        {(performanceSegments ?? Array.from({ length: 7 }, (_, index) => index < fillCount ? "filled" : "empty"))
          .map((segment, index) => (
            <span
              className={segment === "filled" ? "is-filled" : `is-${segment}`}
              data-meter-segment={isPerformance ? segment : undefined}
              key={index}
            >
              {segment === "zero" ? <small>0</small> : null}
            </span>
          ))}
      </div>
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
  isRunComplete,
  onContinue,
  selectedChoice,
  stats,
  totalRounds
}: FixedFeedbackScreenProps) {
  const [continueEmphasized, setContinueEmphasized] = useState(false);
  const orderedStats = statKinds
    .map((kind) => stats.find((stat) => stat.kind === kind))
    .filter((stat): stat is StatViewModel => Boolean(stat));
  const feedbackLines = splitFeedback(selectedChoice.description);
  const feedbackSummary = getFeedbackSummary(selectedChoice, orderedStats);
  const continueLabel = isRunComplete ? "查看结果" : "继续";
  const hasDangerDrop = orderedStats.some((stat) => (stat.delta ?? 0) <= -15);

  useEffect(() => {
    setContinueEmphasized(false);
    const timer = window.setTimeout(() => setContinueEmphasized(true), 1_000);
    return () => window.clearTimeout(timer);
  }, [currentRound, selectedChoice.id]);

  return (
    <section
      className={`ms-fixed-feedback-screen${hasDangerDrop ? " is-danger" : ""}`}
      aria-label="选择反馈"
    >
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
      </article>

      <p
        className="ms-fixed-feedback-status--hidden"
        aria-atomic="true"
        aria-live="polite"
        role="status"
      >
        {feedbackSummary}
      </p>

      <section className="ms-fixed-feedback-summary" aria-label="这一手的代价">
        <strong className="ms-fixed-feedback-summary__label">这一手的代价</strong>
        <p>{selectedChoice.impactSummary}</p>
      </section>

      <button
        aria-label={continueLabel}
        className={`ms-fixed-feedback-continue${continueEmphasized ? " is-emphasized" : ""}`}
        type="button"
        onClick={onContinue}
      >
        <span>{continueLabel}</span>
      </button>

      <ViewportAssist actionBottom={853} className="ms-viewport-assist--feedback">
        <button
          aria-label={`${continueLabel}（固定操作）`}
          className={`ms-viewport-assist__primary${continueEmphasized ? " is-emphasized" : ""}`}
          onClick={onContinue}
          type="button"
        >
          {continueLabel}
        </button>
      </ViewportAssist>
    </section>
  );
}
