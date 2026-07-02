"use client";

import { useMemo, useState } from "react";
import { HeroPremiumSection } from "@/components/portal/sections/HeroPremiumSection";
import { mapResolvedSlidesToPremiumViews } from "@/core/hero/map-slide";
import { buildHeroSlidesSignature } from "@/core/hero/slide-signature";
import { getDisplaySlides } from "@/lib/cms/hero-slide-display";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HeroPortalConfig, ResolvedHeroSlide } from "@/types/hero-portal";

type PreviewViewport = "desktop" | "tablet" | "mobile" | "portal";
type PreviewMode = "editor" | "published";

interface HeroPortalPreviewProps {
  heroPortal: HeroPortalConfig;
  mediaUrls: Record<string, { desktop?: string; mobile?: string }>;
}

const VIEWPORT_WIDTH: Record<PreviewViewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
  portal: "100%",
};

const VIEWPORT_LABEL: Record<PreviewViewport, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
  portal: "Portal",
};

export function HeroPortalPreview({ heroPortal, mediaUrls }: HeroPortalPreviewProps) {
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("editor");

  const resolvedSlides: ResolvedHeroSlide[] = useMemo(() => {
    const slides = getDisplaySlides(heroPortal.slides, {
      preview: previewMode === "editor",
    });

    return slides.map((slide) => {
      const urls = mediaUrls[slide.id];
      return {
        ...slide,
        imagenDesktopUrl: urls?.desktop,
        imagenMobileUrl: urls?.mobile ?? urls?.desktop,
      };
    });
  }, [heroPortal.slides, mediaUrls, previewMode]);

  const views = useMemo(
    () => mapResolvedSlidesToPremiumViews(resolvedSlides),
    [resolvedSlides]
  );

  const slidesKey = useMemo(() => buildHeroSlidesSignature(views), [views]);

  if (!heroPortal.enabled || views.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>
            Activa el hero y configura al menos un slide visible para ver la vista previa.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa</CardTitle>
        <CardDescription>
          Hero Premium — misma apariencia que el portal público. Cambia entre vista de editor y vista publicada.
        </CardDescription>
      </CardHeader>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={previewMode === "editor" ? "primary" : "outline"}
            size="sm"
            onClick={() => setPreviewMode("editor")}
          >
            Editor
          </Button>
          <Button
            type="button"
            variant={previewMode === "published" ? "primary" : "outline"}
            size="sm"
            onClick={() => setPreviewMode("published")}
          >
            Publicado
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["desktop", "tablet", "mobile", "portal"] as PreviewViewport[]).map((vp) => (
            <Button
              key={vp}
              type="button"
              variant={viewport === vp ? "primary" : "outline"}
              size="sm"
              onClick={() => setViewport(vp)}
            >
              {VIEWPORT_LABEL[vp]}
            </Button>
          ))}
        </div>
        <div
          className={cn(
            "overflow-hidden rounded-[var(--radius-lg)] border border-border bg-muted/30 p-4",
            viewport === "portal" && "bg-primary p-0"
          )}
        >
          <div
            className={cn(
              "mx-auto overflow-hidden",
              viewport !== "portal" && "rounded-[var(--radius-md)] border border-border"
            )}
            style={{ maxWidth: VIEWPORT_WIDTH[viewport], width: "100%" }}
          >
            <HeroPremiumSection
              key={slidesKey}
              slides={views}
              type={heroPortal.type}
              carousel={heroPortal.carousel}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
