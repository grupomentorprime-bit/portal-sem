"use client";

import { useState } from "react";
import { Section } from "@/components/admin/kit";
import { formatZoneLabel } from "@/components/admin/congress/labels";
import { LodgingPrintReport } from "@/components/admin/congress/reports/LodgingPrintReport";
import { Button } from "@/components/ui/button";
import { buildLodgingHomesReport } from "@/core/congress/lodging-homes-report";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "@/core/congress/types";

type ReportsViewProps = {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
};

export function ReportsView({ homes, assignments, registrations }: ReportsViewProps) {
  const [mode, setMode] = useState<"exports" | "lodging-print">("exports");

  const exportCsv = () => {
    const rows = [
      ["Nombre", "Zona", "Iglesia", "RUT", "Teléfono", "Sábado", "Domingo", "Cargo", "Pagado"].join(
        ","
      ),
      ...registrations.map((r) =>
        [
          r.identity.fullName,
          formatZoneLabel(r.zoneId),
          r.churchName,
          r.identity.rut ?? "",
          r.identity.phone ?? "",
          String(r.attendance.saturday),
          String(r.attendance.sunday),
          r.chargeAmountClp ?? "",
          r.allocatedPaidClp,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "congreso-varones-inscritos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (mode === "lodging-print") {
    const report = buildLodgingHomesReport({
      homes,
      assignments,
      registrations,
      generatedAtIso: new Date().toISOString(),
    });
    return (
      <LodgingPrintReport report={report} onBack={() => setMode("exports")} />
    );
  }

  return (
    <Section
      title="Exportar"
      description="CSV de inscritos y documento imprimible de alojamientos por hogar."
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={exportCsv}>
          Descargar CSV de inscritos
        </Button>
        <Button size="sm" onClick={() => setMode("lodging-print")}>
          Reporte de alojamientos
        </Button>
      </div>
    </Section>
  );
}
