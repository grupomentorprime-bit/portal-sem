"use client";

import { useEffect } from "react";
import { Download } from "lucide-react";
import { launchAttendanceConfetti } from "@/lib/experience/forms/celebration";
import { AttendanceNoFeedback } from "./AttendanceNoFeedback";
import { PortalFormSuccess } from "./PortalFormSuccess";

interface ConvocatoriaResponseSuccessProps {
  attendance: "yes" | "no";
  message: string;
  notice?: string | null;
  programDownloadUrl?: string;
  programDownloadLabel?: string;
}

export function ConvocatoriaResponseSuccess({
  attendance,
  message,
  notice,
  programDownloadUrl,
  programDownloadLabel,
}: ConvocatoriaResponseSuccessProps) {
  useEffect(() => {
    if (attendance === "yes") {
      launchAttendanceConfetti();
    }
  }, [attendance]);

  return (
    <>
      {attendance === "no" ? (
        <div className="convocatoria-response-success convocatoria-response-success--no">
          <p className="portal-experience-form__success-title">¡Respuesta enviada!</p>
          <AttendanceNoFeedback message={message} />
        </div>
      ) : (
        <PortalFormSuccess message={message} variant="inline">
          {programDownloadUrl ? (
            <div className="convocatoria-program-download">
              <a
                className="convocatoria-program-download__button"
                href={programDownloadUrl}
                download
              >
                <Download aria-hidden="true" />
                {programDownloadLabel?.trim() || "Descargar el programa"}
              </a>
              <p className="convocatoria-program-download__note">
                También te lo enviamos adjunto en el correo de confirmación.
              </p>
            </div>
          ) : null}
        </PortalFormSuccess>
      )}
      {notice ? (
        <p className="mt-3 rounded-lg border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--state-warning-fg)]">
          {notice}
        </p>
      ) : null}
    </>
  );
}
