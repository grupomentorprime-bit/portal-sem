import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { asString } from "@/lib/cms/block-utils";
import type { PortalFeatureGridSettings, PortalFeatureItem } from "@/types/feature-grid";

const WEEK_RHYTHM = [
  {
    id: "structure",
    title: "Estructura",
    description:
      "El lunes hay clase en vivo. El resto de la semana sigue con estudio, materiales y actividades.",
  },
  {
    id: "flexibility",
    title: "Flexibilidad",
    description:
      "Ese ritmo acompaña tu servicio: la semana tiene un camino claro y espacio para recorrerlo.",
  },
] as const;

interface SemHomeFormationProps {
  settings: PortalFeatureGridSettings;
  features: PortalFeatureItem[];
  id?: string;
}

export function SemHomeFormation({
  settings,
  features,
  id = "malla",
}: SemHomeFormationProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const buttonLabel = asString(settings.buttonLabel);
  const buttonHref = asString(settings.buttonHref);
  const areas = features.slice(0, 3);

  return (
    <PortalSection id={id} padding="none">
      <PortalContainer>
        <div className="sem-formation">
          <section className="sem-formation__malla" aria-labelledby="sem-malla-heading">
            <header className="sem-formation__header">
              {overline ? <p className="sem-formation__eyebrow">{overline}</p> : null}
              {title ? (
                <h2 id="sem-malla-heading" className="sem-formation__title">
                  {title}
                </h2>
              ) : null}
            </header>

            {areas.length > 0 ? (
              <ul className="sem-formation__areas" role="list">
                {areas.map((area) => (
                  <li key={area.id} className="sem-formation__area">
                    <span className="sem-formation__area-icon" aria-hidden>
                      <BlockIcon name={area.icon} size={20} strokeWidth={1.75} />
                    </span>
                    <h3 className="sem-formation__area-title">{area.title}</h3>
                    {area.description ? (
                      <p className="sem-formation__area-text">{area.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {buttonLabel && buttonHref ? (
              <Link href={buttonHref} className="sem-formation__link">
                {buttonLabel}
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
          </section>

          <section className="sem-formation__week" aria-labelledby="sem-week-heading">
            <p className="sem-formation__eyebrow">Experiencia de aprendizaje</p>
            <h2 id="sem-week-heading" className="sem-formation__week-title">
              Una formación que acompaña tu semana.
            </h2>
            <ul className="sem-formation__rhythm" role="list">
              {WEEK_RHYTHM.map((item) => (
                <li key={item.id} className="sem-formation__rhythm-item">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
