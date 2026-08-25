import { useEffect, useState, type ReactNode } from "react";
import "../../styles/fixed-round.css";

const STAGE_WIDTH = 426;
const STAGE_HEIGHT = 923;

export interface FixedRoundStageProps {
  children: ReactNode;
}

function getWidthScale() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.innerWidth / STAGE_WIDTH, 1);
}

export function FixedRoundStage({ children }: FixedRoundStageProps) {
  const [scale, setScale] = useState(getWidthScale);

  useEffect(() => {
    function syncScale() {
      setScale(getWidthScale());
    }

    syncScale();
    window.addEventListener("resize", syncScale);
    return () => window.removeEventListener("resize", syncScale);
  }, []);

  return (
    <main className="ms-fixed-round-page">
      <div
        className="ms-fixed-round-viewport"
        style={{
          height: `${STAGE_HEIGHT * scale}px`,
          width: `${STAGE_WIDTH * scale}px`
        }}
      >
        <div
          className="ms-fixed-round-stage"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
