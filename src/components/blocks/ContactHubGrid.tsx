import { PortalContainer, PortalSection } from "@/components/portal/layout";
import {
  PortalContactHubSection,
  buildContactHubViewModel,
} from "@/components/portal/experience/contact-hub";
import type { PortalContactHubSettings } from "@/types/contact-hub";
import type { ContactInfo, SocialLinks } from "@/types/cms";

interface ContactHubGridProps {
  settings: Record<string, unknown>;
  contact: ContactInfo;
  social?: SocialLinks;
}

export function ContactHubGrid({ settings, contact, social }: ContactHubGridProps) {
  const viewModel = buildContactHubViewModel(settings as PortalContactHubSettings, {
    contact,
    social,
  });

  return (
    <PortalSection id="contacto">
      <PortalContainer>
        <PortalContactHubSection viewModel={viewModel} id="contacto" />
      </PortalContainer>
    </PortalSection>
  );
}
