"use client";

import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { PortalFooterSocialItem } from "@/types/footer-premium";
import { SOCIAL_NETWORKS } from "@/components/portal/layout/footer/social-config";
import { FooterExperienceLink } from "./FooterExperienceLink";

interface PortalFooterSocialProps {
  items: PortalFooterSocialItem[];
}

export function PortalFooterSocial({ items }: PortalFooterSocialProps) {
  if (items.length === 0) return null;

  const iconMap = Object.fromEntries(
    SOCIAL_NETWORKS.map(({ key, Icon }) => [key, Icon])
  );

  return (
    <nav
      className="portal-footer-premium__social portal-footer-premium__social--row"
      aria-label="Redes sociales"
    >
      {items.map((item) => {
        const Icon = iconMap[item.icon] ?? iconMap[item.id];
        return (
          <FooterExperienceLink
            key={item.id}
            action={item.action}
            className={cn("portal-footer-premium__social-link", focusRing)}
          >
            {Icon ? <Icon size={iconSizes.md} /> : item.label}
            <span className="sr-only">{item.label}</span>
          </FooterExperienceLink>
        );
      })}
    </nav>
  );
}
