import { useEffect, useRef, useState } from "react";
import resultBackground from "../../assets/backgrounds/result-background-fixed@2x.jpg";
import { formatPerformance } from "../../gameViewModels";
import type { LocalHistoryEntry } from "../../localHistory";
import type { ResultPresentation } from "../../resultPresentation";
import "../../styles/fixed-result.css";
import { PrintIcon } from "../PrintIcon";
import type { StatViewModel } from "../visualTypes";
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
  history?: LocalHistoryEntry[];
  onClearHistory?: () => void;
  onCloseResultImage?: () => void;
  onCreateResultImage?: () => void;
  onRestart?: () => void;
  onShareText?: () => void;
  onToggleSound?: () => void;
  data: ResultPresentation;
  resultImageUrl?: string | null;
  shareStatus?: ResultShareStatus;
  soundEnabled?: boolean;
}

const statIcons: Record<StatViewModel["kind"], SkinIconName> = {
  energy: "energy",
  mood: "mood",
  score: "score"
};

function getShareStatusText(shareStatus: NonNullable<FixedResultScreenProps["shareStatus"]>) {
  if (shareStatus === "generating") {
    return "正在生成周一战报…";
  }

  if (shareStatus === "ready") {
    return isXhsBuild ? "周一战报已生成，请长按图片或使用系统截图保存。" : "周一战报已生成，长按可保存。";
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
  data,
  history = [],
  onClearHistory,
  onCloseResultImage,
  onCreateResultImage,
  onRestart,
  onShareText,
  onToggleSound,
  resultImageUrl,
  shareStatus = "idle",
  soundEnabled = false
}: FixedResultScreenProps) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const archiveButtonRef = useRef<HTMLButtonElement>(null);
  const archiveCloseButtonRef = useRef<HTMLButtonElement>(null);
  const archiveDialogRef = useRef<HTMLDivElement>(null);
  const archiveReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const wasArchiveOpenRef = useRef(false);
  const cancelClearButtonRef = useRef<HTMLButtonElement>(null);
  const clearHistoryButtonRef = useRef<HTMLButtonElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasPosterOpenRef = useRef(false);
  const orderedStats: StatViewModel[] = [
    { kind: "score", label: "绩效", value: data.score },
    { kind: "energy", label: "能量", value: data.energy },
    { kind: "mood", label: "心情", value: data.mood }
  ];
  const endingTitleClassName = data.personaLabel.length > 6
    ? "ms-fixed-result-ending__title is-long"
    : "ms-fixed-result-ending__title";
  const shareStatusText = getShareStatusText(shareStatus);

  useEffect(() => {
    if (resultImageUrl) {
      wasPosterOpenRef.current = true;
      closeButtonRef.current?.focus({ preventScroll: true });
      return;
    }

    if (wasPosterOpenRef.current) {
      wasPosterOpenRef.current = false;
      createButtonRef.current?.focus({ preventScroll: true });
    }
  }, [resultImageUrl]);

  useEffect(() => {
    if (!resultImageUrl) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseResultImage?.();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCloseResultImage, resultImageUrl]);

  useEffect(() => {
    if (!archiveOpen) {
      return;
    }

    archiveCloseButtonRef.current?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeArchive();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(
        archiveDialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])"
        ) ?? []
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1) ?? first;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [archiveOpen]);

  useEffect(() => {
    if (archiveOpen) {
      wasArchiveOpenRef.current = true;
      return;
    }

    if (wasArchiveOpenRef.current) {
      wasArchiveOpenRef.current = false;
      archiveReturnFocusRef.current?.focus({ preventScroll: true });
    }
  }, [archiveOpen]);

  useEffect(() => {
    if (clearConfirmationOpen) {
      cancelClearButtonRef.current?.focus({ preventScroll: true });
    }
  }, [clearConfirmationOpen]);

  function closeArchive() {
    setArchiveOpen(false);
    setClearConfirmationOpen(false);
  }

  function openArchive(trigger: HTMLButtonElement) {
    archiveReturnFocusRef.current = trigger;
    setArchiveOpen(true);
  }

  return (
    <section className="ms-fixed-result-screen" aria-label="结果分享卡">
      <div
        className="ms-fixed-result-underlay"
        inert={resultImageUrl || archiveOpen ? true : undefined}
      >
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
          <strong className="ms-fixed-result-header__badge">今日结果</strong>
        </header>

        <section className="ms-fixed-result-ending" aria-label={`今日周一人格：${data.personaLabel}`}>
          <p className="ms-fixed-result-ending__label">今日周一人格</p>
          <h2 className={endingTitleClassName}>{data.personaLabel}</h2>
          <p className="ms-fixed-result-ending__subtitle">今日结局：{data.todayEnding}</p>
          <p className="ms-fixed-result-ending__quote">“{data.personaQuote}”</p>
          <p className="ms-fixed-result-ending__description">{data.description}</p>
        </section>

        <section className="ms-fixed-result-stats" aria-label="今日最终状态">
          {orderedStats.map((stat) => <FixedResultStat key={stat.kind} stat={stat} />)}
        </section>

        <section className="ms-fixed-result-key-choice" aria-label="关键一手">
          <strong className="ms-fixed-result-key-choice__label">关键一手</strong>
          <p><strong>{data.keyChoice.label}</strong>：{data.keyChoice.impactSummary}</p>
        </section>

        <div className="ms-fixed-result-actions">
          <button
            aria-label="生成我的周一战报"
            className="ms-fixed-result-action ms-fixed-result-action--share"
            ref={createButtonRef}
            type="button"
            onClick={onCreateResultImage}
          >
            <PrintIcon name="download" />
            <span>生成我的周一战报</span>
          </button>
          <button
            aria-label="换条路线再试一次"
            className="ms-fixed-result-action ms-fixed-result-action--restart"
            type="button"
            onClick={onRestart}
          >
            <span>换条路线再试一次</span>
          </button>
          <button
            aria-label={`打开周一档案，声音已${soundEnabled ? "开启" : "关闭"}`}
            className="ms-fixed-result-archive-trigger"
            onClick={(event) => openArchive(event.currentTarget)}
            ref={archiveButtonRef}
            type="button"
          >
            周一档案 · 声音：{soundEnabled ? "开" : "关"}
          </button>
          {shareStatusText && !resultImageUrl ? (
            <p className="ms-fixed-result-share-status" role="status">
              {shareStatusText}
            </p>
          ) : null}
        </div>

        <p className="ms-fixed-result-thanks">感谢你认真活过今天。</p>

      </div>

      {resultImageUrl ? (
        <div
          aria-label="周一战报"
          aria-modal="true"
          className="ms-fixed-result-poster-modal"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onCloseResultImage?.();
            }
          }}
          role="dialog"
        >
          <div className="ms-fixed-result-poster-panel">
            <button
              aria-label="关闭周一战报"
              className="ms-fixed-result-poster-close"
              onClick={onCloseResultImage}
              ref={closeButtonRef}
              type="button"
            >
              ×
            </button>
            <img className="ms-fixed-result-poster-preview" src={resultImageUrl} alt="可保存的周一战报" />
            {isXhsBuild ? (
              <p className="ms-fixed-result-poster-hint">长按图片或使用系统截图保存</p>
            ) : (
              <>
                <p className="ms-fixed-result-poster-hint">长按保存周一战报</p>
                <div className="ms-fixed-result-poster-actions">
                  <a
                    className="ms-fixed-result-poster-action"
                    download="monday-survival-result.png"
                    href={resultImageUrl}
                  >
                    下载图片
                  </a>
                  <button className="ms-fixed-result-poster-action" onClick={onShareText} type="button">
                    挑战一个同事
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

      {archiveOpen ? (
        <div
          aria-label="周一档案"
          aria-modal="true"
          className="ms-fixed-result-archive-modal"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeArchive();
            }
          }}
          ref={archiveDialogRef}
          role="dialog"
        >
          <section className="ms-fixed-result-archive-panel">
            <button
              aria-label="关闭周一档案"
              className="ms-fixed-result-archive-close"
              onClick={closeArchive}
              ref={archiveCloseButtonRef}
              type="button"
            >
              ×
            </button>

            <header className="ms-fixed-result-archive-header">
              <p>LOCAL ARCHIVE</p>
              <h2>周一档案</h2>
              <span>最近 5 次结果，仅保存在本机</span>
            </header>

            <button
              aria-pressed={soundEnabled}
              className="ms-fixed-result-sound-toggle"
              onClick={onToggleSound}
              type="button"
            >
              <span aria-hidden="true">♪</span>
              <strong>轻声音效</strong>
              <small>{soundEnabled ? "已开启" : "默认关闭"}</small>
              <i aria-hidden="true" className={soundEnabled ? "is-on" : undefined} />
            </button>

            <div className="ms-fixed-result-history" aria-label="最近五次结果">
              {history.length === 0 ? (
                <div className="ms-fixed-result-history-empty">
                  <strong>还没有历史记录</strong>
                  <p>完成一局后，结果会安静地留在这里。</p>
                </div>
              ) : (
                <ol>
                  {history.map((entry, index) => (
                    <li key={`${entry.date}-${entry.weekKey}-${index}`}>
                      <div>
                        <time dateTime={entry.date}>{entry.date.slice(5).replace("-", ".")}</time>
                        <small>{entry.weekKey}</small>
                      </div>
                      <strong>{entry.persona}</strong>
                      <p>{entry.outcome} · 绩效 {formatPerformance(entry.score)} · 能量 {entry.energy} · 心情 {entry.mood}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="ms-fixed-result-history-clear">
              {clearConfirmationOpen ? (
                <div role="group" aria-label="确认清除本地历史">
                  <p>确认清除最近记录？此操作无法撤销。</p>
                  <button
                    onClick={() => {
                      onClearHistory?.();
                      setClearConfirmationOpen(false);
                      window.requestAnimationFrame(() => archiveCloseButtonRef.current?.focus({ preventScroll: true }));
                    }}
                    type="button"
                  >
                    确认清除
                  </button>
                  <button
                    onClick={() => {
                      setClearConfirmationOpen(false);
                      window.requestAnimationFrame(() => clearHistoryButtonRef.current?.focus({ preventScroll: true }));
                    }}
                    ref={cancelClearButtonRef}
                    type="button"
                  >
                    保留记录
                  </button>
                </div>
              ) : (
                <button
                  disabled={history.length === 0}
                  onClick={() => setClearConfirmationOpen(true)}
                  ref={clearHistoryButtonRef}
                  type="button"
                >
                  清除本地历史
                </button>
              )}
            </div>

            <p className="ms-fixed-result-archive-privacy">不含姓名、账号或设备标识，也不会上传。</p>
          </section>
        </div>
      ) : null}
    </section>
  );
}
