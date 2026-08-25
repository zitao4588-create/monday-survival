import alarmIcon from "../../assets/skin-v2/icons/alarm.svg";
import checkIcon from "../../assets/skin-v2/icons/check.svg";
import coffeeIcon from "../../assets/skin-v2/icons/coffee.svg";
import energyIcon from "../../assets/skin-v2/icons/energy.svg";
import moodIcon from "../../assets/skin-v2/icons/mood.svg";
import scoreIcon from "../../assets/skin-v2/icons/score.svg";
import trainIcon from "../../assets/skin-v2/icons/train.svg";
import waterIcon from "../../assets/skin-v2/icons/water.svg";

export type SkinIconName =
  | "alarm"
  | "check"
  | "coffee"
  | "energy"
  | "mood"
  | "score"
  | "train"
  | "water";

const skinIconSrc: Record<SkinIconName, string> = {
  alarm: alarmIcon,
  check: checkIcon,
  coffee: coffeeIcon,
  energy: energyIcon,
  mood: moodIcon,
  score: scoreIcon,
  train: trainIcon,
  water: waterIcon
};

export interface SkinIconProps {
  className?: string;
  name: SkinIconName;
}

export function getSkinIconSrc(name: SkinIconName) {
  return skinIconSrc[name];
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
