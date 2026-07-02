import "server-only";

import { resolveMediaRef } from "@/core/media";
import { getDisplaySlides } from "@/lib/cms/hero-slide-display";
import type { HeroPortalConfig, ResolvedHeroSlide } from "@/types/hero-portal";

export async function resolveHeroSlides(
  tenant: string,
  heroPortal: HeroPortalConfig,
  options: { preview?: boolean } = {}
): Promise<ResolvedHeroSlide[]> {
  const displaySlides = getDisplaySlides(heroPortal.slides, {
    preview: options.preview,
  });

  return Promise.all(
    displaySlides.map(async (slide) => {
      const desktopId = slide.multimedia.desktopMediaId;
      const mobileId = slide.multimedia.mobileMediaId;

      const [imagenDesktopUrl, imagenMobileUrl] = await Promise.all([
        desktopId
          ? resolveMediaRef(tenant, { mediaId: desktopId }, "w1920")
          : Promise.resolve(null),
        mobileId
          ? resolveMediaRef(tenant, { mediaId: mobileId }, "w1080")
          : desktopId
            ? resolveMediaRef(tenant, { mediaId: desktopId }, "w1920")
            : Promise.resolve(null),
      ]);

      return {
        ...slide,
        imagenDesktopUrl: imagenDesktopUrl ?? undefined,
        imagenMobileUrl: imagenMobileUrl ?? imagenDesktopUrl ?? undefined,
      };
    })
  );
}

export function getHeroPortalSlidesForDisplay(
  heroPortal: HeroPortalConfig,
  type?: HeroPortalConfig["type"],
  options: { preview?: boolean } = {}
): HeroPortalConfig["slides"] {
  const displayType = type ?? heroPortal.type;
  const slides = getDisplaySlides(heroPortal.slides, options);

  if (displayType === "image") {
    return slides.slice(0, 1);
  }

  return slides;
}
