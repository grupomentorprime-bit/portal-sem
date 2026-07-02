import type { AdmissionClosingQuoteItem } from "@/types/admission-closing";
import { sortClosingBlocks } from "@/lib/portal/admission-closing-utils";

interface ClosingQuotesProps {
  items: AdmissionClosingQuoteItem[];
}

export function ClosingQuotes({ items }: ClosingQuotesProps) {
  const visible = sortClosingBlocks(items).filter((item) => item.visible && item.text.trim());

  if (visible.length === 0) return null;

  return (
    <div className="admission-closing__quotes">
      {visible.map((item) => (
        <figure
          key={item.id}
          className={`admission-closing__quote${item.showQuotes ? " admission-closing__quote--decorated" : ""}`}
        >
          <blockquote className="admission-closing__quote-text">{item.text}</blockquote>
          {(item.showSignature && (item.author || item.reference)) ? (
            <figcaption className="admission-closing__quote-signature">
              {item.author ? <cite>{item.author}</cite> : null}
              {item.reference ? <span>{item.reference}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
