import { ChoiceTicket } from "./ChoiceTicket";
import type { ChoiceViewModel } from "./visualTypes";

export interface ChoiceListProps {
  choices: ChoiceViewModel[];
  onChoose?: (choice: ChoiceViewModel) => void;
}

export function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <section className="ms-choice-list" aria-label="选择一项行动">
      {choices.map((choice, index) => (
        <ChoiceTicket key={choice.id} choice={choice} index={index} onChoose={onChoose} />
      ))}
    </section>
  );
}
