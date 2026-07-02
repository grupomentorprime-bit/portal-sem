import { PortalCard } from "@/components/portal/cards/PortalCard";
import { CmsSectionHeader, CmsSectionShell } from "@/components/portal/cms/CmsSectionShell";
import type { AdmissionFeeItem } from "@/types/admission";
import type { CmsSectionLayout } from "@/types/cms-shared";

interface AdmissionFeesProps {
  items: AdmissionFeeItem[];
  note?: string;
  layout?: CmsSectionLayout;
  anchor?: string;
}

export function AdmissionFees({ items, note, layout, anchor }: AdmissionFeesProps) {
  if (items.length === 0) return null;

  return (
    <CmsSectionShell id={anchor} layout={layout}>
      <CmsSectionHeader layout={layout} />
      <ul className="grid gap-4 sm:grid-cols-3" role="list">
        {items.map((fee) => (
          <li key={fee.id}>
            <PortalCard className="h-full p-5 text-center sm:text-left">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">
                {fee.label}
              </p>
              <p className="mt-2 text-display-s font-semibold text-foreground">{fee.value}</p>
              {fee.note ? <p className="mt-2 text-sm text-muted">{fee.note}</p> : null}
            </PortalCard>
          </li>
        ))}
      </ul>
      {note ? (
        <p className="mt-6 rounded-[var(--radius-lg)] border border-border bg-background-soft p-4 text-sm text-muted">
          {note}
        </p>
      ) : null}
    </CmsSectionShell>
  );
}
