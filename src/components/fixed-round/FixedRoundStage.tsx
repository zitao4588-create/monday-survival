import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "../../styles/fixed-round.css";

const STAGE_WIDTH = 426;
const STAGE_HEIGHT = 923;

export interface FixedRoundStageProps {
  children: ReactNode;
}

function getContainedScale(width: number, height: number) {
  return Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT, 1);
}

export function FixedRoundStage({ children }: FixedRoundStageProps) {
  const pageRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    const syncScale = () => {
      setScale(getContainedScale(page.clientWidth, page.clientHeight));
    };

    const observer = new ResizeObserver(syncScale);
    observer.observe(page);
    syncScale();
    return () => observer.disconnect();
  }, []);

  return (
    <main className="ms-fixed-round-page" ref={pageRef}>
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
