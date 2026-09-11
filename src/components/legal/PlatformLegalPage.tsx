import { PlatformLegalDocumentView } from "@/components/legal/PlatformLegalDocumentView";
import { PlatformLegalShell } from "@/components/legal/PlatformLegalShell";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import {
  PLATFORM_LEGAL_ROUTES,
  getPlatformLegalDocument,
  platformLegalTitle,
  type PlatformLegalDocument,
} from "@/core/legal/platform";
import { getAppBaseUrl } from "@/lib/app-url";
import type { Metadata } from "next";

const ROUTE_BY_SLUG: Record<
  PlatformLegalDocument["slug"],
  (typeof PLATFORM_LEGAL_ROUTES)[keyof typeof PLATFORM_LEGAL_ROUTES]
> = {
  privacidad: PLATFORM_LEGAL_ROUTES.privacy,
  terminos: PLATFORM_LEGAL_ROUTES.terms,
  "eliminacion-de-datos": PLATFORM_LEGAL_ROUTES.dataDeletion,
};

export function buildPlatformLegalMetadata(
  slug: PlatformLegalDocument["slug"]
): Metadata {
  const document = getPlatformLegalDocument(slug);
  const path = ROUTE_BY_SLUG[slug];
  const canonical = `${getAppBaseUrl().replace(/\/$/, "")}${path}`;
  const title = platformLegalTitle(document.title);

  return {
    title,
    description: document.description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description: document.description,
      url: canonical,
      siteName: PLATFORM_DISPLAY_NAME,
      locale: "es_CL",
      type: "article",
    },
  };
}

export function PlatformLegalPage({
  slug,
}: {
  slug: PlatformLegalDocument["slug"];
}) {
  const document = getPlatformLegalDocument(slug);
  return (
    <PlatformLegalShell activeHref={ROUTE_BY_SLUG[slug]}>
      <PlatformLegalDocumentView document={document} />
    </PlatformLegalShell>
  );
}
