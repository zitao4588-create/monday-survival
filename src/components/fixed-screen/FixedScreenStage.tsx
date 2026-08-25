import { useEffect, useState, type ReactNode } from "react";
import "../../styles/fixed-screen.css";

const STAGE_WIDTH = 426;
const STAGE_HEIGHT = 923;

export interface FixedScreenStageProps {
  children: ReactNode;
}

function getWidthScale() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.innerWidth / STAGE_WIDTH, 1);
}

export function FixedScreenStage({ children }: FixedScreenStageProps) {
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
    <main className="ms-fixed-screen-page">
      <div
        className="ms-fixed-screen-viewport"
        style={{
          height: `${STAGE_HEIGHT * scale}px`,
          width: `${STAGE_WIDTH * scale}px`
        }}
      >
        <div
          className="ms-fixed-screen-stage"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
