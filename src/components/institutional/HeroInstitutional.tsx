"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { iconSizes } from "@/design";
import { Button } from "@/components/ui";
import { CMS_ASSET_PATHS } from "@/lib/cms/asset-paths";

interface HeroInstitutionalProps {
  institutionName: string;
  motto?: string;
  heroImage?: string;
  logoSrc?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function HeroInstitutional({
  institutionName,
  motto = "",
  heroImage,
  logoSrc,
  ctaLabel = "Conoce nuestros programas",
  ctaHref = "/programas",
}: HeroInstitutionalProps) {
  const imageSrc = heroImage || CMS_ASSET_PATHS.hero;
  const logo = logoSrc || CMS_ASSET_PATHS.logoSem;
  const scrollToContent = () => {
    document.getElementById("presentacion")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden"
      aria-label="Presentación institucional"
    >
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          className="hero-parallax object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-primary/75"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary/90"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-32 text-center sm:px-6">
        <div className="animate-fade-in">
          <Image
            src={logo}
            alt="Logo del Seminario Eclesiástico Mayor"
            width={120}
            height={120}
            className="mx-auto h-20 w-auto sm:h-28"
            priority
          />
        </div>

        <h1 className="mt-8 animate-slide-up text-display-xxl uppercase tracking-wide text-text-inverse">
          {institutionName}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-body text-text-inverse/90 sm:text-lg">
          {motto}
        </p>

        <div className="mt-10 animate-slide-up">
          <Button href={ctaHref} variant="secondary" size="lg">
            {ctaLabel}
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        className="focus-ring absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full p-2 text-text-inverse/80 transition-colors hover:text-accent"
        aria-label="Continuar al contenido"
      >
        <ChevronDown
          size={iconSizes.xl}
          strokeWidth={2}
          className="animate-scroll-hint"
        />
      </button>
    </section>
  );
}
