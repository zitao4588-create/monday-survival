import { PrintIcon } from "./PrintIcon";
import type { PrintIconName } from "./PrintIcon";
import type { ChoiceViewModel } from "./visualTypes";

type ChoiceTone = "green" | "gold" | "rust";

const choiceTones: ChoiceTone[] = ["green", "gold", "rust"];

export interface ChoiceTicketProps {
  choice: ChoiceViewModel;
  index: number;
  onChoose?: (choice: ChoiceViewModel) => void;
}

interface ChoiceDeltaProps {
  icon: PrintIconName;
  value: number;
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function ChoiceDelta({ icon, value }: ChoiceDeltaProps) {
  const deltaTone = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";

  return (
    <span className={`ms-choice-delta ms-choice-delta--${deltaTone}`}>
      <PrintIcon name={icon} />
      {formatDelta(value)}
    </span>
  );
}

export function ChoiceTicket({ choice, index, onChoose }: ChoiceTicketProps) {
  const tone = choiceTones[index] ?? "green";

  return (
    <button
      className={`ms-choice-ticket ms-choice-ticket--${tone} ms-paper ms-paper--light ms-ticket`}
      type="button"
      onClick={() => onChoose?.(choice)}
    >
      <span className="ms-choice-ticket__index">{String(index + 1).padStart(2, "0")}</span>
      <span className="ms-choice-ticket__icon" aria-hidden="true">
        <PrintIcon name={choice.visual} />
      </span>
      <span className="ms-choice-ticket__copy">
        <strong>{choice.label}</strong>
        <small>{choice.description}</small>
      </span>
      <span className="ms-choice-ticket__effects" aria-label="选择影响">
        <ChoiceDelta icon="lightning" value={choice.effects.energy} />
        <ChoiceDelta icon="mood" value={choice.effects.mood} />
        <ChoiceDelta icon="star" value={choice.effects.score} />
      </span>
      <span className="ms-choice-ticket__arrow" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
