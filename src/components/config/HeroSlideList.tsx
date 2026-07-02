"use client";

import { Copy, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getPublicationStatusLabel } from "@/lib/cms/hero-slide-display";
import { reorderHeroSlides } from "@/lib/cms/hero-portal-utils";
import { cn } from "@/lib/utils";
import type { HeroSlide, HeroSlidePriority } from "@/types/hero-portal";
import { HERO_SLIDE_PRIORITY_OPTIONS } from "@/types/hero-portal";

interface HeroSlideListProps {
  slides: HeroSlide[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (slides: HeroSlide[]) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}

const PRIORITY_LABEL = Object.fromEntries(
  HERO_SLIDE_PRIORITY_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<HeroSlidePriority, string>;

const STATUS_BADGE_CLASS: Record<HeroSlide["publication"]["status"], string> = {
  draft: "bg-muted text-muted",
  published: "bg-secondary/15 text-secondary",
  scheduled: "bg-primary/10 text-primary",
  archived: "bg-border text-muted",
};

export function HeroSlideList({
  slides,
  selectedId,
  onSelect,
  onChange,
  onDuplicate,
  onRemove,
}: HeroSlideListProps) {
  const sorted = [...slides].sort((a, b) => a.order - b.order);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!draggedId) return;
    onChange(reorderHeroSlides(slides, draggedId, targetId));
    setDraggedId(null);
  };

  if (sorted.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center text-caption text-muted">
        Sin slides. Agrega el primero para configurar el hero.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((slide, index) => {
        const status = slide.publication.status;
        const title = slide.content.title.replace(/\n/g, " ").trim();

        return (
          <div
            key={slide.id}
            draggable
            onDragStart={() => setDraggedId(slide.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(slide.id)}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-md)] border bg-background px-3 py-3 transition",
              selectedId === slide.id ? "border-secondary shadow-[var(--shadow-sm)]" : "border-border",
              status === "archived" && "opacity-60",
              draggedId === slide.id && "opacity-40"
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" strokeWidth={2} />
            <button
              type="button"
              onClick={() => onSelect(slide.id)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="text-body font-medium text-foreground">
                Slide {index + 1}
                {title ? `: ${title}` : ""}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                    STATUS_BADGE_CLASS[status]
                  )}
                >
                  {getPublicationStatusLabel(status)}
                </span>
                {slide.priority !== "normal" ? (
                  <span className="text-caption text-muted">
                    {PRIORITY_LABEL[slide.priority]}
                  </span>
                ) : null}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(slide.id)}
                aria-label="Duplicar slide"
              >
                <Copy size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(slide.id)}
                aria-label="Eliminar slide"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
