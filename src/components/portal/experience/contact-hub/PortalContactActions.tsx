"use client";

import { ExperienceActionButton } from "@/components/portal/experience/ExperienceActionButton";
import type { PortalContactHubAction } from "@/types/contact-hub";
import { cn } from "@/lib/utils";

interface PortalContactActionsProps {
  actions: PortalContactHubAction[];
  className?: string;
}

export function PortalContactActions({ actions, className }: PortalContactActionsProps) {
  const visible = actions.filter((a) => a.visible !== false);
  if (visible.length === 0) return null;

  return (
    <div
      className={cn("portal-contact-hub__actions", className)}
      role="group"
      aria-label="Acciones de contacto"
    >
      {visible.map((item, index) => (
        <ExperienceActionButton
          key={item.id ?? item.label}
          label={item.label}
          action={item.action}
          variant={
            item.variant ??
            (index === 0 && item.action.type === "whatsapp" ? "primary" : item.variant ?? "outline")
          }
          icon={item.icon}
          className={cn(
            "portal-contact-hub__action-btn w-full sm:w-auto",
            item.action.type === "whatsapp" && "portal-contact-hub__action-btn--whatsapp"
          )}
        />
      ))}
    </div>
  );
}
