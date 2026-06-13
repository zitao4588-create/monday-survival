import { PrintIcon } from "./PrintIcon";

export interface ResultActionsProps {
  onRestart?: () => void;
  onShare?: () => void;
  shareStatus?: "copied" | "failed" | "idle";
}

export function ResultActions({ onRestart, onShare, shareStatus = "idle" }: ResultActionsProps) {
  return (
    <div className="ms-result-actions">
      <button className="ms-primary-action" type="button" onClick={onRestart}>
        <span>再活一次周一</span>
        <PrintIcon name="arrowRight" />
      </button>
      <button className="ms-secondary-action" type="button" onClick={onShare}>
        <PrintIcon name="download" />
        <span>保存结果图</span>
      </button>
      {shareStatus !== "idle" ? (
        <p className="ms-share-status" role="status">
          {shareStatus === "copied" ? "分享文案已准备好。" : "暂时无法生成分享内容。"}
        </p>
      ) : null}
    </div>
  );
}
