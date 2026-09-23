import Image from "next/image";
import Link from "next/link";
import { ProductMark, PlatformNeutralTheme } from "@/components/product";
import { Button } from "@/components/ui/button";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import {
  PLATFORM_LEGAL_ROUTES,
  PLATFORM_OPERATOR_NAME,
  PLATFORM_SUPPORT_EMAIL,
} from "@/core/legal/platform";

const OUTCOMES = [
  {
    title: "Sitio con marca propia",
    body: "Cada Espacio publica su portal institucional con su identidad, sus páginas y su dirección web.",
  },
  {
    title: "Captación y seguimiento",
    body: "Formularios, postulaciones y personas en un solo flujo, listo para operar el día a día.",
  },
  {
    title: "Equipo con control",
    body: "Accesos separados del sitio público. Quienes administran entran a su Espacio, no a la vitrina.",
  },
] as const;

/**
 * Portada pública de Growth OS. No muestra contenido de ningún Espacio.
 */
export function PlatformPublicLanding() {
  return (
    <PlatformNeutralTheme className="min-h-screen bg-[var(--color-background-default)] text-foreground">
      <div className="platform-landing relative isolate flex min-h-screen flex-col">
        {/* —— Hero comercial a pantalla completa —— */}
        <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
          <div className="absolute inset-0" aria-hidden>
            <Image
              src="/images/platform/hero-landing.jpg"
              alt=""
              fill
              priority
              unoptimized
              className="object-cover object-[62%_40%] scale-[1.03] animate-[zoom-in_1.35s_ease-out_both]"
              sizes="100vw"
            />
            {/* Velo comercial: marca legible a la izquierda, foto presente a la derecha */}
            <div className="absolute inset-0 bg-[linear-gradient(105deg,var(--gray-900)_0%,var(--gray-900)_28%,color-mix(in_srgb,var(--growth-os-primary)_88%,var(--gray-900))_46%,color-mix(in_srgb,var(--growth-os-primary)_55%,transparent)_62%,color-mix(in_srgb,var(--gray-900)_18%,transparent)_78%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_20%,color-mix(in_srgb,var(--growth-os-secondary)_32%,transparent),transparent_50%)]" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,var(--color-background-default),transparent)]" />
          </div>

          <header className="relative z-20 animate-[fade-in_0.55s_ease-out_both]">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <ProductMark
                  href="/"
                  size="md"
                  className="[&_span]:!text-white"
                />
                <span className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden />
                <p className="hidden truncate text-xs text-white/65 sm:block">
                  por {PLATFORM_OPERATOR_NAME}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={PLATFORM_LEGAL_ROUTES.index}
                  className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:inline"
                >
                  Legales
                </Link>
                <Button
                  href="/ingresar"
                  size="md"
                  className="!bg-white !text-[var(--growth-os-primary)] hover:!bg-white/92 hover:!text-[var(--growth-os-primary)]"
                >
                  Ingresar
                </Button>
              </div>
            </div>
          </header>

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-20 pt-8 sm:px-8 sm:pb-24 lg:px-10">
            <div className="max-w-[34rem] animate-[slide-up_0.75s_ease-out_0.08s_both]">
              <p className="text-[clamp(3rem,9vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.055em] text-white drop-shadow-[0_2px_24px_rgba(3,26,51,0.35)]">
                {PLATFORM_DISPLAY_NAME}
              </p>
              <h1 className="mt-6 text-[clamp(1.45rem,3.4vw,2.05rem)] font-semibold leading-[1.2] tracking-tight text-white">
                La plataforma para hacer crecer organizaciones con su propia
                dirección.
              </h1>
              <p className="mt-4 max-w-[28rem] text-[1.02rem] leading-relaxed text-white/80">
                Un Espacio. Un sitio. Un equipo. Growth OS concentra la
                operación digital de cada organización sin mezclar marcas ni
                audiencias.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3 animate-[fade-in_0.55s_ease-out_0.28s_both]">
                <Button
                  href="/ingresar"
                  size="lg"
                  className="min-w-[11.5rem] !bg-white !text-[var(--growth-os-primary)] hover:!bg-white/93 hover:!text-[var(--growth-os-primary)] active:!bg-white"
                >
                  Ingresar a la plataforma
                </Button>
                <a
                  href={`mailto:${PLATFORM_SUPPORT_EMAIL}`}
                  className="inline-flex h-12 items-center px-3 text-sm font-medium text-white/80 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Hablar con {PLATFORM_OPERATOR_NAME}
                </a>
              </div>

              <p className="mt-8 max-w-sm text-xs leading-relaxed text-white/55 animate-[fade-in_0.55s_ease-out_0.42s_both]">
                Esta es la entrada de la plataforma. El sitio público de cada
                organización se abre en la dirección que le corresponde.
              </p>
            </div>
          </div>
        </section>

        {/* —— Valor comercial —— */}
        <section className="relative bg-[var(--color-background-default)]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--growth-os-secondary)]">
                Por qué Growth OS
              </p>
              <h2 className="mt-3 text-[clamp(1.65rem,3vw,2.35rem)] font-semibold tracking-tight text-[var(--growth-os-primary)]">
                Multiplica impacto sin diluir la identidad de cada organización.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                Diseñada para operar varios Espacios desde una sola plataforma:
                presencia pública, captación de personas y trabajo interno, con
                fronteras claras entre marcas.
              </p>
            </div>

            <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-3">
              {OUTCOMES.map((item, index) => (
                <li key={item.title} className="relative">
                  <div className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className="text-sm font-semibold tracking-[0.12em] text-[var(--growth-os-secondary)]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden
                      className="h-px flex-1 bg-[color-mix(in_srgb,var(--growth-os-secondary)_28%,transparent)]"
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* —— Cierre comercial —— */}
        <section className="relative overflow-hidden border-y border-[color-mix(in_srgb,var(--growth-os-primary)_14%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--growth-os-primary)_8%,white),color-mix(in_srgb,var(--growth-os-secondary)_10%,white))]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-16 lg:px-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--growth-os-secondary)]">
                Empieza ahora
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--growth-os-primary)] sm:text-3xl">
                Entra a {PLATFORM_DISPLAY_NAME} y opera tu Espacio.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Acceso para equipos y operadores. Si aún no tienes cuenta,
                contacta a {PLATFORM_OPERATOR_NAME}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/ingresar" variant="primary" size="lg">
                Ingresar
              </Button>
              <Button
                href={`mailto:${PLATFORM_SUPPORT_EMAIL}`}
                variant="outline"
                size="lg"
              >
                Contactar
              </Button>
            </div>
          </div>
        </section>

        <footer className="bg-[var(--color-background-default)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
            <p>
              © {new Date().getFullYear()} {PLATFORM_DISPLAY_NAME}
              <span className="mx-2 text-border">·</span>
              Operada por {PLATFORM_OPERATOR_NAME}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href={PLATFORM_LEGAL_ROUTES.index}
                className="font-medium text-[var(--growth-os-primary)] underline-offset-2 transition hover:underline"
              >
                Legales
              </Link>
              <a
                href={`mailto:${PLATFORM_SUPPORT_EMAIL}`}
                className="font-medium text-[var(--growth-os-primary)] underline-offset-2 transition hover:underline"
              >
                {PLATFORM_SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </PlatformNeutralTheme>
  );
}
