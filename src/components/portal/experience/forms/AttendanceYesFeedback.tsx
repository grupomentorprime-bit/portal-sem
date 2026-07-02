"use client";

import { AttendanceTeacherIcon } from "./AttendanceTeacherIcon";

interface AttendanceYesFeedbackProps {
  message: string;
}

export function AttendanceYesFeedback({ message }: AttendanceYesFeedbackProps) {
  return (
    <div className="attendance-yes-feedback" role="status" aria-live="polite">
      <div
        className="attendance-yes-feedback__icon-wrap"
        aria-hidden="true"
        title="Profesor alegre"
      >
        <AttendanceTeacherIcon mood="happy" className="attendance-yes-feedback__teacher" />
      </div>
      <p className="attendance-yes-feedback__text">{message}</p>
    </div>
  );
}
