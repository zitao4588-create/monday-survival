import resultBackground from "../../assets/backgrounds/result-background-fixed@2x.jpg";
import "../../styles/fixed-result.css";
import { PrintIcon } from "../PrintIcon";
import type { ResultViewModel, StatViewModel } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "../skin/SkinIcon";

const isXhsBuild = import.meta.env.MODE === "xhs";

export interface FixedResultScreenProps {
  onCloseResultImage?: () => void;
  onCreateResultImage?: () => void;
  onRestart?: () => void;
  onShareText?: () => void;
  result: ResultViewModel;
  resultImageUrl?: string | null;
  shareStatus?: "copied" | "failed" | "generating" | "idle" | "ready";
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
    return "暂时无法生成，请手动截图。";
  }

  if (!isXhsBuild && shareStatus === "copied") {
    return "分享文案已准备好，可以发给同事。";
  }

  return null;
}

function getDisplayValue(value: number) {
  return Math.max(0, Math.min(100, value));
}

function FixedResultStat({ stat }: { stat: StatViewModel }) {
  const displayValue = getDisplayValue(stat.value);

  return (
    <article
      aria-label={`${stat.label} ${displayValue}/100`}
      className={`ms-fixed-result-stat ms-fixed-result-stat--${stat.kind}`}
      data-stat-kind={stat.kind}
    >
      <div className="ms-fixed-result-stat__heading">
        <SkinIcon name={statIcons[stat.kind]} />
        <strong>{stat.label}</strong>
      </div>
      <span>{displayValue}</span>
      <small>/ 100</small>
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
          aria-label="再活一次周一"
          className="ms-fixed-result-action ms-fixed-result-action--restart"
          type="button"
          onClick={onRestart}
        >
          <span>再活一次周一</span>
        </button>
        <button
          aria-label="生成结果图"
          className="ms-fixed-result-action ms-fixed-result-action--share"
          type="button"
          onClick={onCreateResultImage}
        >
          <PrintIcon name="download" />
          <span>保存结果图</span>
        </button>
        {shareStatus !== "idle" ? (
          <p className="ms-fixed-result-share-status" role="status">
            {getShareStatusText(shareStatus)}
          </p>
        ) : null}
      </div>

      <p className="ms-fixed-result-thanks">感谢你的努力，周二会更温柔。</p>

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
          </div>
        </div>
      ) : null}
    </section>
  );
}
