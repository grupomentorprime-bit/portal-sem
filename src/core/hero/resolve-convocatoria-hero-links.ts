import "server-only";

import type { HeroSlideCta, HeroSlideFloatingCard, ResolvedHeroSlide } from "@/types/hero-portal";
import {
  activeConvocatoriaFormUrl,
  getActiveConvocatoria,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isProgramNavigationCta(text: string): boolean {
  const normalized = normalizeText(text);
  return (
    normalized.includes("ver programa") ||
    normalized.includes("explorar programas") ||
    normalized.includes("ver programas")
  );
}

function isConvocatoriaAttendanceCta(text: string, url: string): boolean {
  const label = normalizeText(text);
  const href = normalizeText(url);

  if (label.includes("convocatoria")) return true;
  if (label.includes("confirmar asistencia") || label.includes("confirmar mi asistencia")) {
    return true;
  }
  if (label.includes("asistencia") && (label.includes("confirm") || label.includes("enviar"))) {
    return true;
  }

  if (href.includes("convocatoria-talca") || href.includes("talca-aurora")) return true;
  if (href.includes("jornada-presencial")) return true;
  if (href.includes("/formularios/convocatoria")) return true;
  if (href.includes("/formularios/attendance-confirmation")) return true;

  return false;
}

function slideReferencesActiveConvocatoria(
  slide: ResolvedHeroSlide,
  convocatoria: FormConvocatoria
): boolean {
  const blob = normalizeText(
    [
      slide.content.eyebrow,
      slide.content.title,
      slide.content.highlight,
      slide.content.description,
      slide.floatingCard.title,
      slide.floatingCard.subtitle,
      slide.floatingCard.description,
    ].join(" ")
  );

  const title = normalizeText(convocatoria.title);
  const location = normalizeText(convocatoria.location);

  if (blob.includes("talca") && blob.includes("aurora")) return true;
  if (blob.includes("jornada") && blob.includes("julio")) return true;
  if (title && blob.includes(title)) return true;
  if (location && blob.includes(location)) return true;

  return false;
}

function patchCta(cta: HeroSlideCta, formUrl: string): void {
  cta.url = formUrl;
  cta.openInNewTab = false;
}

function patchFloatingCardButton(card: HeroSlideFloatingCard, formUrl: string): void {
  card.button.url = formUrl;
  card.button.openInNewTab = false;
}

/** Enlaza CTAs del hero a la convocatoria activa de confirmación de asistencia. */
export function resolveConvocatoriaHeroLinks(slides: ResolvedHeroSlide[]): void {
  const convocatoria = getActiveConvocatoria();
  const formUrl = activeConvocatoriaFormUrl();
  if (!convocatoria || !formUrl) return;

  for (const slide of slides) {
    const aboutConvocatoria = slideReferencesActiveConvocatoria(slide, convocatoria);

    if (slide.actions.enabled) {
      const primary = slide.actions.primary;
      if (
        primary.text.trim() &&
        !isProgramNavigationCta(primary.text) &&
        (isConvocatoriaAttendanceCta(primary.text, primary.url) || aboutConvocatoria)
      ) {
        patchCta(primary, formUrl);
      }
    }

    if (slide.floatingCard.enabled) {
      const button = slide.floatingCard.button;
      if (
        button.text.trim() &&
        (isConvocatoriaAttendanceCta(button.text, button.url) || aboutConvocatoria)
      ) {
        patchFloatingCardButton(slide.floatingCard, formUrl);
      }
    }
  }
}

export function convocatoriaFormUrlForContent(
  title: string,
  description = "",
  href = ""
): string | null {
  const convocatoria = getActiveConvocatoria();
  const formUrl = activeConvocatoriaFormUrl();
  if (!convocatoria || !formUrl) return null;

  const blob = normalizeText(`${title} ${description} ${href}`);
  if (blob.includes("talca") && blob.includes("aurora")) return formUrl;
  if (blob.includes("jornada") && blob.includes("julio")) return formUrl;
  if (blob.includes(normalizeText(convocatoria.title))) return formUrl;
  if (isConvocatoriaAttendanceCta(title, href)) return formUrl;

  return null;
}
