import fixedRoundBackground from "../../assets/backgrounds/round-background-fixed@2x.png";
import { getStatSegmentCount } from "../../gameViewModels";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "../skin/SkinIcon";

export interface FixedRoundScreenProps {
  choices: ChoiceViewModel[];
  currentRound: number;
  event: EventViewModel;
  onChoose?: (choice: ChoiceViewModel) => void;
  stats: StatViewModel[];
  totalRounds: number;
}

const statIcons: Record<StatViewModel["kind"], SkinIconName> = {
  energy: "energy",
  mood: "mood",
  score: "score"
};

const roundStatKinds: StatViewModel["kind"][] = ["energy", "mood", "score"];
const choiceTones = ["green", "yellow", "red"] as const;
const fixedChoiceVisuals = ["water", "alarm", "coffee"] as const satisfies readonly SkinIconName[];

export function getFixedChoiceVisual(index: number): SkinIconName {
  return fixedChoiceVisuals[index] ?? "water";
}

function splitChineseSentences(text: string) {
  return text.match(/[^。！？]+[。！？]?/g)?.map((line) => line.trim()).filter(Boolean) ?? [text];
}

function getDisplayValue(value: number) {
  return Math.max(0, Math.min(100, value));
}

interface FixedStatProps {
  stat: StatViewModel;
}

function FixedStat({ stat }: FixedStatProps) {
  const displayValue = getDisplayValue(stat.value);
  const fillCount = getStatSegmentCount(stat.kind, displayValue);

  return (
    <article
      aria-label={`${stat.label} ${displayValue}/100`}
      className={`ms-fixed-stat ms-fixed-stat--${stat.kind}`}
      data-stat-kind={stat.kind}
    >
      <div className="ms-fixed-stat__heading">
        <SkinIcon name={statIcons[stat.kind]} />
        <strong>{stat.label}</strong>
        <span className="ms-fixed-stat__value">{displayValue}</span>
        <small>/100</small>
      </div>
      <div className="ms-fixed-stat__bar" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <span className={index < fillCount ? "is-filled" : undefined} key={index} />
        ))}
      </div>
    </article>
  );
}

interface FixedChoiceProps {
  choice: ChoiceViewModel;
  index: number;
  onChoose?: (choice: ChoiceViewModel) => void;
}

function FixedChoice({ choice, index, onChoose }: FixedChoiceProps) {
  const tone = choiceTones[index] ?? "green";
  const number = String(index + 1).padStart(2, "0");
  const fixedVisual = getFixedChoiceVisual(index);

  return (
    <button
      aria-label={`选择 ${number}：${choice.label}。${choice.preview}`}
      className={`ms-fixed-choice ms-fixed-choice--${tone}`}
      data-fixed-choice-icon={fixedVisual}
      onClick={() => onChoose?.(choice)}
      type="button"
    >
      <span className="ms-fixed-choice__number" aria-hidden="true">{number}</span>
      <span className="ms-fixed-choice__icon" aria-hidden="true">
        <SkinIcon name={fixedVisual} />
      </span>
      <span className="ms-fixed-choice__copy">
        <strong>{choice.label}</strong>
        <small>{choice.preview}</small>
      </span>
    </button>
  );
}

export function FixedRoundScreen({
  choices,
  currentRound,
  event,
  onChoose,
  stats,
  totalRounds
}: FixedRoundScreenProps) {
  const bodyLines = splitChineseSentences(event.body);
  const orderedStats = roundStatKinds
    .map((kind) => stats.find((stat) => stat.kind === kind))
    .filter((stat): stat is StatViewModel => Boolean(stat));

  return (
    <section className="ms-fixed-round-screen" aria-label="当前回合">
      <img
        className="ms-fixed-round-background"
        src={fixedRoundBackground}
        alt=""
        aria-hidden="true"
      />

      <header className="ms-fixed-header">
        <div className="ms-fixed-header__copy">
          <h1>活过周一</h1>
          <p>打工人生存测试</p>
        </div>
        <div className="ms-fixed-header__round" aria-label={`第 ${currentRound}/${totalRounds} 回合`}>
          <span>第</span>
          <strong>{currentRound}</strong>
          <span>/ {totalRounds} 回合</span>
        </div>
      </header>

      <section className="ms-fixed-stats" aria-label="当前状态">
        {orderedStats.map((stat) => <FixedStat key={stat.kind} stat={stat} />)}
      </section>

      <article className="ms-fixed-event" aria-label="当前事件">
        <div className="ms-fixed-event__heading">
          {event.time ? <time>{event.time}</time> : null}
          <h2>{event.title}</h2>
        </div>
        <p>
          {bodyLines.map((line) => <span key={line}>{line}</span>)}
        </p>
      </article>

      <section className="ms-fixed-choices" aria-label="选择一项行动">
        {choices.map((choice, index) => (
          <FixedChoice key={choice.id} choice={choice} index={index} onChoose={onChoose} />
        ))}
      </section>

      <aside className="ms-fixed-tip">
        <strong>小贴士</strong>
        <p>每个选择都会影响你的能量、心情和得分。</p>
      </aside>
    </section>
  );
}
