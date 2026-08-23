import { EndingTitle } from "./EndingTitle";
import { FinalStats } from "./FinalStats";
import { PaperHeader } from "./PaperHeader";
import { PersonaTag } from "./PersonaTag";
import { ResultActions } from "./ResultActions";
import { ResultFolder } from "./ResultFolder";
import { ResultIllustration } from "./ResultIllustration";
import type { ResultViewModel, StatViewModel } from "./visualTypes";

export interface ResultScreenProps {
  onRestart?: () => void;
  onShare?: () => void;
  result: ResultViewModel;
  shareStatus?: "copied" | "failed" | "idle";
  stats: StatViewModel[];
}

export function ResultScreen({ onRestart, onShare, result, shareStatus = "idle", stats }: ResultScreenProps) {
  return (
    <div className="ms-screen ms-screen--result">
      <PaperHeader badge="本周结果" />
      <section className="ms-result-dossier" aria-label="本周生存报告">
        <div className="ms-result-dossier__backing" aria-hidden="true" />
        <ResultFolder>
          <ResultIllustration />
          <EndingTitle result={result} />
          <FinalStats stats={stats} />
          <PersonaTag result={result} />
          <ResultActions onRestart={onRestart} onShare={onShare} shareStatus={shareStatus} />
        </ResultFolder>
      </section>
      <p className="ms-result-thanks">感谢你的努力，周二会更温柔。</p>
    </div>
  );
}
