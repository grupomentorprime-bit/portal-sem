import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgramCTAProps {
  label: string;
  showCircle?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ProgramCTA({
  label,
  showCircle = true,
  disabled = false,
  className,
}: ProgramCTAProps) {
  return (
    <div
      className={cn(
        "program-cta",
        disabled && "program-cta--disabled",
        className
      )}
      aria-hidden
    >
      <span className="program-cta__primary">
        {label}
        <ArrowRight className="program-cta__arrow" strokeWidth={2} aria-hidden />
      </span>
      {showCircle ? (
        <span className="program-cta__circle">
          <ArrowRight strokeWidth={2} aria-hidden />
        </span>
      ) : null}
    </div>
  );
}
