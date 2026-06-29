import { cn } from "@/lib/utils";

type SpacerSize = 1 | 2 | 4 | 6 | 8 | 12 | 16 | 24 | 32;

interface SpacerProps {
  size?: SpacerSize;
  axis?: "vertical" | "horizontal";
  className?: string;
}

const sizeMap: Record<SpacerSize, string> = {
  1: "4",
  2: "8",
  4: "16",
  6: "24",
  8: "32",
  12: "48",
  16: "64",
  24: "96",
  32: "128",
};

export function Spacer({ size = 4, axis = "vertical", className }: SpacerProps) {
  const dimension = sizeMap[size];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0",
        axis === "vertical" ? `h-[${dimension}px]` : `w-[${dimension}px]`,
        className
      )}
      style={
        axis === "vertical"
          ? { height: `${dimension}px` }
          : { width: `${dimension}px` }
      }
    />
  );
}
