import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import type { AdmissionClosingIndicator } from "@/types/admission-closing";
import { sortClosingBlocks } from "@/lib/portal/admission-closing-utils";

interface ClosingIndicatorsProps {
  items: AdmissionClosingIndicator[];
}

export function ClosingIndicators({ items }: ClosingIndicatorsProps) {
  const visible = sortClosingBlocks(items).filter((item) => item.visible && item.value.trim());

  if (visible.length === 0) return null;

  return (
    <div className="admission-closing__indicators">
      {visible.map((item) => (
        <article key={item.id} className="admission-closing__indicator">
          {item.icon ? (
            <span className="admission-closing__indicator-icon" aria-hidden>
              <BlockIcon name={item.icon} size={iconSizes.md} />
            </span>
          ) : null}
          <p className="admission-closing__indicator-value">{item.value}</p>
          {item.title ? <p className="admission-closing__indicator-title">{item.title}</p> : null}
          {item.description ? (
            <p className="admission-closing__indicator-description">{item.description}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
