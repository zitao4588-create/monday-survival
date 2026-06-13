import statCardAsset from "../../assets/skin-v2/stat-card@2x.png";
import type { StatKind } from "../visualTypes";
import { SkinIcon, type SkinIconName } from "./SkinIcon";

const statIcon: Record<StatKind, SkinIconName> = {
  energy: "energy",
  mood: "mood",
  score: "score"
};

export interface SkinStatCardProps {
  delta?: number;
  kind: StatKind;
  label: string;
  value: number;
}

function clampStat(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function SkinStatCard({ delta, kind, label, value }: SkinStatCardProps) {
  const blockCount = Math.round((clampStat(value) / 100) * 7);

  return (
    <article className={`ms-skin-stat-card ms-skin-stat-card--${kind}`}>
      <img className="ms-skin-stat-card__asset" src={statCardAsset} alt="" aria-hidden="true" />
      <div className="ms-skin-stat-card__content">
        <div className="ms-skin-stat-card__top">
          <span>
            <SkinIcon name={statIcon[kind]} />
            {label}
          </span>
          <strong>{value}</strong>
          <small>/100</small>
        </div>
        <div className="ms-skin-stat-card__blocks" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className={index < blockCount ? "is-filled" : ""} />
          ))}
        </div>
      </div>
      {typeof delta === "number" ? <b className="ms-skin-stat-card__delta">{formatDelta(delta)}</b> : null}
    </article>
  );
}
