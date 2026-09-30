/**
 * Borradores institucionales del SEM.
 * Solo entra copy que ya vive en la identidad validada.
 * Quienes somos, historia, directivos, equipo, cursos y contacto quedan sin cuerpo.
 */
import { SEM_TENANT_ID } from "@/core/tenant/constants";
import { semEditorialPage } from "@/lib/portal/sem-identity-v7";
import { SEM_PREPARED_PAGES } from "@/lib/portal/sem-prepared-pages";
import type { PageBlock, SeoSettings } from "@/types/page";

export interface SemInstitutionalDraft {
  id: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
  seo: SeoSettings;
}

function logicalId(slug: string): string {
  return slug.replace(/^\//, "").replace(/\//g, "-");
}

const EXTRA_PAGES = [{ slug: "/contacto", title: "Contacto" }] as const;

export function semInstitutionalDrafts(): SemInstitutionalDraft[] {
  const specs = [
    ...SEM_PREPARED_PAGES.map((page) => ({ slug: page.slug, title: page.title })),
    ...EXTRA_PAGES,
  ];

  return specs.map((spec) => {
    const editorial = semEditorialPage(spec.slug, SEM_TENANT_ID);
    if (!editorial?.blocks.length) {
      return {
        id: logicalId(spec.slug),
        title: spec.title,
        slug: spec.slug,
        blocks: [],
        seo: { title: spec.title },
      };
    }

    return {
      id: logicalId(spec.slug),
      title: spec.title,
      slug: spec.slug,
      blocks: editorial.blocks,
      seo: {
        title: editorial.seo.title ?? spec.title,
        ...(editorial.seo.description ? { description: editorial.seo.description } : {}),
      },
    };
  });
}
