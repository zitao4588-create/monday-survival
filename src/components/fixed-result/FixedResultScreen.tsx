import resultBackground from "../../assets/backgrounds/result-background-fixed@2x.jpg";
import { formatPerformance } from "../../gameViewModels";
import "../../styles/fixed-result.css";
import { PrintIcon } from "../PrintIcon";
import { ViewportAssist } from "../ViewportAssist";
import type { ResultViewModel, StatViewModel } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "../skin/SkinIcon";

const isXhsBuild = import.meta.env.MODE === "xhs";

export type ResultShareStatus =
  | "cancelled"
  | "copied"
  | "failed"
  | "generating"
  | "idle"
  | "ready"
  | "shared"
  | "sharing";

export interface FixedResultScreenProps {
  onCloseResultImage?: () => void;
  onCreateResultImage?: () => void;
  onRestart?: () => void;
  onShareText?: () => void;
  result: ResultViewModel;
  resultImageUrl?: string | null;
  shareStatus?: ResultShareStatus;
  stats: StatViewModel[];
}

const resultStatKinds: StatViewModel["kind"][] = ["score", "energy", "mood"];

const statIcons: Record<StatViewModel["kind"], SkinIconName> = {
  energy: "energy",
  mood: "mood",
  score: "score"
};

function getShareStatusText(shareStatus: NonNullable<FixedResultScreenProps["shareStatus"]>) {
  if (shareStatus === "generating") {
    return "正在生成结果图…";
  }

  if (shareStatus === "ready") {
    return isXhsBuild ? "结果图已生成，请长按图片或使用系统截图保存。" : "结果图已生成，长按可保存。";
  }

  if (shareStatus === "failed") {
    return "操作失败，请重试或手动截图。";
  }

  if (!isXhsBuild && shareStatus === "copied") {
    return "分享文案已复制，可以发给同事。";
  }

  if (!isXhsBuild && shareStatus === "sharing") {
    return "正在打开系统分享…";
  }

  if (!isXhsBuild && shareStatus === "shared") {
    return "分享已完成。";
  }

  if (!isXhsBuild && shareStatus === "cancelled") {
    return "已取消分享，未复制任何内容。";
  }

  return null;
}

function getDisplayValue(value: number) {
  return Math.max(0, Math.min(100, value));
}

function FixedResultStat({ stat }: { stat: StatViewModel }) {
  const isPerformance = stat.kind === "score";
  const displayValue = getDisplayValue(stat.value);
  const renderedValue = isPerformance ? formatPerformance(stat.value) : displayValue;

  return (
    <article
      aria-label={isPerformance ? `${stat.label} ${renderedValue}` : `${stat.label} ${displayValue}/100`}
      className={`ms-fixed-result-stat ms-fixed-result-stat--${stat.kind}`}
      data-stat-kind={stat.kind}
    >
      <div className="ms-fixed-result-stat__heading">
        <SkinIcon name={statIcons[stat.kind]} />
        <strong>{stat.label}</strong>
      </div>
      <span>{renderedValue}</span>
      {isPerformance ? null : <small>/ 100</small>}
    </article>
  );
}

export function FixedResultScreen({
  onCloseResultImage,
  onCreateResultImage,
  onRestart,
  onShareText,
  result,
  resultImageUrl,
  shareStatus = "idle",
  stats
}: FixedResultScreenProps) {
  const orderedStats = resultStatKinds
    .map((kind) => stats.find((stat) => stat.kind === kind))
    .filter((stat): stat is StatViewModel => Boolean(stat));
  const endingTitleClassName = result.title.length > 6
    ? "ms-fixed-result-ending__title is-long"
    : "ms-fixed-result-ending__title";
  const shareStatusText = getShareStatusText(shareStatus);

  return (
    <section className="ms-fixed-result-screen" aria-label="结果分享卡">
      <img
        className="ms-fixed-result-background"
        src={resultBackground}
        alt=""
        aria-hidden="true"
      />

      <header className="ms-fixed-result-header">
        <div className="ms-fixed-result-header__copy">
          <h1>活过周一</h1>
          <p>打工人生存测试</p>
        </div>
        <strong className="ms-fixed-result-header__badge">本周结果</strong>
      </header>

      <section className="ms-fixed-result-ending" aria-label="本周结局">
        <p className="ms-fixed-result-ending__label">本周结局</p>
        <h2 className={endingTitleClassName}>{result.title}</h2>
        <p className="ms-fixed-result-ending__description">{result.description}</p>
      </section>

      <section className="ms-fixed-result-stats" aria-label="最终状态">
        {orderedStats.map((stat) => <FixedResultStat key={stat.kind} stat={stat} />)}
      </section>

      <section className="ms-fixed-result-persona" aria-label={`今日周一人格：${result.personaLabel}`}>
        <div className="ms-fixed-result-persona__heading">
          <span className="ms-fixed-result-persona__icon" aria-hidden="true" />
          <span>今日周一人格：</span>
          <strong>{result.personaLabel}</strong>
        </div>
        <p>“{result.personaQuote}”</p>
      </section>

      <div className="ms-fixed-result-actions">
        <button
          aria-label="生成结果图"
          className="ms-fixed-result-action ms-fixed-result-action--share"
          type="button"
          onClick={onCreateResultImage}
        >
          <PrintIcon name="download" />
          <span>保存结果图</span>
        </button>
        <button
          aria-label="再活一次周一"
          className="ms-fixed-result-action ms-fixed-result-action--restart"
          type="button"
          onClick={onRestart}
        >
          <span>再活一次周一</span>
        </button>
        {shareStatusText && !resultImageUrl ? (
          <p className="ms-fixed-result-share-status" role="status">
            {shareStatusText}
          </p>
        ) : null}
      </div>

      <p className="ms-fixed-result-thanks">感谢你的努力，周二会更温柔。</p>

      {!resultImageUrl ? (
        <ViewportAssist actionBottom={826} className="ms-viewport-assist--result">
          <button
            aria-label="保存结果图（固定操作）"
            className="ms-viewport-assist__primary"
            onClick={onCreateResultImage}
            type="button"
          >
            保存结果图
          </button>
          <button
            aria-label="再活一次周一（固定操作）"
            className="ms-viewport-assist__secondary"
            onClick={onRestart}
            type="button"
          >
            再活一次周一
          </button>
        </ViewportAssist>
      ) : null}

      {resultImageUrl ? (
        <div className="ms-fixed-result-poster-modal" role="dialog" aria-modal="true" aria-label="保存结果图">
          <div className="ms-fixed-result-poster-panel">
            <button
              aria-label="关闭结果图"
              className="ms-fixed-result-poster-close"
              onClick={onCloseResultImage}
              type="button"
            >
              ×
            </button>
            <img className="ms-fixed-result-poster-preview" src={resultImageUrl} alt="可保存的周一结果图" />
            {isXhsBuild ? (
              <p className="ms-fixed-result-poster-hint">长按图片或使用系统截图保存</p>
            ) : (
              <>
                <p className="ms-fixed-result-poster-hint">长按保存结果图</p>
                <div className="ms-fixed-result-poster-actions">
                  <a
                    className="ms-fixed-result-poster-action"
                    download="monday-survival-result.png"
                    href={resultImageUrl}
                  >
                    下载图片
                  </a>
                  <button className="ms-fixed-result-poster-action" onClick={onShareText} type="button">
                    分享文案
                  </button>
                </div>
              </>
            )}
            {shareStatusText ? (
              <p className="ms-fixed-result-poster-status" role="status">{shareStatusText}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
