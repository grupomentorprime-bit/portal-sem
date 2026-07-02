import { PortalBrandMark } from "@/components/portal/PortalBrandMark";
import type { PortalFooterBrandView } from "@/types/footer-premium";

interface PortalFooterBrandProps {
  brand: PortalFooterBrandView;
}

export function PortalFooterBrand({ brand }: PortalFooterBrandProps) {
  return (
    <div className="portal-footer-premium__column portal-footer-premium__column--institution">
      <PortalBrandMark
        logoPrimary={brand.logoPrimary}
        logoSecondary={brand.logoSecondary}
        institutionName={brand.institutionName}
        institutionShortName={brand.institutionShortName}
        organization={brand.organization}
        variant="dark"
      />
      {brand.institutionName ? (
        <p className="portal-footer-premium__institution-name">{brand.institutionName}</p>
      ) : null}
      {brand.description ? (
        <p className="portal-footer-premium__description">{brand.description}</p>
      ) : null}
      {brand.tagline ? (
        <p className="portal-footer-premium__tagline">{brand.tagline}</p>
      ) : null}
    </div>
  );
}
