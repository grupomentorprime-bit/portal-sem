import { PublicVendorCredit } from "@/components/portal/PublicVendorCredit";
import type { PortalFooterPremiumViewModel } from "@/types/footer-premium";
import { FooterExperienceLink } from "./FooterExperienceLink";

interface PortalFooterLegalProps {
  viewModel: PortalFooterPremiumViewModel;
}

export function PortalFooterLegal({ viewModel }: PortalFooterLegalProps) {
  const { legal, adminLabel, adminAction, copyright, copyrightSuffix } = viewModel;

  return (
    <div className="portal-footer-premium__bottom">
      <div className="portal-footer-premium__bottom-inner">
        {copyright ? (
          <p className="portal-footer-premium__copyright">
            {copyright}
            {copyrightSuffix ? `. ${copyrightSuffix}` : null}
          </p>
        ) : null}
        {legal.length > 0 || adminLabel ? (
          <div className="portal-footer-premium__legal">
            {legal.map((link) => (
              <FooterExperienceLink
                key={link.id}
                action={link.action}
                className="portal-footer-premium__legal-link"
              >
                {link.label}
              </FooterExperienceLink>
            ))}
            {adminLabel && adminAction ? (
              <FooterExperienceLink
                action={adminAction}
                className="portal-footer-premium__admin-link"
              >
                {adminLabel}
              </FooterExperienceLink>
            ) : null}
          </div>
        ) : null}
        <PublicVendorCredit className="portal-footer-premium__credits" />
      </div>
    </div>
  );
}

export function PortalFooterBottom({ viewModel }: PortalFooterLegalProps) {
  return <PortalFooterLegal viewModel={viewModel} />;
}
