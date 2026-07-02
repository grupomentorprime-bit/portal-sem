import { BackToTop } from "@/components/portal/layout/footer/BackToTop";
import { PortalContainer } from "@/components/portal/layout/PortalContainer";
import type { PortalFooterPremiumViewModel } from "@/types/footer-premium";
import { resolveFooterContent } from "@/lib/portal/footer-content";
import { cn } from "@/lib/utils";
import { FooterCTA } from "./FooterCTA";
import { FooterInstitution } from "./FooterInstitution";
import { FooterColumns } from "./FooterColumns";
import { FooterContactColumn } from "./FooterContactColumn";
import { FooterBottom } from "./FooterBottom";

interface FooterPremiumProps {
  viewModel: PortalFooterPremiumViewModel;
  whatsapp?: string;
  className?: string;
}

export function FooterPremium({ viewModel, whatsapp, className }: FooterPremiumProps) {
  const { settings } = viewModel;
  const content = resolveFooterContent(viewModel, whatsapp);

  const hasMain =
    content.brand.institutionName ||
    content.navigation.length > 0 ||
    content.social.length > 0;

  if (!hasMain && !settings.showLegal) return null;

  return (
    <footer
      className={cn(
        "portal-footer-premium portal-footer-premium--v2 footer-premium",
        className
      )}
      aria-label="Pie de página institucional"
    >
      <FooterCTA content={content.cta} />

      {hasMain ? (
        <div className="footer-premium__main">
          <PortalContainer>
            <div className="footer-premium__grid">
              <FooterInstitution
                brand={content.brand}
                institution={content.institution}
                social={settings.showSocial ? content.social : []}
              />
              {settings.showNavigation ? (
                <>
                  <FooterColumns sections={content.navigation} />
                  {settings.showContact ? (
                    <FooterContactColumn contact={content.contact} />
                  ) : null}
                </>
              ) : null}
            </div>
          </PortalContainer>
        </div>
      ) : null}

      {settings.showLegal ? (
        <FooterBottom copyright={content.copyright} legal={content.legal} />
      ) : null}

      {content.backToTopLabel ? <BackToTop label={content.backToTopLabel} /> : null}
    </footer>
  );
}
