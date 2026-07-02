"use client";

import { useEffect, useMemo, useState } from "react";
import {
  chileCalendarDaysUntil,
  formatChileEventDateTime,
  normalizeChileEventTime,
  resolveChileEventStartMs,
} from "@/lib/experience/forms/convocatoria-event-datetime";

interface CountdownParts {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getCountdownParts(targetMs: number): CountdownParts {
  const total = targetMs - Date.now();

  if (!Number.isFinite(targetMs) || total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    total,
    days: chileCalendarDaysUntil(targetMs),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

interface FormLandingCountdownProps {
  targetDate: string;
  targetTime?: string;
  label?: string;
}

export function FormLandingCountdown({ targetDate, targetTime, label }: FormLandingCountdownProps) {
  const normalizedTime = normalizeChileEventTime(targetTime);
  const targetMs = useMemo(
    () => resolveChileEventStartMs(targetDate, undefined, normalizedTime),
    [targetDate, normalizedTime]
  );
  const [parts, setParts] = useState(() => getCountdownParts(targetMs));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(targetMs));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [targetMs]);

  const eventLabel = formatChileEventDateTime(targetMs);

  if (parts.total <= 0) {
    return (
      <div className="form-landing__countdown form-landing__countdown--today" role="timer" aria-live="polite">
        <p className="form-landing__countdown-today">¡Hoy es la jornada!</p>
      </div>
    );
  }

  const units: Array<{ value: number; label: string; padValue: boolean }> = [];

  if (parts.days > 0) {
    units.push({
      value: parts.days,
      label: parts.days === 1 ? "Día" : "Días",
      padValue: false,
    });
  }

  units.push(
    { value: parts.hours, label: parts.hours === 1 ? "Hora" : "Horas", padValue: true },
    { value: parts.minutes, label: "Min", padValue: true },
    { value: parts.seconds, label: "Seg", padValue: true }
  );

  const ariaLabel = [
    label ?? "Faltan",
    parts.days > 0 ? `${parts.days} ${parts.days === 1 ? "día" : "días"}` : null,
    `${parts.hours} ${parts.hours === 1 ? "hora" : "horas"}`,
    `${parts.minutes} minutos`,
    `${parts.seconds} segundos`,
    `para la jornada del ${eventLabel}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`form-landing__countdown ${
        parts.days > 0 ? "form-landing__countdown--full" : "form-landing__countdown--time"
      }`}
      role="timer"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {label ? <p className="form-landing__countdown-eyebrow">{label}</p> : null}
      <div className="form-landing__countdown-grid">
        {units.map((unit) => (
          <div key={unit.label} className="form-landing__countdown-unit">
            <span className="form-landing__countdown-value" aria-hidden="true">
              {unit.padValue ? pad(unit.value) : String(unit.value)}
            </span>
            <span className="form-landing__countdown-unit-label">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
