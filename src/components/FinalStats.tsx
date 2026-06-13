import { StatGrid } from "./StatGrid";
import type { StatKind, StatViewModel } from "./visualTypes";

const resultStatOrder: StatKind[] = ["score", "energy", "mood"];

export interface FinalStatsProps {
  stats: StatViewModel[];
}

export function FinalStats({ stats }: FinalStatsProps) {
  const orderedStats = resultStatOrder.flatMap((kind) => stats.find((stat) => stat.kind === kind) ?? []);

  return <StatGrid ariaLabel="本局状态" stats={orderedStats} variant="result" />;
}
