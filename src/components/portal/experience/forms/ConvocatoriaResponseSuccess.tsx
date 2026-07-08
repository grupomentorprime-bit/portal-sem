"use client";

import { useEffect } from "react";
import { launchAttendanceConfetti } from "@/lib/experience/forms/celebration";
import { AttendanceNoFeedback } from "./AttendanceNoFeedback";
import { PortalFormSuccess } from "./PortalFormSuccess";

interface ConvocatoriaResponseSuccessProps {
  attendance: "yes" | "no";
  message: string;
  notice?: string | null;
}

export function ConvocatoriaResponseSuccess({
  attendance,
  message,
  notice,
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
        <PortalFormSuccess message={message} variant="inline" />
      )}
      {notice ? (
        <p className="mt-3 rounded-lg border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--state-warning-fg)]">
          {notice}
        </p>
      ) : null}
    </>
  );
}
