import type { ResultViewModel, StatViewModel } from "./components/visualTypes";

export interface ResultShareData {
  description: string;
  energy: number;
  mood: number;
  personaLabel: string;
  personaQuote: string;
  score: number;
  title: string;
}

function getStatValue(stats: StatViewModel[], kind: StatViewModel["kind"]) {
  return stats.find((stat) => stat.kind === kind)?.value ?? 0;
}

export function toResultShareData(result: ResultViewModel, stats: StatViewModel[]): ResultShareData {
  return {
    description: result.description,
    energy: getStatValue(stats, "energy"),
    mood: getStatValue(stats, "mood"),
    personaLabel: result.personaLabel,
    personaQuote: result.personaQuote,
    score: getStatValue(stats, "score"),
    title: result.title
  };
}

export function createResultShareText(result: ResultViewModel, stats: StatViewModel[]) {
  const data = toResultShareData(result, stats);

  return [
    `我的周一求生结果：${data.title}`,
    `${data.personaLabel}：${data.personaQuote}`,
    `得分 ${data.score}/100 · 能量 ${data.energy}/100 · 心情 ${data.mood}/100`,
    "来试试你能不能活过周一。"
  ].join("\n");
}
