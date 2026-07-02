import { cn } from "@/lib/utils";
import type { ProgramEconomics } from "./program-utils";

interface ProgramPriceProps {
  economics: ProgramEconomics | null;
  variant?: "featured" | "compact";
  className?: string;
}

export function ProgramPrice({
  economics,
  variant = "featured",
  className,
}: ProgramPriceProps) {
  if (!economics) return null;

  if (variant === "featured") {
    return (
      <div
        className={cn("program-price program-price--featured", className)}
        aria-label="Información económica"
      >
        <div className="program-price__enrollment">
          <span className="program-price__label">Matrícula</span>
          <strong className="program-price__amount program-price__amount--small">
            {economics.enrollmentFee}
          </strong>
        </div>
        <div className="program-price__tuition">
          <span className="program-price__label">Mensualidad</span>
          <strong className="program-price__amount program-price__amount--hero">
            {economics.monthlyFee}
          </strong>
          {economics.paymentNote ? (
            <p className="program-price__note">{economics.paymentNote}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("program-price program-price--compact", className)}
      aria-label="Información económica"
    >
      <div className="program-price__row">
        <span className="program-price__label">Mensualidad</span>
        <strong className="program-price__amount program-price__amount--primary">
          {economics.monthlyFee}
        </strong>
      </div>
    </div>
  );
}
