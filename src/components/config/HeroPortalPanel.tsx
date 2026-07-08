"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { HeroPortalPreview } from "@/components/config/HeroPortalPreview";
import { HeroSlideEditor } from "@/components/config/HeroSlideEditor";
import { HeroSlideList } from "@/components/config/HeroSlideList";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  addHeroSlide,
  duplicateHeroSlide,
  removeHeroSlide,
} from "@/lib/cms/hero-portal-utils";
import type { HeroPortalConfig } from "@/types/hero-portal";
import { HERO_PLACEMENT_CONTEXT_OPTIONS, HERO_SLIDE_MAX } from "@/types/hero-portal";

interface HeroPortalPanelProps {
  value: HeroPortalConfig;
  onChange: (value: HeroPortalConfig) => void;
  tenant: string;
}

async function fetchMediaUrl(mediaId: string): Promise<string | undefined> {
  if (!mediaId.startsWith("media-")) return undefined;
  try {
    const res = await fetch(`/api/cms/media/${encodeURIComponent(mediaId)}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    const asset = data.media ?? data.asset;
    return (asset?.responsive?.w1920 ?? asset?.url) as string | undefined;
  } catch {
    return undefined;
  }
}

export function HeroPortalPanel({ value, onChange, tenant }: HeroPortalPanelProps) {
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    value.slides[0]?.id ?? null
  );
  const [mediaUrls, setMediaUrls] = useState<
    Record<string, { desktop?: string; mobile?: string }>
  >({});

  const update = <K extends keyof HeroPortalConfig>(key: K, fieldValue: HeroPortalConfig[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  const updateCarousel = <K extends keyof HeroPortalConfig["carousel"]>(
    key: K,
    fieldValue: HeroPortalConfig["carousel"][K]
  ) => {
    onChange({ ...value, carousel: { ...value.carousel, [key]: fieldValue } });
  };

  const updateSlide = useCallback(
    (slideId: string, slide: HeroPortalConfig["slides"][number]) => {
      onChange({
        ...value,
        slides: value.slides.map((s) => (s.id === slideId ? slide : s)),
      });
    },
    [onChange, value]
  );

  const selectedSlide = useMemo(
    () => value.slides.find((s) => s.id === selectedSlideId) ?? null,
    [selectedSlideId, value.slides]
  );

  useDeferredEffect(() => {
    if (value.slides.length === 0) {
      setSelectedSlideId(null);
      return;
    }
    if (!selectedSlideId || !value.slides.some((s) => s.id === selectedSlideId)) {
      setSelectedSlideId(value.slides[0]?.id ?? null);
    }
  }, [selectedSlideId, value.slides]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewUrls() {
      const entries = await Promise.all(
        value.slides.map(async (slide) => {
          const desktopId = slide.multimedia.desktopMediaId;
          const mobileId = slide.multimedia.mobileMediaId;
          const [desktop, mobile] = await Promise.all([
            fetchMediaUrl(desktopId),
            mobileId && mobileId !== desktopId
              ? fetchMediaUrl(mobileId)
              : fetchMediaUrl(desktopId),
          ]);
          return [slide.id, { desktop, mobile }] as const;
        })
      );

      if (!cancelled) {
        setMediaUrls(Object.fromEntries(entries));
      }
    }

    void loadPreviewUrls();
    return () => {
      cancelled = true;
    };
  }, [value.slides]);

  const handleAddSlide = () => {
    const next = addHeroSlide(value.slides);
    const newSlide = next[next.length - 1];
    onChange({ ...value, slides: next });
    if (newSlide) setSelectedSlideId(newSlide.id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hero del Portal</CardTitle>
          <CardDescription>
            Constructor de slides — módulo Core AprendeHoy (OT-HERO-006). El diseño queda en código; todo el contenido se administra aquí.
          </CardDescription>
        </CardHeader>
        <div className="space-y-6">
          <Select
            label="Contexto de uso"
            helper="Permite reutilizar el mismo módulo Hero en distintos tipos de landing."
            value={value.context}
            onChange={(e) =>
              update("context", e.target.value as HeroPortalConfig["context"])
            }
            options={HERO_PLACEMENT_CONTEXT_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />

          <Switch
            label="Activar Hero"
            description="Muestra el hero configurado en la portada del portal."
            checked={value.enabled}
            onChange={(v) => update("enabled", v)}
          />

          <RadioGroup
            name="hero-portal-type"
            legend="Tipo"
            value={value.type}
            onChange={(v) => update("type", v as HeroPortalConfig["type"])}
            options={[
              { value: "image", label: "Imagen" },
              { value: "carousel", label: "Carrusel" },
              { value: "video", label: "Video", description: "Próximamente" },
            ]}
          />
        </div>
      </Card>

      {value.type === "carousel" ? (
        <Card>
          <CardHeader>
            <CardTitle>Configuración del carrusel</CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Switch
              label="Reproducción automática"
              checked={value.carousel.autoplay}
              onChange={(v) => updateCarousel("autoplay", v)}
            />
            <Select
              label="Tiempo (segundos)"
              value={String(value.carousel.interval)}
              onChange={(e) =>
                updateCarousel("interval", Number(e.target.value) as HeroPortalConfig["carousel"]["interval"])
              }
              options={[
                { value: "3", label: "3 segundos" },
                { value: "5", label: "5 segundos" },
                { value: "7", label: "7 segundos" },
                { value: "10", label: "10 segundos" },
              ]}
            />
            <Select
              label="Transición"
              value={value.carousel.transition}
              onChange={(e) =>
                updateCarousel("transition", e.target.value as HeroPortalConfig["carousel"]["transition"])
              }
              options={[
                { value: "fade", label: "Fade" },
                { value: "slide", label: "Slide" },
              ]}
            />
            <Select
              label="Duración transición"
              value={String(value.carousel.transitionDuration)}
              onChange={(e) =>
                updateCarousel(
                  "transitionDuration",
                  Number(e.target.value) as HeroPortalConfig["carousel"]["transitionDuration"]
                )
              }
              options={[
                { value: "0.5", label: "0.5 s" },
                { value: "1", label: "1 s" },
              ]}
            />
            <Switch
              label="Mostrar indicadores"
              checked={value.carousel.showIndicators}
              onChange={(v) => updateCarousel("showIndicators", v)}
            />
            <Switch
              label="Mostrar flechas"
              checked={value.carousel.showArrows}
              onChange={(v) => updateCarousel("showArrows", v)}
            />
            <Switch
              label="Pausar al pasar el mouse"
              checked={value.carousel.pauseOnHover}
              onChange={(v) => updateCarousel("pauseOnHover", v)}
            />
            <Switch
              label="Loop infinito"
              checked={value.carousel.loop}
              onChange={(v) => updateCarousel("loop", v)}
            />
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Gestión de slides</CardTitle>
          <CardDescription>
            Máximo recomendado: {HERO_SLIDE_MAX} slides. Arrastra para reordenar.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <HeroSlideList
            slides={value.slides}
            selectedId={selectedSlideId}
            onSelect={setSelectedSlideId}
            onChange={(slides) => onChange({ ...value, slides })}
            onDuplicate={(id) => onChange({ ...value, slides: duplicateHeroSlide(value.slides, id) })}
            onRemove={(id) => {
              onChange({ ...value, slides: removeHeroSlide(value.slides, id) });
              if (selectedSlideId === id) setSelectedSlideId(null);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSlide}
            disabled={value.slides.length >= HERO_SLIDE_MAX}
          >
            <Plus size={16} className="mr-2" />
            Agregar slide
          </Button>
        </div>
      </Card>

      {selectedSlide ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar slide</CardTitle>
            <CardDescription>
              {selectedSlide.content.title.replace(/\n/g, " ").trim() ||
                `Slide ${selectedSlide.order + 1}`}
            </CardDescription>
          </CardHeader>
          <HeroSlideEditor
            slide={selectedSlide}
            tenant={tenant}
            onChange={(slide) => updateSlide(selectedSlide.id, slide)}
            onPreviewUpdate={(field, url) => {
              setMediaUrls((prev) => ({
                ...prev,
                [selectedSlide.id]: {
                  ...prev[selectedSlide.id],
                  [field]: url,
                },
              }));
            }}
          />
        </Card>
      ) : null}

      <HeroPortalPreview heroPortal={value} mediaUrls={mediaUrls} />
    </div>
  );
}
