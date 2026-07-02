"use client";

import { BlockIcon } from "@/components/portal/BlockIcon";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { focusRing } from "@/components/ui/shared";
import { iconSizes } from "@/design";
import {
  executeExperienceAction,
  requiresExperienceActionHandler,
  resolveExperienceActionLink,
} from "@/core/experience/actions";
import type { ExperienceAction } from "@/types/experience-action";
import { cn } from "@/lib/utils";
import { useExperienceAction } from "./ExperienceActionProvider";

export interface ExperienceActionButtonProps {
  label: string;
  action: ExperienceAction;
  variant?: ButtonVariant;
  size?: ButtonSize;
  inverse?: boolean;
  icon?: string;
  className?: string;
}

export function ExperienceActionButton({
  label,
  action,
  variant = "primary",
  size = "lg",
  inverse = false,
  icon,
  className,
}: ExperienceActionButtonProps) {
  const ctx = useExperienceAction();
  const resolvedVariant =
    inverse && variant === "primary"
      ? "secondary"
      : inverse && variant === "outline"
        ? "outline"
        : variant;

  const iconNode = icon ? (
    <BlockIcon name={icon} size={iconSizes.sm} aria-hidden />
  ) : null;

  const link = resolveExperienceActionLink(action);
  const useHandler = requiresExperienceActionHandler(action);

  const handleClick = () => {
    void executeExperienceAction(action, ctx);
  };

  if (link && !useHandler) {
    if (link.newTab || link.download) {
      return (
        <a
          href={link.href}
          target={link.newTab ? "_blank" : undefined}
          rel={link.newTab ? "noopener noreferrer" : undefined}
          download={link.download}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 text-base font-medium transition-[background-color,opacity,transform,box-shadow] duration-[var(--transition-fast)]",
            focusRing,
            className
          )}
        >
          {iconNode}
          {label}
        </a>
      );
    }

    return (
      <Button href={link.href} variant={resolvedVariant} size={size} className={className}>
        {iconNode}
        {label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={resolvedVariant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {iconNode}
      {label}
    </Button>
  );
}
