export function formatClosureDateTime(iso: string): {
  dateLabel: string;
  timeLabel: string;
  fullLabel: string;
} {
  try {
    const value = new Date(iso);
    const dateLabel = value.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const timeLabel = value.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const fullLabel = `${dateLabel}, ${timeLabel} hrs`;
    return {
      dateLabel: dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1),
      timeLabel: `${timeLabel} hrs`,
      fullLabel: fullLabel.charAt(0).toUpperCase() + fullLabel.slice(1),
    };
  } catch {
    return { dateLabel: iso, timeLabel: "—", fullLabel: iso };
  }
}
