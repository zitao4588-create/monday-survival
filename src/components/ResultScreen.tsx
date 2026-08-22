import { EndingTitle } from "./EndingTitle";
import { FinalStats } from "./FinalStats";
import { PaperHeader } from "./PaperHeader";
import { PersonaTag } from "./PersonaTag";
import { ResultActions } from "./ResultActions";
import { ResultFolder } from "./ResultFolder";
import { ResultIllustration } from "./ResultIllustration";
import type { ResultViewModel, StatViewModel } from "./visualTypes";

export interface ResultScreenProps {
  onCloseResultImage?: () => void;
  onRestart?: () => void;
  onSaveResult?: () => void;
  onShareText?: () => void;
  result: ResultViewModel;
  resultImageUrl?: string | null;
  shareStatus?: "copied" | "failed" | "generating" | "idle" | "ready" | "screenshot";
  stats: StatViewModel[];
}

function getShareStatusText(shareStatus: NonNullable<ResultScreenProps["shareStatus"]>) {
  if (__XHS_BUILD__) {
    return shareStatus === "screenshot" ? "请使用系统截图保存当前结果。" : null;
  }

  if (shareStatus === "generating") {
    return "正在生成结果图…";
  }

  if (shareStatus === "ready") {
    return "结果图已生成，长按可保存。";
  }

  if (shareStatus === "copied") {
    return "分享文案已准备好，可以发给同事。";
  }

  if (shareStatus === "failed") {
    return "暂时无法生成，请手动截图。";
  }

  return null;
}

export function ResultScreen({
  onCloseResultImage,
  onRestart,
  onSaveResult,
  onShareText,
  result,
  resultImageUrl,
  shareStatus = "idle",
  stats
}: ResultScreenProps) {
  const statusMessage = getShareStatusText(shareStatus);

  return (
    <div className="ms-screen ms-screen--result" aria-label="结果分享卡">
      <PaperHeader badge="本周结果" />
      <section className="ms-result-dossier" aria-label="本周生存报告">
        <div className="ms-result-dossier__backing" aria-hidden="true" />
        <ResultFolder>
          <ResultIllustration />
          <EndingTitle result={result} />
          <FinalStats stats={stats} />
          <PersonaTag result={result} />
          <ResultActions
            onRestart={onRestart}
            onSaveResult={onSaveResult}
            saveLabel={__XHS_BUILD__ ? "保存结果图" : "生成结果图"}
            statusMessage={resultImageUrl ? null : statusMessage}
          />
        </ResultFolder>
      </section>
      <p className="ms-result-thanks">感谢你的努力，周二会更温柔。</p>
      {!__XHS_BUILD__ && resultImageUrl ? (
        <div className="ms-poster-modal" role="dialog" aria-modal="true" aria-label="保存结果图">
          <div className="ms-poster-panel">
            <button className="ms-poster-close" type="button" onClick={onCloseResultImage} aria-label="关闭结果图">
              ×
            </button>
            <img className="ms-poster-preview" src={resultImageUrl} alt="可保存的周一结果图" />
            <p className="ms-poster-hint">长按保存结果图</p>
            <div className="ms-poster-actions">
              <a className="ms-poster-action" href={resultImageUrl} download="monday-survival-result.png">
                下载图片
              </a>
              <button className="ms-poster-action" type="button" onClick={onShareText}>
                分享文案
              </button>
            </div>
            {statusMessage ? (
              <p className="ms-poster-status" role="status">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
