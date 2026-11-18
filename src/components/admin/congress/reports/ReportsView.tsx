"use client";

import { useState } from "react";
import { Section } from "@/components/admin/kit";
import { formatZoneLabel } from "@/components/admin/congress/labels";
import { CorporatePrintReport } from "@/components/admin/congress/reports/CorporatePrintReport";
import { LodgingPrintReport } from "@/components/admin/congress/reports/LodgingPrintReport";
import { Button } from "@/components/ui/button";
import {
  buildLodgingCatalogReport,
  type LodgingReportKind,
} from "@/core/congress/lodging-reports";
import { buildOpsReport, type OpsReportKind } from "@/core/congress/ops-reports";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressPayment,
  CongressRegistration,
} from "@/core/congress/types";

type ReportsViewProps = {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
  payments: CongressPayment[];
  churchesByZone: Record<string, string[]>;
  onRefresh: () => void;
};

type CatalogItem =
  | { family: "ops"; kind: OpsReportKind; code: string; label: string; hint: string }
  | { family: "lodging"; kind: LodgingReportKind; code: string; label: string; hint: string };

type ReportMode =
  | { view: "exports" }
  | { view: "ops"; kind: OpsReportKind }
  | { view: "lodging"; kind: LodgingReportKind };

const CATALOG: Array<{
  title: string;
  description: string;
  items: CatalogItem[];
}> = [
  {
    title: "Finanzas",
    description: "Cuadre, caja y quién aún debe. Se arman con las fichas y los movimientos vigentes.",
    items: [
      {
        family: "ops",
        kind: "finance",
        code: "FIN-01",
        label: "Cuadre financiero",
        hint: "Esperado, cobrado y saldo por zona e iglesia.",
      },
      {
        family: "ops",
        kind: "cash",
        code: "FIN-02",
        label: "Caja",
        hint: "Totales por medio, por día y listado de movimientos.",
      },
      {
        family: "ops",
        kind: "debtors",
        code: "FIN-03",
        label: "Saldos pendientes",
        hint: "Pendientes, abonos y por verificar, ordenados por saldo.",
      },
    ],
  },
  {
    title: "Nóminas",
    description: "Listados de hermanos para la jornada. Al volver a abrirlos quedan al día.",
    items: [
      {
        family: "ops",
        kind: "roster",
        code: "NOM-01",
        label: "Nómina por zona",
        hint: "Las once zonas, cada iglesia y sus hermanos.",
      },
      {
        family: "ops",
        kind: "attendance",
        code: "NOM-02",
        label: "Asistencia por zona",
        hint: "Presentes y sin llegada del sábado y del domingo.",
      },
    ],
  },
  {
    title: "Organización",
    description: "Zonas, iglesias y liderazgo, con los miembros de cada iglesia.",
    items: [
      {
        family: "ops",
        kind: "directory",
        code: "ORG-01",
        label: "Zonas e iglesias",
        hint: "Directorio de zonas, iglesias, líderes y cantidades.",
      },
      {
        family: "ops",
        kind: "zone-leaders",
        code: "ORG-02",
        label: "Jefes zonales",
        hint: "Jefe de cada zona y los líderes de sus iglesias.",
      },
      {
        family: "ops",
        kind: "church-leaders",
        code: "ORG-03",
        label: "Líderes y miembros",
        hint: "Cada líder de iglesia con la lista de sus hermanos.",
      },
    ],
  },
  {
    title: "Alojamiento",
    description:
      "Hogares, cupos y quién aún no tiene cama. Se arman con los hogares y las asignaciones vigentes.",
    items: [
      {
        family: "lodging",
        kind: "homes",
        code: "ALJ-01",
        label: "Hogares y huéspedes",
        hint: "Cada hogar con su familia y la lista de hermanos por noche.",
      },
      {
        family: "lodging",
        kind: "capacity",
        code: "ALJ-02",
        label: "Cupos por hogar",
        hint: "Capacidad, ocupadas y libres del viernes y del sábado.",
      },
      {
        family: "lodging",
        kind: "pending",
        code: "ALJ-03",
        label: "Falta asignar",
        hint: "Sin cama, por confirmar o asignados sin confirmar.",
      },
    ],
  },
];

export function ReportsView({
  homes,
  assignments,
  registrations,
  payments,
  churchesByZone,
  onRefresh,
}: ReportsViewProps) {
  const [mode, setMode] = useState<ReportMode>({ view: "exports" });
  const [generatedAtIso, setGeneratedAtIso] = useState(() => new Date().toISOString());

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

  const openReport = (item: CatalogItem) => {
    onRefresh();
    setGeneratedAtIso(new Date().toISOString());
    if (item.family === "lodging") {
      setMode({ view: "lodging", kind: item.kind });
      return;
    }
    setMode({ view: "ops", kind: item.kind });
  };

  const refreshOpenReport = () => {
    onRefresh();
    setGeneratedAtIso(new Date().toISOString());
  };

  if (mode.view === "lodging") {
    const report = buildLodgingCatalogReport(mode.kind, {
      homes,
      assignments,
      registrations,
      generatedAtIso,
    });
    return (
      <LodgingPrintReport
        report={report}
        onBack={() => setMode({ view: "exports" })}
        onRefresh={refreshOpenReport}
      />
    );
  }

  if (mode.view === "ops") {
    const report = buildOpsReport(mode.kind, {
      registrations,
      payments,
      churchesByZone,
      generatedAtIso,
    });
    return (
      <CorporatePrintReport
        report={report}
        onBack={() => setMode({ view: "exports" })}
        onRefresh={refreshOpenReport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {CATALOG.map((group) => (
        <Section key={group.title} title={group.title} description={group.description}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <div
                key={`${item.family}-${item.kind}`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {item.code}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted">{item.hint}</p>
                </div>
                <Button
                  size="sm"
                  className="mt-auto w-fit"
                  onClick={() => openReport(item)}
                >
                  Abrir PDF
                </Button>
              </div>
            ))}
          </div>
        </Section>
      ))}

      <Section
        title="Otros documentos"
        description="Listado plano de inscritos para abrir en una hoja de cálculo."
      >
        <Button size="sm" variant="outline" onClick={exportCsv}>
          Descargar CSV de inscritos
        </Button>
      </Section>
    </div>
  );
}
