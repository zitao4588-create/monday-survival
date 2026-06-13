import { PrintIcon } from "./PrintIcon";

export interface ContinueButtonProps {
  onContinue?: () => void;
}

export function ContinueButton({ onContinue }: ContinueButtonProps) {
  return (
    <button className="ms-primary-action" type="button" onClick={onContinue}>
      <span>继续</span>
      <PrintIcon name="arrowRight" />
    </button>
  );
}
