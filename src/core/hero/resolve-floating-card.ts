import "server-only";

import { executeContentQuery } from "@/lib/content/resolver";
import {
  mapToAcademicAgendaItem,
  mapToInstitutionalNoticeItem,
} from "@/lib/content/mappers";
import { academicAgendaCategoryLabel } from "@/types/academic-portal";
import type { ContentDocument } from "@/types/content";
import type { HeroSlideFloatingCard } from "@/types/hero-portal";

function formatShortDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function fetchNextAcademicEvent(tenant: string): Promise<ContentDocument | null> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_academic_agenda",
      filters: { status: "published", upcoming: true },
      sort: { field: "startDate", direction: "asc" },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  return result.items[0] ?? null;
}

async function fetchFeaturedNotice(tenant: string): Promise<ContentDocument | null> {
  const featured = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_institutional_notices",
      filters: { status: "published", featured: true },
      sort: { field: "priority", direction: "desc" },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  if (featured.items[0]) return featured.items[0];

  const fallback = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_institutional_notices",
      filters: { status: "published" },
      sort: { field: "publishedAt", direction: "desc" },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  return fallback.items[0] ?? null;
}

function agendaToFloatingCard(
  doc: ContentDocument,
  base: HeroSlideFloatingCard
): HeroSlideFloatingCard {
  const item = mapToAcademicAgendaItem(doc);
  const category = academicAgendaCategoryLabel(item.category);
  return {
    ...base,
    enabled: true,
    icon: base.icon || "calendar",
    title: item.title,
    subtitle: category,
    description: item.description || `${item.startDateLabel}${item.endDateLabel ? ` — ${item.endDateLabel}` : ""}`,
    button: {
      text: item.ctaLabel || base.button.text || "Ver detalle",
      url: item.href,
      openInNewTab: base.button.openInNewTab,
    },
  };
}

function noticeToFloatingCard(
  doc: ContentDocument,
  base: HeroSlideFloatingCard
): HeroSlideFloatingCard {
  const item = mapToInstitutionalNoticeItem(doc);
  return {
    ...base,
    enabled: true,
    icon: base.icon || "megaphone",
    title: item.title,
    subtitle: item.categoryLabel,
    description: item.summary || formatShortDate(item.publishedAt),
    button: {
      text: item.ctaLabel || base.button.text || "Leer aviso",
      url: item.href,
      openInNewTab: base.button.openInNewTab,
    },
  };
}

/** Resuelve la tarjeta flotante según fuente CMS (OT-PORTAL-015). */
export async function resolveHeroFloatingCard(
  tenant: string,
  card: HeroSlideFloatingCard
): Promise<HeroSlideFloatingCard> {
  if (!card.enabled) return card;

  const source = card.source ?? "manual";
  if (source === "manual") return card;

  if (source === "next_academic_event") {
    const event = await fetchNextAcademicEvent(tenant);
    if (!event) return { ...card, enabled: false };
    return agendaToFloatingCard(event, card);
  }

  if (source === "featured_notice") {
    const notice = await fetchFeaturedNotice(tenant);
    if (!notice) return { ...card, enabled: false };
    return noticeToFloatingCard(notice, card);
  }

  return card;
}

/** Resuelve tarjetas flotantes en todos los slides visibles. */
export async function resolveHeroSlidesFloatingCards(
  tenant: string,
  slides: Array<{ floatingCard: HeroSlideFloatingCard }>
): Promise<void> {
  await Promise.all(
    slides.map(async (slide) => {
      slide.floatingCard = await resolveHeroFloatingCard(tenant, slide.floatingCard);
    })
  );
}
