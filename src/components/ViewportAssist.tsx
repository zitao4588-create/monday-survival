import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "../styles/viewport-assist.css";

const STAGE_WIDTH = 426;

interface ViewportAssistProps {
  actionBottom: number;
  children: ReactNode;
  className?: string;
  hideAfterScroll?: boolean;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function isOriginalContentBelowViewport(actionBottom: number) {
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, 1);
  return actionBottom * scale - window.scrollY > getViewportHeight() - 8;
}

export function ViewportAssist({
  actionBottom,
  children,
  className,
  hideAfterScroll = false
}: ViewportAssistProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function syncVisibility() {
      setVisible(
        isOriginalContentBelowViewport(actionBottom)
          && (!hideAfterScroll || window.scrollY <= 8)
      );
    }

    syncVisibility();
    window.addEventListener("resize", syncVisibility);
    window.addEventListener("scroll", syncVisibility, { passive: true });
    window.visualViewport?.addEventListener("resize", syncVisibility);
    window.visualViewport?.addEventListener("scroll", syncVisibility);

    return () => {
      window.removeEventListener("resize", syncVisibility);
      window.removeEventListener("scroll", syncVisibility);
      window.visualViewport?.removeEventListener("resize", syncVisibility);
      window.visualViewport?.removeEventListener("scroll", syncVisibility);
    };
  }, [actionBottom, hideAfterScroll]);

  if (!visible) {
    return null;
  }

  return createPortal(
    <div className={className ? `ms-viewport-assist ${className}` : "ms-viewport-assist"}>
      {children}
    </div>,
    document.body
  );
}
