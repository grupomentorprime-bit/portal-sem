import { BlockIcon } from "@/components/portal/BlockIcon";
import { Button } from "@/components/ui/button";
import { iconSizes } from "@/design";
import type { AdmissionClosingActionItem } from "@/types/admission-closing";
import { sortClosingBlocks } from "@/lib/portal/admission-closing-utils";
import { cn } from "@/lib/utils";

interface ClosingActionsProps {
  items: AdmissionClosingActionItem[];
  layout?: "default" | "hero";
}

function ActionLink({
  item,
  className,
}: {
  item: AdmissionClosingActionItem;
  className?: string;
}) {
  const icon = item.icon ? (
    <BlockIcon name={item.icon} size={iconSizes.sm} aria-hidden />
  ) : null;

  if (item.openInNewTab || item.href.startsWith("http")) {
    return (
      <a
        href={item.href}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        className={className}
      >
        {icon}
        {item.label}
      </a>
    );
  }

  return (
    <Button href={item.href} variant="ghost" size="lg" className={className}>
      {icon}
      {item.label}
    </Button>
  );
}

function HeroButton({
  item,
  className,
}: {
  item: AdmissionClosingActionItem;
  className?: string;
}) {
  const variant =
    item.variant === "primary"
      ? "primary"
      : item.variant === "secondary"
        ? "secondary"
        : item.variant === "outline"
          ? "outline"
          : "ghost";

  const icon = item.icon ? (
    <BlockIcon name={item.icon} size={iconSizes.sm} aria-hidden />
  ) : null;

  if (item.openInNewTab || item.href.startsWith("http")) {
    return (
      <a
        href={item.href}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-medium transition min-h-11",
          variant === "primary" && "bg-primary text-inverse",
          variant === "secondary" && "bg-secondary text-inverse",
          variant === "outline" &&
            "border border-[color-mix(in_srgb,var(--color-surface)_45%,transparent)] text-[var(--color-surface)] hover:bg-[color-mix(in_srgb,var(--color-surface)_8%,transparent)]",
          variant === "ghost" &&
            "text-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] hover:text-[var(--color-surface)]",
          className
        )}
      >
        {icon}
        {item.label}
      </a>
    );
  }

  return (
    <Button href={item.href} variant={variant} size="lg" className={className}>
      {icon}
      {item.label}
    </Button>
  );
}

export function ClosingActions({ items, layout = "default" }: ClosingActionsProps) {
  const visible = sortClosingBlocks(items).filter((item) => item.visible && item.label.trim());

  if (visible.length === 0) return null;

  if (layout === "hero") {
    const primary = visible.filter(
      (item) => item.variant === "primary" || item.variant === "outline" || item.variant === "secondary"
    );
    const secondary = visible.filter((item) => item.variant === "ghost");

    return (
      <div className="admission-closing__actions admission-closing__actions--hero">
        {primary.length > 0 ? (
          <div className="admission-closing__actions-primary">
            {primary.map((item) => (
              <HeroButton
                key={item.id}
                item={item}
                className="admission-closing__action-btn"
              />
            ))}
          </div>
        ) : null}
        {secondary.length > 0 ? (
          <div className="admission-closing__actions-secondary">
            {secondary.map((item) => (
              <ActionLink
                key={item.id}
                item={item}
                className="admission-closing__action-link"
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="admission-closing__actions">
      {visible.map((item) => (
        <HeroButton key={item.id} item={item} className="admission-closing__action-btn" />
      ))}
    </div>
  );
}
