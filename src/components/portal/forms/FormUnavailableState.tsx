import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarX2, Mail } from "lucide-react";
import type { FormLandingConfig } from "@/lib/admin/forms-center";
import {
  formUnavailabilityCopy,
  type FormUnavailabilityReason,
} from "@/lib/experience/forms/status";
import type { FormExperienceStateMessage } from "@/types/experience-form-experience";

interface FormUnavailableStateProps {
  reason: FormUnavailabilityReason;
  landing?: FormLandingConfig | null;
  stateMessage?: FormExperienceStateMessage | null;
  formName?: string;
  breadcrumb?: ReactNode;
}

export function FormUnavailableState({
  reason,
  landing,
  stateMessage,
  formName,
  breadcrumb,
}: FormUnavailableStateProps) {
  const fallback = formUnavailabilityCopy(reason);
  const copy = stateMessage ?? fallback;
  const headline = landing?.headline ?? formName ?? "Formulario";
  const theme = landing?.theme ?? "information";
  const primaryCta = stateMessage?.ctaHref
    ? { label: stateMessage.ctaLabel ?? "Continuar", href: stateMessage.ctaHref }
    : { label: "Ver formularios disponibles", href: "/formularios" };

  return (
    <div className={`form-landing form-landing--${theme}`}>
      <section className="form-landing__hero" aria-labelledby="form-unavailable-headline">
        <div className="form-landing__hero-bg" aria-hidden="true">
          <div className="form-landing__orb form-landing__orb--1" />
          <div className="form-landing__orb form-landing__orb--2" />
          <div className="form-landing__orb form-landing__orb--3" />
        </div>

        <div className="form-landing__hero-inner">
          {breadcrumb ? <div className="form-landing__breadcrumb">{breadcrumb}</div> : null}

          <p className="form-landing__eyebrow">{landing?.eyebrow ?? "Centro de formularios"}</p>
          <h1 className="form-landing__headline" id="form-unavailable-headline">
            {headline}
          </h1>
          {landing?.subheadline ? (
            <p className="form-landing__subheadline">{landing.subheadline}</p>
          ) : null}
        </div>
      </section>

      <section className="form-landing__form-section" aria-label="Estado del formulario">
        <div className="form-landing__form-card form-unavailable">
          <div className="form-unavailable__icon-wrap" aria-hidden="true">
            <CalendarX2 className="form-unavailable__icon" />
          </div>
          <h2 className="form-unavailable__title">{copy.title}</h2>
          <p className="form-unavailable__description">{copy.description}</p>

          <div className="form-unavailable__actions">
            <Link
              href={primaryCta.href}
              className="form-unavailable__action form-unavailable__action--primary"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/contacto" className="form-unavailable__action">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contactar al seminario
            </Link>
            <Link href="/" className="form-unavailable__action">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
