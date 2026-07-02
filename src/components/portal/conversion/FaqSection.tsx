import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { iconSizes } from "@/design";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { asString } from "@/lib/cms/block-utils";
import { cn } from "@/lib/utils";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqSectionProps {
  overline?: string;
  title?: string;
  description?: string;
  items: FaqItem[];
  id?: string;
  /** Home editorial — layout 2 columnas + acordeón numerado */
  editorialHome?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}

export function FaqSection({
  overline,
  title,
  description,
  items,
  id = "preguntas-frecuentes",
  editorialHome = false,
  ctaHref = "/admision",
  ctaLabel = "Guía completa de admisión",
}: FaqSectionProps) {
  const sectionTitle = asString(title);
  if (!sectionTitle || items.length === 0) return null;

  const accordion = (
    <Accordion
      className={cn(
        "faq-accordion border-0 bg-background",
        editorialHome && "faq-accordion--editorial"
      )}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          title={item.question}
          defaultOpen={index === 0}
          index={index}
          editorial={editorialHome}
        >
          {item.answer}
        </AccordionItem>
      ))}
    </Accordion>
  );

  if (editorialHome) {
    return (
      <PortalSection id={id} muted className="faq-home-section">
        <PortalContainer size="lg">
          <div className="faq-home">
            <header className="faq-home__header">
              {overline ? <p className="faq-home__eyebrow">{overline}</p> : null}
              <h2 className="faq-home__title">{sectionTitle}</h2>
              {description ? <p className="faq-home__desc">{description}</p> : null}
              {ctaHref ? (
                <Link href={ctaHref} className="faq-home__cta">
                  {ctaLabel}
                  <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
                </Link>
              ) : null}
            </header>
            <div className="faq-home__accordion">{accordion}</div>
          </div>
        </PortalContainer>
      </PortalSection>
    );
  }

  return (
    <PortalSection id={id} muted>
      <PortalContainer size="md">
        <PortalSectionHeader
          overline={overline}
          title={sectionTitle}
          description={description}
          href={ctaHref}
          linkLabel={ctaLabel}
        />
        {accordion}
      </PortalContainer>
    </PortalSection>
  );
}
