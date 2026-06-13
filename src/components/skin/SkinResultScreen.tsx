import primaryButton from "../../assets/skin-v2/primary-button@2x.png";
import resultPaper from "../../assets/skin-v2/result-paper@2x.png";
import secondaryButton from "../../assets/skin-v2/secondary-button@2x.png";
import type { ResultViewModel, StatViewModel } from "../visualTypes";
import { SkinHeader } from "./SkinHeader";
import { SkinIcon } from "./SkinIcon";
import { SkinStatCard } from "./SkinStatCard";

export interface SkinResultScreenProps {
  onRestart?: () => void;
  onShare?: () => void;
  result: ResultViewModel;
  shareStatus?: "copied" | "failed" | "idle";
  stats: StatViewModel[];
}

const resultStatOrder = ["score", "energy", "mood"] as const;

export function SkinResultScreen({ onRestart, onShare, result, shareStatus = "idle", stats }: SkinResultScreenProps) {
  const orderedStats = resultStatOrder.flatMap((kind) => stats.find((stat) => stat.kind === kind) ?? []);

  return (
    <div className="ms-skin-screen ms-skin-screen--result">
      <SkinHeader badge="本周结果" />

      <section className="ms-skin-result-paper" aria-label="本周生存报告">
        <img className="ms-skin-result-paper__asset" src={resultPaper} alt="" aria-hidden="true" />
        <SkinIcon className="ms-skin-result-paper__illustration" name="resultIllustration" />

        <p className="ms-skin-result-paper__kicker">MONDAY SURVIVAL REPORT</p>
        <h2>{result.title}</h2>
        <p className="ms-skin-result-paper__description">{result.description}</p>

        <div className="ms-skin-stat-grid ms-skin-stat-grid--result" aria-label="本局状态">
          {orderedStats.map((stat) => (
            <SkinStatCard key={stat.kind} {...stat} />
          ))}
        </div>

        <div className="ms-skin-result-persona">
          <SkinIcon name="resultStamp" />
          <span>今日周一人格</span>
          <strong>{result.personaLabel}</strong>
          <p>{result.personaQuote}</p>
        </div>

        <div className="ms-skin-result-actions">
          <button className="ms-skin-primary-action" type="button" onClick={onRestart}>
            <img className="ms-skin-action__asset" src={primaryButton} alt="" aria-hidden="true" />
            <span>再活一次周一</span>
            <SkinIcon name="check" />
          </button>
          <button className="ms-skin-secondary-action" type="button" onClick={onShare}>
            <img className="ms-skin-action__asset" src={secondaryButton} alt="" aria-hidden="true" />
            <SkinIcon name="cloud" />
            <span>保存结果图</span>
          </button>
          {shareStatus !== "idle" ? (
            <p className="ms-skin-share-status" role="status">
              {shareStatus === "copied" ? "分享文案已准备好。" : "暂时无法生成分享内容。"}
            </p>
          ) : null}
        </div>
      </section>

      <p className="ms-skin-result-thanks">感谢你的努力，周二会更温柔。</p>
    </div>
  );
}
