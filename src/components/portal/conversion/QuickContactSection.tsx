/**
 * @deprecated Usar PortalContactHub / bloque contact_hub — ver docs/core/CORE-CONTACT-HUB-v1.md
 */

import { PortalContainer, PortalSection } from "@/components/portal/layout";
import {
  PortalContactHubSection,
  buildContactHubViewModel,
} from "@/components/portal/experience/contact-hub";
import { asString } from "@/lib/cms/block-utils";
import type { ContactInfo, SocialLinks } from "@/types/cms";

interface QuickContactSectionProps {
  overline?: string;
  title?: string;
  description?: string;
  contact: ContactInfo;
  social?: SocialLinks;
  showWhatsapp?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showHours?: boolean;
  showAddress?: boolean;
}

export function QuickContactSection({
  overline,
  title,
  description,
  contact,
  social,
  showWhatsapp = true,
  showEmail = true,
  showPhone = true,
  showHours = true,
  showAddress = true,
}: QuickContactSectionProps) {
  const sectionTitle = asString(title);
  if (!sectionTitle) return null;

  const viewModel = buildContactHubViewModel(
    {
      overline,
      title: sectionTitle,
      description,
      showMap: false,
      showForm: false,
      showLocations: false,
      showSocial: false,
      showHours,
      useInstitutionDefaults: true,
      actions: [],
    },
    { contact, social }
  );

  viewModel.channels = viewModel.channels.filter((ch) => {
    if (ch.type === "whatsapp" && !showWhatsapp) return false;
    if (ch.type === "email" && !showEmail) return false;
    if (ch.type === "phone" && !showPhone) return false;
    if (ch.type === "hours" && !showHours) return false;
    if (ch.type === "address" && !showAddress) return false;
    return true;
  });

  if (viewModel.channels.length === 0) return null;

  return (
    <PortalSection id="contacto-rapido">
      <PortalContainer>
        <PortalContactHubSection viewModel={viewModel} id="contacto-rapido" />
      </PortalContainer>
    </PortalSection>
  );
}
