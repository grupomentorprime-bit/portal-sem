"use client";

import {
  executeExperienceAction,
  resolveExperienceActionLink,
} from "@/core/experience/actions";
import type { ExperienceAction } from "@/types/experience-action";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import { useExperienceAction } from "@/components/portal/experience/ExperienceActionProvider";

interface FooterExperienceLinkProps {
  action: ExperienceAction;
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
}

export function FooterExperienceLink({
  action,
  children,
  className,
  highlighted,
}: FooterExperienceLinkProps) {
  const ctx = useExperienceAction();
  const link = resolveExperienceActionLink(action);

  if (link) {
    return (
      <a
        href={link.href}
        target={link.newTab ? "_blank" : undefined}
        rel={link.newTab ? "noopener noreferrer" : undefined}
        className={cn(focusRing, className)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void executeExperienceAction(action, ctx)}
      className={cn("text-left", focusRing, className)}
    >
      {children}
    </button>
  );
}
