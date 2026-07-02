import { PortalContainer } from "@/components/portal/layout";
import { cn } from "@/lib/utils";
import type { CmsSectionLayout } from "@/types/cms-shared";
import type { ReactNode } from "react";

const paddingTopMap = {
  none: "pt-0",
  sm: "pt-12 sm:pt-16",
  md: "pt-16 sm:pt-20",
  lg: "pt-20 sm:pt-28",
} as const;

const paddingBottomMap = {
  none: "pb-0",
  sm: "pb-12 sm:pb-16",
  md: "pb-16 sm:pb-20",
  lg: "pb-20 sm:pb-28",
} as const;

const animationMap = {
  none: "",
  fade: "cms-animate-fade",
  slide: "cms-animate-slide",
  zoom: "cms-animate-zoom",
} as const;

const maxWidthMap = {
  sm: "sm",
  md: "md",
  lg: "lg",
  full: "full",
} as const;

const alignmentMap = {
  left: "text-left",
  center: "text-center mx-auto",
  right: "text-right ml-auto",
} as const;

interface CmsSectionShellProps {
  id?: string;
  layout?: CmsSectionLayout;
  children: ReactNode;
  className?: string;
}

function resolveBackgroundStyle(background?: CmsSectionLayout["background"]): React.CSSProperties {
  if (!background) return {};
  switch (background.type) {
    case "color":
      return background.color ? { backgroundColor: background.color } : {};
    case "gradient":
      return background.gradient ? { background: background.gradient } : {};
    default:
      return {};
  }
}

export function CmsSectionShell({ id, layout, children, className }: CmsSectionShellProps) {
  const paddingTop = layout?.paddingTop ?? "md";
  const paddingBottom = layout?.paddingBottom ?? "md";
  const animation = layout?.animation ?? "none";
  const maxWidth = layout?.maxWidth ?? "lg";
  const alignment = layout?.alignment ?? "left";

  return (
    <section
      id={id}
      className={cn(
        paddingTopMap[paddingTop],
        paddingBottomMap[paddingBottom],
        layout?.muted && "bg-background-soft",
        animationMap[animation],
        className
      )}
      style={resolveBackgroundStyle(layout?.background)}
    >
      {layout?.background?.overlay ? (
        <div
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: (layout.background.overlay ?? 0) / 100 }}
          aria-hidden
        />
      ) : null}
      <PortalContainer size={maxWidthMap[maxWidth] ?? "lg"}>
        <div className={cn("relative", alignmentMap[alignment])}>{children}</div>
      </PortalContainer>
    </section>
  );
}

interface CmsSectionHeaderProps {
  layout?: CmsSectionLayout;
}

export function CmsSectionHeader({ layout }: CmsSectionHeaderProps) {
  if (!layout?.title && !layout?.badge && !layout?.description) return null;

  return (
    <div className="mb-12 max-w-2xl">
      {layout.badge ? (
        <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
          {layout.badge}
        </p>
      ) : null}
      {layout.title ? (
        <h2 className="mt-2 text-display-l font-semibold text-foreground">{layout.title}</h2>
      ) : null}
      {layout.subtitle ? (
        <p className="mt-2 text-heading text-muted">{layout.subtitle}</p>
      ) : null}
      {layout.description ? (
        <p className="mt-3 text-body text-muted">{layout.description}</p>
      ) : null}
    </div>
  );
}
