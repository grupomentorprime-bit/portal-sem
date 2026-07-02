"use client";

import type { PortalCTAButtonsProps } from "@/types/cta-premium";
import { cn } from "@/lib/utils";
import { ExperienceActionButton } from "../ExperienceActionButton";

export function PortalCTAButtons({ buttons, inverse = false, className }: PortalCTAButtonsProps) {
  const visible = buttons.filter((btn) => btn.visible !== false).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <div
      className={cn("portal-cta-premium__actions", className)}
      role="group"
      aria-label="Acciones"
    >
      {visible.map((button) => (
        <ExperienceActionButton
          key={button.id ?? `${button.label}-${button.action.type}`}
          label={button.label}
          action={button.action}
          variant={button.variant ?? "primary"}
          inverse={inverse}
          icon={button.icon}
          className={cn(
            "portal-cta-premium__btn w-full sm:w-auto",
            inverse &&
              button.variant === "outline" &&
              "border-text-inverse/45 !bg-transparent text-text-inverse hover:!bg-text-inverse/12 hover:text-text-inverse",
            inverse &&
              button.variant === "ghost" &&
              "text-text-inverse hover:bg-text-inverse/10"
          )}
        />
      ))}
    </div>
  );
}
