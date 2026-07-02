/**
 * @deprecated Usar PortalContactHub — ver docs/core/CORE-CONTACT-HUB-v1.md
 */

import type { ContactInfo } from "@/types/cms";
import { PortalContactHub } from "@/components/portal/experience/contact-hub";
import { buildFooterContactViewModel } from "@/components/portal/experience/contact-hub/mappers";

interface FooterContactProps {
  title: string;
  contact?: ContactInfo;
}

export function FooterContact({ title, contact }: FooterContactProps) {
  if (!contact) return null;

  const viewModel = buildFooterContactViewModel({ contact }, title);

  return <PortalContactHub viewModel={viewModel} layout="footer" />;
}
