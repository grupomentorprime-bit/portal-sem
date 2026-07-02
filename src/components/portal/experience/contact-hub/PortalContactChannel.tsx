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

interface PortalContactChannelProps {
  channel: PortalContactChannelView;
  compact?: boolean;
  className?: string;
}

function StaticIcon({ type, icon }: { type: string; icon?: string }) {
  if (icon) {
    return <BlockIcon name={icon} size={iconSizes.md} aria-hidden />;
  }
  if (type === "hours") return <Clock size={iconSizes.md} strokeWidth={1.75} aria-hidden />;
  if (type === "address") return <MapPin size={iconSizes.md} strokeWidth={1.75} aria-hidden />;
  return <BlockIcon name="circle" size={iconSizes.md} aria-hidden />;
}

export function PortalContactChannel({ channel, compact = false, className }: PortalContactChannelProps) {
  const ctx = useExperienceAction();
  const link = channel.action ? resolveExperienceActionLink(channel.action) : null;

  const content = (
    <>
      <span className="portal-contact-hub__channel-icon portal-icon-badge inline-flex" aria-hidden>
        <StaticIcon type={channel.type} icon={channel.icon} />
      </span>
      <p className="text-caption font-semibold uppercase tracking-wide text-secondary">{channel.name}</p>
      <p className="mt-1 text-body text-foreground">{channel.value}</p>
    </>
  );

  const cardClass = cn(
    "portal-contact-hub__channel",
    compact && "portal-contact-hub__channel--compact",
    className
  );

  if (!channel.action) {
    return (
      <div className={cn(cardClass, "portal-contact-hub__channel--static")}>{content}</div>
    );
  }

  if (link) {
    return (
      <a
        href={link.href}
        target={link.newTab ? "_blank" : undefined}
        rel={link.newTab ? "noopener noreferrer" : undefined}
        className={cn(
          cardClass,
          "portal-contact-hub__channel--interactive transition-shadow hover:shadow-[var(--shadow-md)]",
          focusRing
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void executeExperienceAction(channel.action!, ctx)}
      className={cn(
        cardClass,
        "portal-contact-hub__channel--interactive w-full text-left transition-shadow hover:shadow-[var(--shadow-md)]",
        focusRing
      )}
    >
      {content}
    </button>
  );
}
