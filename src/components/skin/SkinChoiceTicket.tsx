import choiceTicketGreen from "../../assets/skin-v2/choice-ticket-green@2x.png";
import choiceTicketRed from "../../assets/skin-v2/choice-ticket-red@2x.png";
import choiceTicketYellow from "../../assets/skin-v2/choice-ticket-yellow@2x.png";
import type { ChoiceViewModel } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "./SkinIcon";

type ChoiceTone = "green" | "red" | "yellow";

const choiceTones: ChoiceTone[] = ["green", "yellow", "red"];
const choiceAsset: Record<ChoiceTone, string> = {
  green: choiceTicketGreen,
  red: choiceTicketRed,
  yellow: choiceTicketYellow
};

export interface SkinChoiceTicketProps {
  choice: ChoiceViewModel;
  index: number;
  onChoose?: (choice: ChoiceViewModel) => void;
}

interface ChoiceDeltaProps {
  icon: SkinIconName;
  value: number;
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function ChoiceDelta({ icon, value }: ChoiceDeltaProps) {
  const deltaTone = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";

  return (
    <span className={`ms-skin-choice-delta ms-skin-choice-delta--${deltaTone}`}>
      <SkinIcon name={icon} />
      {formatDelta(value)}
    </span>
  );
}

export function SkinChoiceTicket({ choice, index, onChoose }: SkinChoiceTicketProps) {
  const tone = choiceTones[index] ?? "green";

  return (
    <button
      className={`ms-skin-choice-ticket ms-skin-choice-ticket--${tone}`}
      type="button"
      onClick={() => onChoose?.(choice)}
    >
      <img className="ms-skin-choice-ticket__asset" src={choiceAsset[tone]} alt="" aria-hidden="true" />
      <span className="ms-skin-choice-ticket__index">{String(index + 1).padStart(2, "0")}</span>
      <span className="ms-skin-choice-ticket__icon" aria-hidden="true">
        <SkinIcon name={choice.visual} />
      </span>
      <span className="ms-skin-choice-ticket__copy">
        <strong>{choice.label}</strong>
        <small>{choice.description}</small>
      </span>
      <span className="ms-skin-choice-ticket__effects" aria-label="选择影响">
        <ChoiceDelta icon="energy" value={choice.effects.energy} />
        <ChoiceDelta icon="mood" value={choice.effects.mood} />
        <ChoiceDelta icon="score" value={choice.effects.score} />
      </span>
      <span className="ms-skin-choice-ticket__arrow" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
