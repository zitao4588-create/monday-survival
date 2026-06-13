import bgResultClean from "../../assets/claude-ui/bg-result-clean-2x.jpg";
import type { ResultViewModel, StatViewModel } from "../visualTypes";

export interface ClaudeResultScreenProps {
  onRestart?: () => void;
  onShare?: () => void;
  result: ResultViewModel;
  shareStatus?: "copied" | "failed" | "idle";
  stats: StatViewModel[];
}

function getStat(stats: StatViewModel[], kind: StatViewModel["kind"]) {
  return stats.find((stat) => stat.kind === kind)?.value ?? 0;
}

export function ClaudeResultScreen({
  onRestart,
  onShare,
  result,
  shareStatus = "idle",
  stats
}: ClaudeResultScreenProps) {
  return (
    <section className="ms-claude-screen ms-claude-screen--result" aria-label="结果分享卡">
      <img className="ms-claude-bg" src={bgResultClean} alt="" aria-hidden="true" />

      <h2 className="ms-claude-ending-title">{result.title}</h2>
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
      <button className="ms-claude-result-button ms-claude-result-button--share" type="button" onClick={onShare} aria-label="保存结果图" />

      {shareStatus !== "idle" ? (
        <p className="ms-claude-share-status" role="status">
          {shareStatus === "copied" ? "分享文案已准备好。" : "暂时无法生成分享内容。"}
        </p>
      ) : null}
    </section>
  );
}
