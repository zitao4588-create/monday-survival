import { formatPerformance } from "./gameViewModels";
import type { ResultPresentation } from "./resultPresentation";

export function createResultShareText(data: ResultPresentation) {
  return [
    `我的今日周一人格：${data.personaLabel}`,
    `“${data.personaQuote}”`,
    `今日结局：${data.todayEnding}`,
    `关键一手：${data.keyChoice.label}——${data.keyChoice.impactSummary}`,
    `绩效 ${formatPerformance(data.score)} · 能量 ${data.energy}/100 · 心情 ${data.mood}/100`,
    "来试试你今天会是哪种周一人格。"
  ].join("\n");
}
