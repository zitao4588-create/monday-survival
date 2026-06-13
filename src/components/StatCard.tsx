import { PrintIcon } from "./PrintIcon";
import type { PrintIconName } from "./PrintIcon";
import type { StatKind } from "./visualTypes";

const statIcon: Record<StatKind, PrintIconName> = {
  energy: "lightning",
  mood: "mood",
  score: "star"
};

export interface StatCardProps {
  kind: StatKind;
  label: string;
  value: number;
  delta?: number;
}

function clampStat(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function StatCard({ kind, label, value, delta }: StatCardProps) {
  const blockCount = Math.round((clampStat(value) / 100) * 7);

  return (
    <article className={`ms-stat-card ms-stat-card--${kind} ms-paper ms-ticket ms-cut-corner`}>
      <div className="ms-stat-card__top">
        <span>
          <PrintIcon name={statIcon[kind]} />
          {label}
        </span>
        <strong>{value}</strong>
        <small>/100</small>
      </div>
      <div className="ms-stat-card__blocks" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} className={index < blockCount ? "is-filled" : ""} />
        ))}
      </div>
      {typeof delta === "number" ? <b className="ms-stat-card__delta">{formatDelta(delta)}</b> : null}
    </article>
  );
}
