import { PrintIcon } from "./PrintIcon";
import type { ChoiceViewModel } from "./visualTypes";

export interface SelectedReceiptProps {
  choice: ChoiceViewModel;
}

export function SelectedReceipt({ choice }: SelectedReceiptProps) {
  return (
    <div className="ms-feedback-slip__selected">
      <PrintIcon name="check" />
      <span>已选择：</span>
      <strong>{choice.label}</strong>
    </div>
  );
}
