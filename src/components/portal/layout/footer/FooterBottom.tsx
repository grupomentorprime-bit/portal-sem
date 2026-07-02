/**
 * @deprecated Usar PortalFooterBottom — ver docs/core/CORE-FOOTER-PREMIUM-v1.md
 */

import Link from "next/link";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/core/navigation";
import type { PortalCopy } from "@/types/cms";

interface FooterBottomProps {
  institutionName: string;
  legalLinks: NavLink[];
  portalCopy: PortalCopy;
}

export function FooterBottom({
  institutionName,
  legalLinks,
  portalCopy,
}: FooterBottomProps) {
  const year = new Date().getFullYear();

  return (
    <div className="portal-footer-premium__bottom">
      <div className="portal-footer-premium__bottom-inner">
        <p className="portal-footer-premium__copyright">
          © {year} {institutionName}
          {portalCopy.footerCopyrightSuffix ? `. ${portalCopy.footerCopyrightSuffix}` : null}
        </p>
        <div className="portal-footer-premium__legal">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.target}
              rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
              className={cn("portal-footer-premium__legal-link", focusRing)}
            >
              {link.label}
            </Link>
          ))}
          {portalCopy.footerAdminLabel ? (
            <Link
              href="/admin/config"
              className={cn("portal-footer-premium__admin-link", focusRing)}
            >
              {portalCopy.footerAdminLabel}
            </Link>
          ) : null}
        </div>
        {portalCopy.footerCredits ? (
          <p className="portal-footer-premium__credits">{portalCopy.footerCredits}</p>
        ) : null}
      </div>
    </div>
  );
}
