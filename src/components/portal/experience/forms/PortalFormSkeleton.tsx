"use client";

import { cn } from "@/lib/utils";

export function PortalFormSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("portal-experience-form portal-experience-form--skeleton", className)}
      aria-busy="true"
      aria-label="Cargando formulario"
    >
      <div className="portal-experience-form__skeleton-header">
        <div className="portal-experience-form__skeleton-line portal-experience-form__skeleton-line--sm" />
        <div className="portal-experience-form__skeleton-line portal-experience-form__skeleton-line--lg" />
        <div className="portal-experience-form__skeleton-line portal-experience-form__skeleton-line--md" />
      </div>
      <div className="portal-experience-form__skeleton-fields">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="portal-experience-form__skeleton-field">
            <div className="portal-experience-form__skeleton-line portal-experience-form__skeleton-line--xs" />
            <div className="portal-experience-form__skeleton-line portal-experience-form__skeleton-line--input" />
          </div>
        ))}
      </div>
      <div className="portal-experience-form__skeleton-line portal-experience-form__skeleton-line--btn" />
    </div>
  );
}
