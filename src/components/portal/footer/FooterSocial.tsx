"use client";

import type { ComponentType } from "react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { PortalFooterSocialItem } from "@/types/footer-premium";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  WhatsAppIcon,
} from "@/components/portal/layout/footer/social-config";
import { FooterExperienceLink } from "@/components/portal/experience/footer-premium/FooterExperienceLink";

interface FooterSocialProps {
  items: PortalFooterSocialItem[];
  className?: string;
}

const ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  whatsapp: WhatsAppIcon,
};

export function FooterSocial({ items, className }: FooterSocialProps) {
  if (items.length === 0) return null;

  return (
    <nav className={cn("footer-premium__social", className)} aria-label="Redes sociales">
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon] ?? ICON_MAP[item.id];
        return (
          <FooterExperienceLink
            key={item.id}
            action={item.action}
            className={cn("footer-premium__social-link", focusRing)}
          >
            {Icon ? <Icon size={iconSizes.md} /> : item.label}
            <span className="sr-only">{item.label}</span>
          </FooterExperienceLink>
        );
      })}
    </nav>
  );
}
