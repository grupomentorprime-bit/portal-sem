/**
 * @deprecated Usar PortalFooterSocial — ver docs/core/CORE-FOOTER-PREMIUM-v1.md
 */

import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { SocialLinks } from "@/types/cms";
import { SOCIAL_NETWORKS } from "./social-config";

interface FooterSocialProps {
  social?: SocialLinks;
}

export function FooterSocial({ social }: FooterSocialProps) {
  if (!social) return null;

  const active = SOCIAL_NETWORKS.filter(({ key }) => Boolean(social[key]?.trim()));
  if (active.length === 0) return null;

  return (
    <nav className="portal-footer-premium__social" aria-label="Redes sociales">
      {active.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={social[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn("portal-footer-premium__social-link", focusRing)}
        >
          <Icon size={iconSizes.md} />
        </a>
      ))}
    </nav>
  );
}
