import { PortalContactFooterList } from "@/components/portal/experience/contact-hub/PortalContactFooterList";
import type { PortalContactHubViewModel } from "@/types/contact-hub";

interface PortalFooterContactProps {
  contact: PortalContactHubViewModel;
}

export function PortalFooterContact({ contact }: PortalFooterContactProps) {
  return (
    <PortalContactFooterList title={contact.title} channels={contact.channels} />
  );
}
