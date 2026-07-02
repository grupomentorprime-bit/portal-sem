"use client";

import type { PortalContactMapView } from "@/types/contact-hub";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface PortalContactMapProps {
  map: PortalContactMapView;
  className?: string;
}

export function PortalContactMap({ map, className }: PortalContactMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("portal-contact-hub__map", className)}
      aria-label={`Mapa: ${map.query}`}
    >
      <div className="portal-contact-hub__map-frame aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-xl)] border border-border bg-background-muted">
        {visible ? (
          <iframe
            title={`Mapa de ${map.query}`}
            src={map.embedUrl}
            loading="lazy"
            className="h-full w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-caption text-muted"
            aria-hidden
          >
            Cargando mapa…
          </div>
        )}
      </div>
    </div>
  );
}
