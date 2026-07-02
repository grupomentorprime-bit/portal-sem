import type { AdmissionClosingMessageData } from "@/types/admission-closing";
import { cn } from "@/lib/utils";

interface ClosingMessageProps {
  data: AdmissionClosingMessageData;
  variant?: "standalone" | "split";
}

export function ClosingMessage({ data, variant = "standalone" }: ClosingMessageProps) {
  if (!data.title.trim() && !data.description.trim()) return null;

  if (variant === "split") {
    return (
      <header className="admission-closing__message admission-closing__message--split">
        {data.eyebrow ? <p className="admission-closing__eyebrow">{data.eyebrow}</p> : null}
        {data.title ? <h2 className="admission-closing__title">{data.title}</h2> : null}
        {data.subtitle ? <p className="admission-closing__subtitle">{data.subtitle}</p> : null}
        {data.description ? (
          <p className="admission-closing__description">{data.description}</p>
        ) : null}
      </header>
    );
  }

  return (
    <header
      className={cn(
        "admission-closing__message",
        `admission-closing__message--${data.alignment}`
      )}
    >
      {data.eyebrow ? <p className="admission-closing__eyebrow">{data.eyebrow}</p> : null}
      {data.title ? <h2 className="admission-closing__title">{data.title}</h2> : null}
      {data.subtitle ? <p className="admission-closing__subtitle">{data.subtitle}</p> : null}
      {data.description ? (
        <p className="admission-closing__description">{data.description}</p>
      ) : null}
    </header>
  );
}
