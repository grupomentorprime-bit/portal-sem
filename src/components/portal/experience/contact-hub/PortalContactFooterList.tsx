"use client";

import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import {
  executeExperienceAction,
  resolveExperienceActionLink,
} from "@/core/experience/actions";
import type { PortalContactChannelView } from "@/types/contact-hub";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import { useExperienceAction } from "@/components/portal/experience/ExperienceActionProvider";
import { Clock, MapPin } from "lucide-react";
import { FooterSectionHeading } from "@/components/portal/layout/footer/FooterSectionHeading";

interface PortalContactFooterListProps {
  title: string;
  channels: PortalContactChannelView[];
  className?: string;
}

function FooterChannelIcon({ type, icon }: { type: string; icon?: string }) {
  if (icon) return <BlockIcon name={icon} size={iconSizes.sm} aria-hidden />;
  if (type === "hours") return <Clock size={iconSizes.sm} strokeWidth={2} aria-hidden />;
  if (type === "address") return <MapPin size={iconSizes.sm} strokeWidth={2} aria-hidden />;
  return <BlockIcon name="circle" size={iconSizes.sm} aria-hidden />;
}

function FooterChannelItem({ channel }: { channel: PortalContactChannelView }) {
  const ctx = useExperienceAction();
  const link = channel.action ? resolveExperienceActionLink(channel.action) : null;

  const inner = (
    <>
      <span className="portal-footer-premium__contact-icon" aria-hidden>
        <FooterChannelIcon type={channel.type} icon={channel.icon} />
      </span>
      <span>{channel.value}</span>
    </>
  );

  if (!channel.action) {
    return (
      <span className="portal-footer-premium__contact-item">{inner}</span>
    );
  }

  if (link) {
    return (
      <a
        href={link.href}
        target={link.newTab ? "_blank" : undefined}
        rel={link.newTab ? "noopener noreferrer" : undefined}
        className={cn("portal-footer-premium__contact-item portal-footer-premium__contact-link", focusRing)}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void executeExperienceAction(channel.action!, ctx)}
      className={cn(
        "portal-footer-premium__contact-item portal-footer-premium__contact-link w-full text-left",
        focusRing
      )}
    >
      {inner}
    </button>
  );
}

export function PortalContactFooterList({ title, channels, className }: PortalContactFooterListProps) {
  if (channels.length === 0) return null;

  return (
    <div className={cn("portal-footer-premium__column", className)}>
      <FooterSectionHeading title={title} />
      <ul className="portal-footer-premium__contact">
        {channels.map((channel) => (
          <li key={channel.id}>
            <FooterChannelItem channel={channel} />
          </li>
        ))}
      </ul>
    </div>
  );
}
