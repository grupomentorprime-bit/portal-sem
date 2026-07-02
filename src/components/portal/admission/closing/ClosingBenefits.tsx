import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import type { AdmissionClosingBenefitItem } from "@/types/admission-closing";
import { sortClosingBlocks } from "@/lib/portal/admission-closing-utils";

interface ClosingBenefitsProps {
  items: AdmissionClosingBenefitItem[];
}

export function ClosingBenefits({ items }: ClosingBenefitsProps) {
  const visible = sortClosingBlocks(items).filter((item) => item.visible && item.label.trim());

  if (visible.length === 0) return null;

  return (
    <div className="admission-closing__benefits" role="list">
      {visible.map((item) => (
        <div key={item.id} className="admission-closing__benefit" role="listitem">
          {item.icon ? (
            <span className="admission-closing__benefit-icon" aria-hidden>
              <BlockIcon name={item.icon} size={iconSizes.sm} />
            </span>
          ) : null}
          <span className="admission-closing__benefit-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
