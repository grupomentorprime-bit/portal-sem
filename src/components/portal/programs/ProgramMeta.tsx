import type { ReactNode } from "react";
import { Calendar, Clock, GraduationCap, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resolveModalityDisplay,
  resolveStartDateDisplay,
} from "./program-utils";

const META_ICON_SIZE = 20;

interface ProgramMetaProps {
  modality?: string;
  duration?: string;
  certification?: string;
  startDate?: string;
  className?: string;
  variant?: "compact" | "academic-grid" | "magazine";
}

interface MetaField {
  key: string;
  label: string;
  value: string;
  icon?: typeof Monitor;
}

export function ProgramMeta({
  modality,
  duration,
  certification,
  startDate,
  className,
  variant = "academic-grid",
}: ProgramMetaProps) {
  const fields: MetaField[] = [];

  const modalityValue = resolveModalityDisplay(modality);
  if (modalityValue) {
    fields.push({
      key: "modality",
      label: "Modalidad",
      value: modalityValue,
      icon: Monitor,
    });
  }

  if (duration?.trim()) {
    fields.push({
      key: "duration",
      label: "Duración",
      value: duration.trim(),
      icon: Clock,
    });
  }

  if (variant !== "magazine" && certification?.trim()) {
    const audienceValue = certification.trim();
    fields.push({
      key: "certification",
      label: /pastor|hermano|l[ií]der/i.test(audienceValue)
        ? "Dirigido a"
        : "Certificación",
      value: audienceValue,
      icon: GraduationCap,
    });
  }

  const startValue = resolveStartDateDisplay(startDate);
  if (startValue) {
    fields.push({
      key: "start",
      label: "Inicio",
      value: startValue,
      icon: Calendar,
    });
  }

  if (fields.length === 0) return null;

  if (variant === "magazine") {
    const magazineFields = fields.slice(0, 3);
    return (
      <ul
        className={cn("program-meta program-meta--magazine", className)}
        aria-label="Información del programa"
      >
        {magazineFields.map(({ key, label, value }) => (
          <li key={key} className="program-meta__magazine-item">
            <span className="program-meta__magazine-label">{label}</span>
            <span className="program-meta__magazine-value">{value}</span>
          </li>
        ))}
      </ul>
    );
  }

  const items: ReactNode[] = fields.map(({ key, label, value, icon: Icon }, index) => (
    <li key={key} className="program-meta__field">
      {Icon ? (
        <Icon
          size={META_ICON_SIZE}
          strokeWidth={1.75}
          className={cn(
            "program-meta__icon",
            index % 2 === 0 ? "program-meta__icon--accent" : "program-meta__icon--success"
          )}
          aria-hidden
        />
      ) : null}
      <span className="program-meta__content">
        <span className="program-meta__label">{label}</span>
        <span className="program-meta__value">{value}</span>
      </span>
    </li>
  ));

  return (
    <ul
      className={cn(
        "program-meta",
        variant === "academic-grid" && "program-meta--academic-grid",
        variant === "compact" && "program-meta--compact",
        className
      )}
      aria-label="Información académica"
    >
      {items}
    </ul>
  );
}
