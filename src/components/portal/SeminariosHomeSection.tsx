import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PortalContainer } from "@/components/portal/layout";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { SeminarioCard } from "@/lib/portal/institutional-demo";
import { SeminariosCarousel } from "@/components/portal/SeminariosCarousel";

export interface SeminariosHomeSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  seminarios: SeminarioCard[];
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function SeminariosHomeSection({
  eyebrow = "Formación continua",
  title,
  description,
  seminarios,
  viewAllHref = "/programas",
  viewAllLabel = "Ver todos los seminarios",
}: SeminariosHomeSectionProps) {
  if (seminarios.length === 0) return null;

  return (
    <section className="seminarios-home" aria-labelledby="seminarios-home-title">
      <PortalContainer size="full">
        <header className="seminarios-home__header">
          {eyebrow ? <p className="seminarios-home__eyebrow">{eyebrow}</p> : null}
          <h2 id="seminarios-home-title" className="seminarios-home__title">
            {title}
          </h2>
          {description ? <p className="seminarios-home__desc">{description}</p> : null}
        </header>

        <SeminariosCarousel seminarios={seminarios} />

        {viewAllHref ? (
          <div className="seminarios-home__footer">
            <Link href={viewAllHref} className={cn("seminarios-home__view-all", focusRing)}>
              {viewAllLabel}
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        ) : null}
      </PortalContainer>
    </section>
  );
}
