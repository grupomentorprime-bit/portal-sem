import { PlatformLegalShell } from "@/components/legal/PlatformLegalShell";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import {
  PLATFORM_LEGAL_ROUTES,
  PLATFORM_OPERATOR_NAME,
  platformLegalTitle,
} from "@/core/legal/platform";
import { getAppBaseUrl } from "@/lib/app-url";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

const title = platformLegalTitle("Legales");
const description = `Documentos legales públicos de ${PLATFORM_DISPLAY_NAME}, plataforma operada por ${PLATFORM_OPERATOR_NAME}.`;

export function generateMetadata(): Metadata {
  const canonical = `${getAppBaseUrl().replace(/\/$/, "")}${PLATFORM_LEGAL_ROUTES.index}`;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: PLATFORM_DISPLAY_NAME,
      locale: "es_CL",
      type: "website",
    },
  };
}

const LINKS = [
  {
    href: PLATFORM_LEGAL_ROUTES.privacy,
    title: "Política de privacidad",
    body: "Qué información puede tratarse y cómo se distingue el ámbito de la plataforma del de cada Espacio.",
  },
  {
    href: PLATFORM_LEGAL_ROUTES.terms,
    title: "Términos de servicio",
    body: "Condiciones de uso de la plataforma, cuentas, canales externos y responsabilidades.",
  },
  {
    href: PLATFORM_LEGAL_ROUTES.dataDeletion,
    title: "Eliminación de datos",
    body: "Proceso simple para solicitar la eliminación de datos en Growth OS.",
  },
] as const;

export default function PlatformLegalIndexPage() {
  return (
    <PlatformLegalShell activeHref={PLATFORM_LEGAL_ROUTES.index}>
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--growth-os-secondary)]">
            Growth OS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Legales de plataforma
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            Estos documentos corresponden a {PLATFORM_DISPLAY_NAME} como producto/plataforma
            operada por {PLATFORM_OPERATOR_NAME}. No reemplazan las políticas o términos que
            cada organización cliente publique en su propio Espacio.
          </p>
        </header>

        <ul className="space-y-3">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-border/80 bg-[var(--color-surface-default)] px-4 py-4 transition hover:border-[color-mix(in_srgb,var(--growth-os-primary)_35%,var(--color-border-default))]"
              >
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PlatformLegalShell>
  );
}
