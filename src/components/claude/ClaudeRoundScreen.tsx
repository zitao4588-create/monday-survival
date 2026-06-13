import bgRoundBase from "../../assets/claude-ui/bg-round-base-2x.jpg";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "../skin/SkinIcon";

export interface ClaudeRoundScreenProps {
  choices: ChoiceViewModel[];
  currentRound: number;
  event: EventViewModel;
  onChoose?: (choice: ChoiceViewModel) => void;
  stats: StatViewModel[];
  totalRounds: number;
}

const choiceTones = ["green", "yellow", "red"] as const;

function splitChineseSentences(text: string) {
  return text.match(/[^。！？]+[。！？]?/g)?.map((line) => line.trim()).filter(Boolean) ?? [text];
}

function getStat(stats: StatViewModel[], kind: StatViewModel["kind"]) {
  return stats.find((stat) => stat.kind === kind) ?? { kind, label: "", value: 0 };
}

function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  if (value < 0) {
    return `−${Math.abs(value)}`;
  }

  return "0";
}

interface ClaudeStatBarProps {
  kind: StatViewModel["kind"];
  value: number;
}

function ClaudeStatBar({ kind, value }: ClaudeStatBarProps) {
  const cells = (Math.max(0, Math.min(100, value)) / 100) * 8;

  return (
    <div className={`ms-claude-stat-bar ms-claude-stat-bar--${kind}`} aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, cells - index));
        return <span key={index} style={{ "--fill": fill } as React.CSSProperties} />;
      })}
    </div>
  );
}

interface ClaudeStatsProps {
  showDelta?: boolean;
  stats: StatViewModel[];
}

export function ClaudeStats({ showDelta = false, stats }: ClaudeStatsProps) {
  const energy = getStat(stats, "energy");
  const mood = getStat(stats, "mood");
  const score = getStat(stats, "score");

  return (
    <>
      <div className="ms-claude-stat-number ms-claude-stat-number--energy">
        <span>{energy.value}</span>
        <small>/100</small>
      </div>
      <div className="ms-claude-stat-number ms-claude-stat-number--mood">
        <span>{mood.value}</span>
        <small>/100</small>
      </div>
      <div className="ms-claude-stat-number ms-claude-stat-number--score">
        <span>{score.value}</span>
        <small>/100</small>
      </div>

      <ClaudeStatBar kind="energy" value={energy.value} />
      <ClaudeStatBar kind="mood" value={mood.value} />
      <ClaudeStatBar kind="score" value={score.value} />

      {showDelta ? (
        <>
          <b className="ms-claude-delta-tag ms-claude-delta-tag--energy">{formatDelta(energy.delta ?? 0)}</b>
          <b className="ms-claude-delta-tag ms-claude-delta-tag--mood">{formatDelta(mood.delta ?? 0)}</b>
          <b className="ms-claude-delta-tag ms-claude-delta-tag--score">{formatDelta(score.delta ?? 0)}</b>
        </>
      ) : null}
    </>
  );
}

interface ChoiceDeltaProps {
  icon: SkinIconName;
  value: number;
}

function ChoiceDelta({ icon, value }: ChoiceDeltaProps) {
  const tone = value < 0 ? "negative" : "positive";

  return (
    <span className={`ms-claude-choice-delta ms-claude-choice-delta--${tone}`}>
      <SkinIcon name={icon} />
      <b>{formatDelta(value)}</b>
    </span>
  );
}

interface ClaudeChoiceTicketProps {
  choice: ChoiceViewModel;
  index: number;
  onChoose?: (choice: ChoiceViewModel) => void;
}

function ClaudeChoiceTicket({ choice, index, onChoose }: ClaudeChoiceTicketProps) {
  const tone = choiceTones[index] ?? "green";

  return (
    <button
      className={`ms-claude-choice-ticket ms-claude-choice-ticket--${tone}`}
      type="button"
      onClick={() => onChoose?.(choice)}
    >
      <span className="ms-claude-choice-ticket__shape" aria-hidden="true" />
      <span className="ms-claude-choice-ticket__spine">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="ms-claude-choice-ticket__row">
        <span className="ms-claude-choice-ticket__icon" aria-hidden="true">
          <SkinIcon name={choice.visual} />
        </span>
        <span className="ms-claude-choice-ticket__copy">
          <strong>{choice.label}</strong>
          <small>{choice.description}</small>
        </span>
        <span className="ms-claude-choice-ticket__deltas" aria-label="选择影响">
          <ChoiceDelta icon="energy" value={choice.effects.energy} />
          <ChoiceDelta icon="mood" value={choice.effects.mood} />
          <ChoiceDelta icon="score" value={choice.effects.score} />
        </span>
        <span className="ms-claude-choice-ticket__chevron" aria-hidden="true">
          ›
        </span>
      </span>
    </button>
  );
}

export function ClaudeRoundScreen({
  choices,
  currentRound,
  event,
  onChoose,
  stats,
  totalRounds
}: ClaudeRoundScreenProps) {
  const bodyLines = splitChineseSentences(event.body);

  return (
    <section className="ms-claude-screen ms-claude-screen--round" aria-label="当前回合">
      <img className="ms-claude-bg" src={bgRoundBase} alt="" aria-hidden="true" />

      <div className="ms-claude-round-box">
        <span>第</span>
        <strong>{currentRound}</strong>
        <span>/</span>
        <span>{totalRounds}</span>
        <span>回合</span>
      </div>

      <ClaudeStats stats={stats} />

      <div className="ms-claude-time-chip">
        <span>{event.time}</span>
      </div>
      <h2 className="ms-claude-event-title">{event.title}</h2>
      <p className="ms-claude-event-body">
        {bodyLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>

      <div className="ms-claude-choice-list">
        {choices.map((choice, index) => (
          <ClaudeChoiceTicket key={choice.id} choice={choice} index={index} onChoose={onChoose} />
        ))}
      </div>
    </section>
  );
}
