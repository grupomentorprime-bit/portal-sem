import type { TenantType } from "@/core/tenant/types";
import { spaceTypeVisual } from "@/lib/platform/space-type-visual";
import { cn } from "@/lib/utils";

export function SpaceTypeFallbackMark({
  type,
  typeLabel,
  size = "md",
  className,
}: {
  type: TenantType | string;
  typeLabel?: string;
  size?: "row" | "sm" | "md" | "lg";
  className?: string;
}) {
  const visual = spaceTypeVisual(type);
  const Icon = visual.icon;

  if (size === "row") {
    return (
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
          visual.badgeBg,
          visual.iconFg,
          className
        )}
        role="img"
        aria-label={typeLabel?.trim() || "Organización"}
      >
        <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
      </span>
    );
  }

  const dims =
    size === "sm"
      ? {
          box: "h-14 w-14 rounded-[14px]",
          badge: "h-9 w-9 rounded-[10px]",
          icon: "h-4 w-4",
        }
      : size === "lg"
        ? {
            box: "h-[88px] w-[100px] rounded-[14px]",
            badge: "h-12 w-12 rounded-[12px]",
            icon: "h-6 w-6",
          }
        : {
            box: "h-16 w-16 rounded-[14px]",
            badge: "h-10 w-10 rounded-[11px]",
            icon: "h-5 w-5",
          };

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br",
        visual.panelBg,
        dims.box,
        className
      )}
      role="img"
      aria-label={typeLabel?.trim() || "Organización"}
    >
      <span
        className={cn(
          "absolute -right-4 -top-5 h-16 w-16 rounded-full",
          visual.accent
        )}
        aria-hidden
      />
      <span
        className={cn(
          "absolute -bottom-5 left-2 h-14 w-14 rounded-[14px]",
          visual.accent
        )}
        aria-hidden
      />
      <span
        className={cn(
          "relative flex items-center justify-center shadow-[0_6px_14px_-10px_rgba(14,79,144,0.45)]",
          visual.badgeBg,
          visual.iconFg,
          dims.badge
        )}
      >
        <Icon className={dims.icon} strokeWidth={2.1} aria-hidden />
      </span>
    </span>
  );
}
