import { PrintIcon } from "./PrintIcon";

export interface ResultActionsProps {
  onRestart?: () => void;
  onSaveResult?: () => void;
  saveLabel: string;
  statusMessage?: string | null;
}

export function ResultActions({ onRestart, onSaveResult, saveLabel, statusMessage }: ResultActionsProps) {
  return (
    <div className="ms-result-actions">
      <button className="ms-primary-action" type="button" onClick={onRestart}>
        <span>再活一次周一</span>
        <PrintIcon name="arrowRight" />
      </button>
      <button className="ms-secondary-action" type="button" onClick={onSaveResult} aria-label={saveLabel}>
        <PrintIcon name="download" />
        <span>{saveLabel}</span>
      </button>
      {statusMessage ? (
        <p className="ms-share-status" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
