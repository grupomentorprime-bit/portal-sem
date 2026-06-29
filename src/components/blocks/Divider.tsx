import { cn } from "@/lib/utils";
import { asString } from "@/lib/cms/block-utils";

interface DividerProps {
  settings: Record<string, unknown>;
}

const spacingMap = {
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
} as const;

export function Divider({ settings }: DividerProps) {
  const variant = asString(settings.variant, "default");
  const spacing = asString(settings.spacing, "md") as keyof typeof spacingMap;

  return (
    <div className={cn(spacingMap[spacing] ?? spacingMap.md, "px-4")} aria-hidden>
      <hr
        className={cn(
          "border-border",
          variant === "accent" && "border-accent",
          variant === "strong" && "border-border-strong"
        )}
      />
    </div>
  );
}
