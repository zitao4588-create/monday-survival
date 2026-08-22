import { PrintIcon } from "./PrintIcon";

export interface ContinueButtonProps {
  onContinue?: () => void;
}

export function ContinueButton({ onContinue }: ContinueButtonProps) {
  return (
    <button className="ms-primary-action" type="button" onClick={onContinue} aria-label="继续">
      <span>继续</span>
      <PrintIcon name="arrowRight" />
    </button>
  );
}
