import { PrintIcon } from "./PrintIcon";
import type { EventViewModel } from "./visualTypes";

export interface EventPaperProps {
  event: EventViewModel;
  label: string;
  variant?: "feedback" | "round";
}

function splitChineseSentences(text: string) {
  return text.match(/[^。！？]+[。！？]?/g)?.map((line) => line.trim()).filter(Boolean) ?? [text];
}

export function EventPaper({ event, label, variant = "round" }: EventPaperProps) {
  const bodyLines = variant === "round" ? splitChineseSentences(event.body) : [event.body];

  return (
    <article className={`ms-event-paper ms-event-paper--${variant} ms-paper ms-paper--light`}>
      <div className="ms-event-paper__holes" aria-hidden="true" />
      <span className="ms-paperclip ms-event-paper__clip" aria-hidden="true" />
      <div className="ms-coffee-ring ms-event-paper__coffee" aria-hidden="true" />
      <p className="ms-kicker">{label}</p>
      <h2 aria-label={event.time ? `${event.time} ${event.title}` : event.title}>
        {event.time ? <span className="ms-time-badge">{event.time}</span> : null}
        <span>{event.title}</span>
      </h2>
      {event.visual ? (
        <div className="ms-event-paper__illustration" aria-hidden="true">
          <PrintIcon name={event.visual} />
        </div>
      ) : null}
      <p>
        {bodyLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <div className="ms-event-paper__rule" aria-hidden="true" />
    </article>
  );
}
