import { useEffect, useState } from "react";
import "../../styles/claude-ui.css";

const STAGE_WIDTH = 426.5;
const STAGE_HEIGHT = 922;

export interface ClaudeGameStageProps {
  children: React.ReactNode;
}

function getStageScale() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT, 1);
}

export function ClaudeGameStage({ children }: ClaudeGameStageProps) {
  const [scale, setScale] = useState(getStageScale);

  useEffect(() => {
    function syncScale() {
      setScale(getStageScale());
    }

    syncScale();
    window.addEventListener("resize", syncScale);
    return () => window.removeEventListener("resize", syncScale);
  }, []);

  return (
    <main className="ms-claude-page">
      <div
        className="ms-claude-viewport"
        style={{
          height: `${STAGE_HEIGHT * scale}px`,
          width: `${STAGE_WIDTH * scale}px`
        }}
      >
        <div
          className="ms-claude-stage"
          style={{
            transform: `scale(${scale})`
          }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
