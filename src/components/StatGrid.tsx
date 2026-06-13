import { StatCard } from "./StatCard";
import type { StatViewModel } from "./visualTypes";

export interface StatGridProps {
  ariaLabel: string;
  stats: StatViewModel[];
  variant?: "feedback" | "result";
}

export function StatGrid({ ariaLabel, stats, variant }: StatGridProps) {
  const className = variant ? `ms-stat-grid ms-stat-grid--${variant}` : "ms-stat-grid";

  return (
    <section className={className} aria-label={ariaLabel}>
      {stats.map((stat) => (
        <StatCard key={stat.kind} {...stat} />
      ))}
    </section>
  );
}
