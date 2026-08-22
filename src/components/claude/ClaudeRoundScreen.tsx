import bgRoundBase from "../../assets/claude-ui/bg-round-no-rules-2x.jpg";
import statProgressCell from "../../assets/component-skins/stat-progress-cell@2x.png";
import type { ChoiceViewModel, EventViewModel, StatViewModel } from "../visualTypes";
import { ChoiceIcon } from "../ChoiceIcon";
import { getStatSegmentCount } from "../../gameViewModels";

export interface ClaudeRoundScreenProps {
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

function getStat(stats: StatViewModel[], kind: StatViewModel["kind"]) {
  return stats.find((stat) => stat.kind === kind) ?? { kind, label: "", value: 0 };
}

function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function getDeltaLabel(label: string, value: number) {
  if (value > 0) {
    return `${label}增加 ${value}`;
  }

  if (value < 0) {
    return `${label}减少 ${Math.abs(value)}`;
  }

  return `${label}不变`;
}

function getDeltaTone(value: number) {
  if (value > 0) {
    return "positive";
  }

  if (value < 0) {
    return "negative";
  }

  return "neutral";
}

interface ClaudeStatsProps {
  showDelta?: boolean;
  stats: StatViewModel[];
}

const statOrder = ["energy", "mood", "score"] as const;

export function ClaudeStats({ showDelta = false, stats }: ClaudeStatsProps) {
  const orderedStats = statOrder.map((kind) => getStat(stats, kind));

  return (
    <div className="ms-claude-stat-grid" aria-label="当前状态">
      {orderedStats.map((stat) => {
        const filledSegments = getStatSegmentCount(stat.kind, stat.value);

        return (
          <div
            aria-label={`${stat.label} ${stat.value}/100`}
            className="ms-claude-stat-card"
            data-stat-kind={stat.kind}
            key={stat.kind}
          >
            <div className="ms-claude-stat-card__content">
              <div className="ms-claude-stat-card__topline">
                <span className="ms-visually-hidden">{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>/100</small>
              </div>
              <div className="ms-claude-stat-bar" aria-hidden="true">
                {Array.from({ length: 7 }, (_, index) => (
                  <img
                    alt=""
                    className={index < filledSegments ? "is-filled" : ""}
                    key={index}
                    src={statProgressCell}
                  />
                ))}
              </div>
            </div>
            {showDelta ? (
              <b
                aria-label={getDeltaLabel(stat.label, stat.delta ?? 0)}
                className={`ms-claude-delta-tag ms-claude-delta-tag--${stat.kind} ms-claude-delta-tag--${getDeltaTone(stat.delta ?? 0)}`}
                data-delta-kind={stat.kind}
              >
                {formatDelta(stat.delta ?? 0)}
              </b>
            ) : null}
          </div>
        );
      })}
      {showDelta ? (
        <span className="ms-visually-hidden" role="status" aria-atomic="true" aria-live="polite">
          {orderedStats.map((stat) => getDeltaLabel(stat.label, stat.delta ?? 0)).join("，")}
        </span>
      ) : null}
    </div>
  );
}

interface ClaudeChoiceTicketProps {
  choice: ChoiceViewModel;
  index: number;
  onChoose?: (choice: ChoiceViewModel) => void;
}

function ClaudeChoiceTicket({ choice, index, onChoose }: ClaudeChoiceTicketProps) {
  return (
    <button
      className="ms-claude-choice-ticket"
      type="button"
      onClick={() => onChoose?.(choice)}
    >
      <span className="ms-claude-choice-ticket__shape" aria-hidden="true" />
      <span className="ms-claude-choice-ticket__spine">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="ms-claude-choice-ticket__row">
        <span className="ms-claude-choice-ticket__icon" aria-hidden="true">
          <ChoiceIcon name={choice.visual} />
        </span>
        <span className="ms-claude-choice-ticket__copy">
          <strong>{choice.label}</strong>
          <small>{choice.preview}</small>
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
      <div className="ms-claude-event-copy">
        <p className="ms-claude-event-body">
          {bodyLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <div className="ms-claude-event-rules" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="ms-claude-choice-list">
        {choices.map((choice, index) => (
          <ClaudeChoiceTicket key={choice.id} choice={choice} index={index} onChoose={onChoose} />
        ))}
      </div>
    </section>
  );
}
