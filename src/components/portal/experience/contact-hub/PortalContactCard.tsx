import type { PortalContactChannelView } from "@/types/contact-hub";
import { cn } from "@/lib/utils";
import { PortalContactChannel } from "./PortalContactChannel";

interface PortalContactCardProps {
  channels: PortalContactChannelView[];
  compact?: boolean;
  className?: string;
}

export function PortalContactCard({ channels, compact = false, className }: PortalContactCardProps) {
  if (channels.length === 0) return null;

  return (
    <ul
      className={cn("portal-contact-hub__channels", className)}
      role="list"
      aria-label="Canales de contacto"
    >
      {channels.map((channel) => (
        <li key={channel.id} className="h-full">
          <PortalContactChannel channel={channel} compact={compact} />
        </li>
      ))}
    </ul>
  );
}
