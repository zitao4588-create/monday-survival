import { EventPaper } from "./EventPaper";
import type { EventViewModel } from "./visualTypes";

export interface NextEventPreviewProps {
  event?: EventViewModel;
}

export function NextEventPreview({ event }: NextEventPreviewProps) {
  return event ? <EventPaper event={event} label="下一事件预告" variant="feedback" /> : null;
}
