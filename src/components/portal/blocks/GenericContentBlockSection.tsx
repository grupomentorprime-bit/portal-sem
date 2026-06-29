import "server-only";

import { TextSection } from "@/components/blocks/TextSection";
import { ContactForm } from "@/components/blocks/ContactForm";
import { Divider } from "@/components/blocks/Divider";
import { VideoSection } from "@/components/blocks/VideoSection";
import { HtmlBlock } from "@/components/blocks/HtmlBlock";
import { MarkdownBlock } from "@/components/blocks/MarkdownBlock";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import type { ContactInfo } from "@/types/cms";
import type { PageBlock } from "@/types/page";

interface GenericContentBlockSectionProps {
  block: PageBlock;
  tenant: string;
  contact: ContactInfo;
}

export async function GenericContentBlockSection({
  block,
  contact,
}: GenericContentBlockSectionProps) {
  const s = block.settings;

  switch (block.type) {
    case "text":
      return (
        <PortalSection id={block.id}>
          <PortalContainer>
            <TextSection settings={s} />
          </PortalContainer>
        </PortalSection>
      );
    case "contact":
      return (
        <PortalSection id={block.id}>
          <PortalContainer size="md">
            <ContactForm settings={s} contact={contact} />
          </PortalContainer>
        </PortalSection>
      );
    case "video":
      return (
        <PortalSection id={block.id}>
          <PortalContainer>
            <VideoSection settings={s} />
          </PortalContainer>
        </PortalSection>
      );
    case "divider":
      return <Divider settings={s} />;
    case "html":
      return (
        <PortalSection id={block.id}>
          <PortalContainer>
            <HtmlBlock settings={s} />
          </PortalContainer>
        </PortalSection>
      );
    case "markdown":
      return (
        <PortalSection id={block.id}>
          <PortalContainer size="md">
            <MarkdownBlock settings={s} />
          </PortalContainer>
        </PortalSection>
      );
    default:
      return null;
  }
}
