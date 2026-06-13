import alarmIcon from "../../assets/skin-v2/icons/alarm.svg";
import checkIcon from "../../assets/skin-v2/icons/check.svg";
import cloudIcon from "../../assets/skin-v2/icons/cloud.svg";
import coffeeIcon from "../../assets/skin-v2/icons/coffee.svg";
import energyIcon from "../../assets/skin-v2/icons/energy.svg";
import moodIcon from "../../assets/skin-v2/icons/mood.svg";
import resultIllustrationIcon from "../../assets/skin-v2/icons/result-illustration.svg";
import resultStampIcon from "../../assets/skin-v2/icons/result-stamp.svg";
import scoreIcon from "../../assets/skin-v2/icons/score.svg";
import trainIcon from "../../assets/skin-v2/icons/train.svg";
import waterIcon from "../../assets/skin-v2/icons/water.svg";
import type { PrintIconName } from "../PrintIcon";

export type SkinIconName = PrintIconName | "energy" | "resultIllustration" | "resultStamp" | "score";

const skinIconSrc: Partial<Record<SkinIconName, string>> = {
  alarm: alarmIcon,
  arrowRight: checkIcon,
  badge: resultStampIcon,
  check: checkIcon,
  cloud: cloudIcon,
  coffee: coffeeIcon,
  download: cloudIcon,
  energy: energyIcon,
  lightning: energyIcon,
  mood: moodIcon,
  resultIllustration: resultIllustrationIcon,
  resultStamp: resultStampIcon,
  score: scoreIcon,
  star: scoreIcon,
  train: trainIcon,
  water: waterIcon
};

export interface SkinIconProps {
  className?: string;
  name: SkinIconName;
}

export function getSkinIconSrc(name: SkinIconName) {
  return skinIconSrc[name] ?? cloudIcon;
}

export function SkinIcon({ className, name }: SkinIconProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className ? `ms-skin-icon ${className}` : "ms-skin-icon"}
      src={getSkinIconSrc(name)}
    />
  );
}
