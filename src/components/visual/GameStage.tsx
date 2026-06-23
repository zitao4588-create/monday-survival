import type { ReactNode } from "react";
import "./GameStage.css";

export type GameStageProps = {
  children: ReactNode;
};

export function GameStage({ children }: GameStageProps) {
  return (
    <main className="ms-page">
      <div className="ms-stage-shell">
        <div className="ms-desk-prop ms-desk-prop--cup" aria-hidden="true" />
        <div className="ms-desk-prop ms-desk-prop--pen" aria-hidden="true" />
        <div className="ms-desk-prop ms-desk-prop--folder" aria-hidden="true" />
        <div className="ms-desk-prop ms-desk-prop--binder" aria-hidden="true" />
        <section className="ms-stage-content" aria-label="今天你能熬过周一吗">
          {children}
        </section>
      </div>
    </main>
  );
}
