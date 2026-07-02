import "server-only";

import { SeminariosHomeSection } from "@/components/portal/SeminariosHomeSection";
import { asString } from "@/lib/cms/block-utils";
import { blockSettings } from "@/lib/portal/blocks";
import { DEMO_SEMINARIOS, type SeminarioCard } from "@/lib/portal/institutional-demo";
import { isHomePageSlug } from "@/lib/portal/home-experience";
import type { PageBlock } from "@/types/page";

interface SeminariosHomeBlockSectionProps {
  block: PageBlock;
  pageSlug?: string;
}

function extractSeminarios(raw: unknown): SeminarioCard[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      id: String(item.id ?? `seminario-${index + 1}`),
      title: String(item.title ?? ""),
      metaLine: String(item.metaLine ?? item.meta ?? ""),
      imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
      ctaLabel: String(item.ctaLabel ?? "Inscríbete"),
      ctaHref: String(item.ctaHref ?? "/programas"),
    }))
    .filter((item) => item.title.trim());
}

export function SeminariosHomeBlockSection({
  block,
  pageSlug = "/",
}: SeminariosHomeBlockSectionProps) {
  const settings = blockSettings<{
    eyebrow?: string;
    title?: string;
    description?: string;
    seminarios?: unknown;
    viewAllHref?: string;
    viewAllLabel?: string;
  }>(block);

  const seminarios = extractSeminarios(settings.seminarios);
  const items =
    seminarios.length > 0
      ? seminarios
      : isHomePageSlug(pageSlug)
        ? DEMO_SEMINARIOS
        : [];

  return (
    <SeminariosHomeSection
      eyebrow={asString(settings.eyebrow, "Formación continua")}
      title={asString(settings.title, "Seminarios disponibles")}
      description={asString(settings.description)}
      seminarios={items}
      viewAllHref={asString(settings.viewAllHref, "/programas")}
      viewAllLabel={asString(settings.viewAllLabel, "Ver todos los seminarios")}
    />
  );
}
