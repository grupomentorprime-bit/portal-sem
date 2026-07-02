import { PortalContainer, PortalSection } from "@/components/portal/layout";
import {
  PortalContactHubSection,
  buildContactHubViewModel,
} from "@/components/portal/experience/contact-hub";
import { blockSettings } from "@/lib/portal/blocks";
import type { PortalContactHubSettings } from "@/types/contact-hub";
import type { ContactInfo, SocialLinks } from "@/types/cms";
import type { PageBlock } from "@/types/page";

interface ContactHubBlockSectionProps {
  block: PageBlock;
  contact: ContactInfo;
  social?: SocialLinks;
}

export function ContactHubBlockSection({ block, contact, social }: ContactHubBlockSectionProps) {
  const settings = blockSettings<PortalContactHubSettings>(block);
  const viewModel = buildContactHubViewModel(settings, { contact, social });

  if (viewModel.channels.length === 0 && !viewModel.map && viewModel.actions.length === 0) {
    return null;
  }

  return (
    <PortalSection id="contacto">
      <PortalContainer>
        <PortalContactHubSection viewModel={viewModel} id="contacto" />
      </PortalContainer>
    </PortalSection>
  );
}
