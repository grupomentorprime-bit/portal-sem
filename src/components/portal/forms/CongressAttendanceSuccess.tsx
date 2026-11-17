"use client";

import { CalendarPlus, Download, MapPinned } from "lucide-react";
import { CongressVenueSection } from "@/components/portal/forms/CongressVenueSection";
import {
  congressVaronesGoogleCalendarUrl,
  congressVaronesIcsHref,
} from "@/lib/experience/forms/congress-varones-calendar";

interface CongressAttendanceSuccessProps {
  programDownloadUrl?: string;
  programDownloadLabel?: string;
}

/** Cierre tras confirmar: programa, cómo llegar y alta en el calendario del teléfono. */
export function CongressAttendanceSuccess({
  programDownloadUrl,
  programDownloadLabel,
}: CongressAttendanceSuccessProps) {
  const programUrl = programDownloadUrl?.trim();
  const programLabel = programDownloadLabel?.trim() || "Descargar el programa";

  return (
    <div className="congress-attendance-success">
      <section className="congress-attendance-success__block" aria-labelledby="congress-program-title">
        <h3 id="congress-program-title" className="congress-attendance-success__heading">
          Programa
        </h3>
        {programUrl ? (
          <a className="congress-attendance-success__button" href={programUrl} download>
            <Download aria-hidden="true" />
            {programLabel}
          </a>
        ) : (
          <p className="congress-attendance-success__note">
            El programa se publicará aquí pronto. Cuando esté listo podrás descargarlo desde esta
            misma pantalla.
          </p>
        )}
      </section>

      <section className="congress-attendance-success__block" aria-labelledby="congress-map-title">
        <div className="congress-attendance-success__map-head">
          <MapPinned aria-hidden="true" className="congress-attendance-success__icon" />
          <h3 id="congress-map-title" className="congress-attendance-success__heading">
            Cómo llegar
          </h3>
        </div>
        <CongressVenueSection />
      </section>

      <section className="congress-attendance-success__block" aria-labelledby="congress-calendar-title">
        <h3 id="congress-calendar-title" className="congress-attendance-success__heading">
          Agregar a tu calendario
        </h3>
        <p className="congress-attendance-success__note">
          21 y 22 de noviembre de 2026 · inicio 21 de noviembre a las 08:30 (Chile).
        </p>
        <div className="congress-attendance-success__calendar-actions">
          <a
            className="congress-attendance-success__button"
            href={congressVaronesIcsHref()}
            download="congreso-varones-2026.ics"
          >
            <CalendarPlus aria-hidden="true" />
            Descargar para el teléfono
          </a>
          <a
            className="congress-attendance-success__button congress-attendance-success__button--secondary"
            href={congressVaronesGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Google Calendar
          </a>
        </div>
      </section>
    </div>
  );
}
