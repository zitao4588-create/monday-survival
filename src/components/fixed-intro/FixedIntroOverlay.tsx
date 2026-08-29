import { useEffect, useRef } from "react";
import "../../styles/fixed-intro.css";

export interface FixedIntroOverlayProps {
  onStart?: () => void;
}

export function FixedIntroOverlay({ onStart }: FixedIntroOverlayProps) {
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    startButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      aria-labelledby="ms-fixed-intro-title"
      aria-modal="true"
      className="ms-fixed-intro-overlay"
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          startButtonRef.current?.focus({ preventScroll: true });
        }
      }}
      role="dialog"
    >
      <div className="ms-fixed-intro-card">
        <h2 id="ms-fixed-intro-title">今天你能体面下班吗?</h2>
        <p>5 次选择，守住能量、心情和绩效。</p>
        <button onClick={onStart} ref={startButtonRef} type="button">开始上班</button>
        <small>全部走完约2分钟，无需登录</small>
      </div>
    </section>
  );
}
