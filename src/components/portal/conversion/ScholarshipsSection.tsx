import { GraduationCap, Handshake, Percent, Sparkles } from "lucide-react";
import { iconSizes } from "@/design";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { PortalCard } from "@/components/portal/cards/PortalCard";
import { asString } from "@/lib/cms/block-utils";

export interface ScholarshipItem {
  id: string;
  kind: "scholarship" | "discount" | "agreement" | "benefit" | string;
  title: string;
  description: string;
}

const KIND_ICONS = {
  scholarship: GraduationCap,
  discount: Percent,
  agreement: Handshake,
  benefit: Sparkles,
} as const;

interface ScholarshipsSectionProps {
  overline?: string;
  title?: string;
  description?: string;
  items: ScholarshipItem[];
  id?: string;
}

export function ScholarshipsSection({
  overline,
  title,
  description,
  items,
  id = "becas",
}: ScholarshipsSectionProps) {
  const sectionTitle = asString(title);
  if (!sectionTitle || items.length === 0) return null;

  return (
    <PortalSection id={id}>
      <PortalContainer>
        <PortalSectionHeader
          overline={overline}
          title={sectionTitle}
          description={description}
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {items.map((item) => {
            const Icon = KIND_ICONS[item.kind as keyof typeof KIND_ICONS] ?? Sparkles;
            return (
              <li key={item.id}>
                <PortalCard className="h-full p-6">
                  <span className="portal-icon-badge mb-4 inline-flex" aria-hidden>
                    <Icon size={iconSizes.md} strokeWidth={1.75} />
                  </span>
                  <h3 className="text-heading text-foreground">{item.title}</h3>
                  <p className="mt-2 text-body text-muted">{item.description}</p>
                </PortalCard>
              </li>
            );
          })}
        </ul>
      </PortalContainer>
    </PortalSection>
  );
}
