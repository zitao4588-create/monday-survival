import headerTicket from "../../assets/skin-v2/header-ticket@2x.png";
import { SkinIcon } from "./SkinIcon";

export interface SkinHeaderProps {
  badge: string;
}

export function SkinHeader({ badge }: SkinHeaderProps) {
  return (
    <header className="ms-skin-header">
      <img className="ms-skin-header__asset" src={headerTicket} alt="" aria-hidden="true" />
      <span className="ms-skin-header__tab" aria-hidden="true">
        <SkinIcon name="cloud" />
      </span>
      <div className="ms-skin-header__copy">
        <h1>今天你能活过周一吗</h1>
        <p>MONDAY SURVIVAL FILE</p>
      </div>
      <div className="ms-skin-header__badge" aria-label={badge}>
        {badge}
      </div>
    </header>
  );
}
