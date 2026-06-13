import alarmIcon from "../assets/icons/alarm.svg";
import coffeeIcon from "../assets/icons/coffee.svg";
import lightningIcon from "../assets/icons/lightning.svg";
import moodIcon from "../assets/icons/mood.svg";
import starIcon from "../assets/icons/star.svg";
import trainIcon from "../assets/icons/train.svg";
import waterIcon from "../assets/icons/water.svg";

export type PrintIconName =
  | "alarm"
  | "arrowRight"
  | "badge"
  | "check"
  | "cloud"
  | "coffee"
  | "download"
  | "lightning"
  | "mood"
  | "star"
  | "train"
  | "water";

export interface PrintIconProps {
  name: PrintIconName;
}

const assetIcons: Partial<Record<PrintIconName, string>> = {
  alarm: alarmIcon,
  coffee: coffeeIcon,
  lightning: lightningIcon,
  mood: moodIcon,
  star: starIcon,
  train: trainIcon,
  water: waterIcon
};

export function PrintIcon({ name }: PrintIconProps) {
  const asset = assetIcons[name];

  if (asset) {
    return <img className="ms-icon ms-icon--asset" src={asset} alt="" aria-hidden="true" />;
  }

  return (
    <svg className="ms-icon" aria-hidden="true" viewBox="0 0 48 48" focusable="false">
      {name === "cloud" ? (
        <path d="M14 32h22a8 8 0 0 0 0-16 12 12 0 0 0-23-3 9.5 9.5 0 0 0 1 19Z" />
      ) : null}
      {name === "check" ? (
        <path d="m12 24 8 8 17-18" />
      ) : null}
      {name === "badge" ? (
        <>
          <circle cx="24" cy="24" r="17" />
          <path d="m24 14 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" />
        </>
      ) : null}
      {name === "download" ? (
        <>
          <path d="M24 8v22" />
          <path d="m14 22 10 10 10-10" />
          <path d="M11 36h26" />
        </>
      ) : null}
      {name === "arrowRight" ? <path d="M16 10 32 24 16 38" /> : null}
    </svg>
  );
}
