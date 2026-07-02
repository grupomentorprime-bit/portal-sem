import { FooterPremium } from "@/components/portal/footer";
import type { PortalFooterPremiumProps } from "@/types/footer-premium";

export function PortalFooterPremium({ viewModel, className }: PortalFooterPremiumProps) {
  return <FooterPremium viewModel={viewModel} className={className} />;
}
