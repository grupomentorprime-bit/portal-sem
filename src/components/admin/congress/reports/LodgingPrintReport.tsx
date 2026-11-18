"use client";

import { EmptyState } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import type { LodgingHomesReport } from "@/core/congress/lodging-homes-report";

type Props = {
  report: LodgingHomesReport;
  onBack: () => void;
};

export function LodgingPrintReport({ report, onBack }: Props) {
  const generatedLabel = new Date(report.generatedAtIso).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
  });
  const canPrint = report.homes.length > 0;

  return (
    <div className="lodging-print-report space-y-6 text-foreground">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .lodging-print-report,
          .lodging-print-report * {
            visibility: visible;
          }
          .lodging-print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #000;
            background: #fff;
          }
          .lodging-print-no-print {
            display: none !important;
          }
          .lodging-print-home {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 1.5rem;
          }
        }
      `}</style>

      <div className="lodging-print-no-print flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canPrint}
          onClick={() => window.print()}
        >
          Imprimir / Guardar PDF
        </Button>
      </div>

      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Congreso de Varones 2026 · Alojamiento
        </h1>
        <p className="mt-1 text-sm text-muted">Quilicura · 21 y 22 de noviembre</p>
        <p className="mt-2 text-xs text-muted">Generado: {generatedLabel}</p>
      </header>

      {!canPrint ? (
        <EmptyState
          title="Sin asignaciones de alojamiento para reportar"
          description="Asigne camas en hogares para generar el documento."
        />
      ) : (
        <div className="space-y-8">
          {report.homes.map((home) => (
            <section key={home.homeId} className="lodging-print-home">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-foreground">
                  Hogar N° {home.homeNumber}
                </h2>
                <p className="mt-1 text-sm text-foreground">
                  Nombre familia / jefe de hogar: {home.name}
                  {home.hostName !== "Sin registrar" &&
                  home.hostName.trim().toLowerCase() !== home.name.trim().toLowerCase()
                    ? ` · ${home.hostName}`
                    : ""}
                </p>
                <p className="text-sm text-foreground">
                  Tel. familia / jefe de hogar: {home.hostPhone}
                </p>
                {home.address ? (
                  <p className="text-sm text-muted">Dirección: {home.address}</p>
                ) : null}
                {home.notes ? (
                  <p className="mt-1 text-sm text-muted">
                    Notas / cuidados: {home.notes}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  {home.guestCount}{" "}
                  {home.guestCount === 1 ? "persona" : "personas"} · vie{" "}
                  {home.bedsFriday} / sáb {home.bedsSaturday}
                </p>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-border bg-background-soft px-2 py-1.5 text-left font-semibold">
                      #
                    </th>
                    <th className="border border-border bg-background-soft px-2 py-1.5 text-left font-semibold">
                      Huésped
                    </th>
                    <th className="border border-border bg-background-soft px-2 py-1.5 text-left font-semibold">
                      Iglesia / zona
                    </th>
                    <th className="border border-border bg-background-soft px-2 py-1.5 text-left font-semibold">
                      Tel. huésped
                    </th>
                    <th className="border border-border bg-background-soft px-2 py-1.5 text-left font-semibold">
                      Noche(s)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {home.guests.map((guest, idx) => (
                    <tr key={guest.registrationId}>
                      <td className="border border-border px-2 py-1.5 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="border border-border px-2 py-1.5">{guest.fullName}</td>
                      <td className="border border-border px-2 py-1.5">
                        {guest.churchZoneLabel}
                      </td>
                      <td className="border border-border px-2 py-1.5">{guest.phone}</td>
                      <td className="border border-border px-2 py-1.5">
                        {guest.nightsLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
