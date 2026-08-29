import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "../../styles/fixed-screen.css";

const STAGE_WIDTH = 426;
const STAGE_HEIGHT = 923;

export interface FixedScreenStageProps {
  children: ReactNode;
}

function getContainedScale(width: number, height: number) {
  return Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT, 1);
}

export function FixedScreenStage({ children }: FixedScreenStageProps) {
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
    <main className="ms-fixed-screen-page" ref={pageRef}>
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
