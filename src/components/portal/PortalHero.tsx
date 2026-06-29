import Image from "next/image";
import { Button } from "@/components/ui";
import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";

interface PortalHeroProps {
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  heroImage?: string;
  logoSrc?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function PortalHero({
  badge,
  title,
  subtitle,
  description,
  heroImage,
  logoSrc,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: PortalHeroProps) {
  const imageSrc = heroImage || PLATFORM_ASSET_FALLBACKS.hero;
  const logo = logoSrc || PLATFORM_ASSET_FALLBACKS.logo;

  return (
    <section className="relative flex min-h-[85dvh] items-center overflow-hidden" aria-label="Presentación">
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          className="hero-parallax object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-primary/80" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/70 to-secondary/40"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        {badge ? (
          <span className="inline-block rounded-full border border-text-inverse/25 bg-text-inverse/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-text-inverse/90">
            {badge}
          </span>
        ) : null}

        <div className="mt-6 animate-fade-in">
          <Image
            src={logo}
            alt=""
            width={100}
            height={100}
            className="mx-auto h-16 w-auto sm:h-20"
            priority
          />
        </div>

        <h1 className="mt-6 animate-slide-up text-display-xl font-semibold text-text-inverse sm:text-display-xxl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl animate-slide-up text-lg font-medium text-accent sm:text-xl">
            {subtitle}
          </p>
        ) : null}

        {description ? (
          <p className="mx-auto mt-4 max-w-2xl animate-slide-up text-body text-text-inverse/85 sm:text-lg">
            {description}
          </p>
        ) : null}

        {(primaryLabel && primaryHref) || (secondaryLabel && secondaryHref) ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 animate-slide-up sm:flex-row">
            {primaryLabel && primaryHref ? (
              <Button href={primaryHref} variant="secondary" size="lg">
                {primaryLabel}
              </Button>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Button
                href={secondaryHref}
                variant="outline"
                size="lg"
                className="border-text-inverse/30 text-text-inverse hover:bg-text-inverse/10"
              >
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
