/**
 * @deprecated Usar PortalFooterNavigation — ver docs/core/CORE-FOOTER-PREMIUM-v1.md
 */

import Link from "next/link";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/core/navigation";
import { FooterSectionHeading } from "./FooterSectionHeading";

interface FooterLinkColumnProps {
  title: string;
  links: NavLink[];
}

export function FooterLinkColumn({ title, links }: FooterLinkColumnProps) {
  if (links.length === 0) return null;

  return (
    <div className="portal-footer-premium__column">
      <FooterSectionHeading title={title} />
      <ul className="portal-footer-premium__links">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              target={link.target}
              rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
              className={cn("portal-footer-premium__link", focusRing, link.highlighted && "portal-footer-premium__link--highlight")}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
