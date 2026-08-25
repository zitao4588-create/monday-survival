import {
  CalendarClock,
  Coffee,
  DoorOpen,
  EyeOff,
  Laptop,
  ListFilter,
  MessageCircleWarning,
  MessageSquareReply,
  NotebookPen,
  NotebookText,
  PanelsTopLeft,
  Power,
  Sandwich,
  ShowerHead,
  Smartphone,
  type LucideIcon
} from "lucide-react";
import type { GameChoiceIcon } from "../gameCore";

const choiceIcons = {
  "calendar-clock": CalendarClock,
  coffee: Coffee,
  "door-open": DoorOpen,
  "eye-off": EyeOff,
  laptop: Laptop,
  "list-filter": ListFilter,
  "message-circle-warning": MessageCircleWarning,
  "message-square-reply": MessageSquareReply,
  "notebook-pen": NotebookPen,
  "notebook-text": NotebookText,
  "panels-top-left": PanelsTopLeft,
  power: Power,
  sandwich: Sandwich,
  "shower-head": ShowerHead,
  smartphone: Smartphone
} satisfies Record<GameChoiceIcon, LucideIcon>;

export interface ChoiceIconProps {
  className?: string;
  name: GameChoiceIcon;
}

export function ChoiceIcon({ className, name }: ChoiceIconProps) {
  const Icon = choiceIcons[name];

  return (
    <Icon
      aria-hidden="true"
      className={className ? `ms-choice-icon ${className}` : "ms-choice-icon"}
      data-choice-icon={name}
      focusable="false"
      strokeWidth={1.9}
    />
  );
}
