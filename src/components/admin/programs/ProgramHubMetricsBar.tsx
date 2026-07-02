import type { ProgramHubMetrics } from "@/lib/admin/programs-hub-utils";

interface ProgramHubMetricsBarProps {
  metrics: ProgramHubMetrics;
}

export function ProgramHubMetricsBar({ metrics }: ProgramHubMetricsBarProps) {
  const items = [
    { value: metrics.total, label: "Programas" },
    { value: metrics.published, label: "Publicados" },
    { value: metrics.draft, label: "Borrador" },
    { value: metrics.admissionOpen, label: "Admisión abierta" },
  ];

  return (
    <div className="program-hub-metrics" role="list">
      {items.map((item) => (
        <div key={item.label} className="program-hub-metrics__item" role="listitem">
          <span className="program-hub-metrics__value">{item.value}</span>
          <span className="program-hub-metrics__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
