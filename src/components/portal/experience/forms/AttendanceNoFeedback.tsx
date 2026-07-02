"use client";

import { AttendanceTeacherIcon } from "./AttendanceTeacherIcon";

const DEFAULT_MESSAGE =
  "¡Qué lástima! Te extrañaremos en la jornada. Gracias por avisarnos.";

interface AttendanceNoFeedbackProps {
  message?: string;
}

export function AttendanceNoFeedback({ message = DEFAULT_MESSAGE }: AttendanceNoFeedbackProps) {
  return (
    <div className="attendance-no-feedback" role="status" aria-live="polite">
      <div
        className="attendance-no-feedback__icon-wrap"
        aria-hidden="true"
        title="Profesor triste"
      >
        <AttendanceTeacherIcon mood="sad" className="attendance-no-feedback__teacher" />
      </div>
      <p className="attendance-no-feedback__text">{message}</p>
    </div>
  );
}
