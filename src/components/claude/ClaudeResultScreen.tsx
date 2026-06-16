import bgResultClean from "../../assets/claude-ui/bg-result-clean-2x.jpg";
import type { ResultViewModel, StatViewModel } from "../visualTypes";

export interface ClaudeResultScreenProps {
  onCloseResultImage?: () => void;
  onCreateResultImage?: () => void;
  onRestart?: () => void;
  onShareText?: () => void;
  result: ResultViewModel;
  resultImageUrl?: string | null;
  shareStatus?: "copied" | "failed" | "generating" | "idle" | "ready";
  stats: StatViewModel[];
}

function getStat(stats: StatViewModel[], kind: StatViewModel["kind"]) {
  return stats.find((stat) => stat.kind === kind)?.value ?? 0;
}

function getEndingTitleSize(title: string) {
  if (title.length >= 8) {
    return "42px";
  }

  if (title.length >= 5) {
    return "54px";
  }

  return "62px";
}

export function ClaudeResultScreen({
  onCloseResultImage,
  onCreateResultImage,
  onRestart,
  onShareText,
  result,
  resultImageUrl,
  shareStatus = "idle",
  stats
}: ClaudeResultScreenProps) {
  return (
    <section className="ms-claude-screen ms-claude-screen--result" aria-label="结果分享卡">
      <img className="ms-claude-bg" src={bgResultClean} alt="" aria-hidden="true" />

      <h2
        className="ms-claude-ending-title"
        style={{ "--ending-title-size": getEndingTitleSize(result.title) } as React.CSSProperties}
      >
        {result.title}
      </h2>
      <p className="ms-claude-ending-sub">{result.description}</p>

      <strong className="ms-claude-result-num ms-claude-result-num--score">{getStat(stats, "score")}</strong>
      <strong className="ms-claude-result-num ms-claude-result-num--energy">{getStat(stats, "energy")}</strong>
      <strong className="ms-claude-result-num ms-claude-result-num--mood">{getStat(stats, "mood")}</strong>

      <strong className="ms-claude-persona-pill">{result.personaLabel}</strong>
      <p className="ms-claude-persona-quote">
        <span>“</span>
        {result.personaQuote}
        <span>”</span>
      </p>

      <button className="ms-claude-result-button ms-claude-result-button--restart" type="button" onClick={onRestart} aria-label="再活一次周一" />
      <button className="ms-claude-result-button ms-claude-result-button--share" type="button" onClick={onCreateResultImage} aria-label="生成结果图" />

      {shareStatus !== "idle" ? (
        <p className="ms-claude-share-status" role="status">
          {shareStatus === "generating" ? "正在生成结果图…" : null}
          {shareStatus === "ready" ? "结果图已生成，长按可保存。" : null}
          {shareStatus === "copied" ? "分享文案已准备好，可以发给同事。" : null}
          {shareStatus === "failed" ? "暂时无法生成，请手动截图。" : null}
        </p>
      ) : null}

      {resultImageUrl ? (
        <div className="ms-claude-poster-modal" role="dialog" aria-modal="true" aria-label="保存结果图">
          <div className="ms-claude-poster-panel">
            <button className="ms-claude-poster-close" type="button" onClick={onCloseResultImage} aria-label="关闭结果图">
              ×
            </button>
            <img className="ms-claude-poster-preview" src={resultImageUrl} alt="可保存的周一结果图" />
            <p className="ms-claude-poster-hint">长按保存结果图</p>
            <div className="ms-claude-poster-actions">
              <a className="ms-claude-poster-action" href={resultImageUrl} download="monday-survival-result.png">
                下载图片
              </a>
              <button className="ms-claude-poster-action" type="button" onClick={onShareText}>
                分享文案
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
