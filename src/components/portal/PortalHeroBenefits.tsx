/**
 * @deprecated
 *
 * Reemplazado por:
 * HeroPremiumSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { CheckCircle2 } from "lucide-react";
import { iconSizes } from "@/design";
import { PortalContainer } from "@/components/portal/layout";

interface PortalHeroBenefitsProps {
  items: string[];
}

export function PortalHeroBenefits({ items }: PortalHeroBenefitsProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-border bg-background">
      <PortalContainer size="full" className="py-6 sm:py-8">
        <ul className="portal-hero-benefits">
          {items.map((item) => (
            <li key={item} className="portal-hero-benefits__item">
              <span className="portal-icon-badge" aria-hidden>
                <CheckCircle2 size={iconSizes.sm} strokeWidth={2} />
              </span>
              <span className="text-caption font-medium text-foreground sm:text-body">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </PortalContainer>
    </div>
  );
}

/** Parsea badge del bloque hero CMS (separadores · | ,) */
export function parseHeroBenefits(badge?: string): string[] {
  if (!badge?.trim()) return [];
  return badge
    .split(/\s*[·|,]\s*|\s+-\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
