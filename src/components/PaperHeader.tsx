import { PrintIcon } from "./PrintIcon";

export interface PaperHeaderProps {
  badge: string;
  eyebrow?: string;
  title?: string;
}

function renderBadge(badge: string) {
  const roundMatch = badge.match(/^第\s*(\d+)\s*\/\s*(\d+)\s*回合$/);

  if (!roundMatch) {
    return badge;
  }

  return (
    <>
      <span>第</span>
      <strong>{roundMatch[1]}</strong>
      <span>/{roundMatch[2]} 回合</span>
    </>
  );
}

export function PaperHeader({ badge, eyebrow = "打工人生存测试", title = "活过周一" }: PaperHeaderProps) {
  return (
    <header className="ms-paper-header ms-paper ms-cut-corner">
      <div className="ms-paper-header__tab">
        <PrintIcon name="cloud" />
      </div>
      <div className="ms-paper-header__copy">
        <h1>{title}</h1>
        <p>{eyebrow}</p>
      </div>
      <div className="ms-paper-header__badge">{renderBadge(badge)}</div>
      <span className="ms-paper-tape ms-paper-header__tape" aria-hidden="true" />
      <span className="ms-paper-header__binder" aria-hidden="true" />
    </header>
  );
}
