"use client";

import { ReportVendorCredit } from "@/components/admin/congress/reports/ReportVendorCredit";
import { formatDateTimeSantiago } from "@/components/admin/congress/labels";
import { Button } from "@/components/ui/button";
import type { LodgingCatalogReport } from "@/core/congress/lodging-reports";

const COPY: Record<
  LodgingCatalogReport["kind"],
  { code: string; title: string; lead: string }
> = {
  briefing: {
    code: "ALJ-04",
    title: "Informe consolidado de alojamiento",
    lead: "Documento único para informar el alojamiento: número de hogar, cupos, huéspedes y quién falta.",
  },
  homes: {
    code: "ALJ-01",
    title: "Hogares y huéspedes",
    lead: "Cada hogar con el contacto de la familia y los hermanos alojados. El número es el del informe consolidado.",
  },
  capacity: {
    code: "ALJ-02",
    title: "Cupos por hogar",
    lead: "Camas ofrecidas, ocupadas y libres del viernes 20 y del sábado 21, con el mismo número de hogar.",
  },
  pending: {
    code: "ALJ-03",
    title: "Falta asignar",
    lead: "Hermanos con alojamiento por resolver: sin cama, necesidad por confirmar o asignación sin confirmar.",
  },
};

type Props = {
  report: LodgingCatalogReport;
  onBack: () => void;
  onRefresh: () => void;
};

export function LodgingPrintReport({ report, onBack, onRefresh }: Props) {
  const meta = COPY[report.kind];
  const generated = formatDateTimeSantiago(report.generatedAtIso);
  const canPrint = report.kind === "pending" || report.homes.length > 0;

  return (
    <article className="congress-print-report bg-white text-gray-900 shadow-sm ring-1 ring-gray-200">
      <style>{`
        .congress-print-report { color: var(--gray-900); background: #fff; }
        .congress-print-report table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .congress-print-report th,
        .congress-print-report td { border: 1px solid var(--gray-200); padding: 5px 7px; vertical-align: top; text-align: left; }
        .congress-print-report th { background: var(--gray-50); font-weight: 650; }
        .congress-print-report .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .congress-print-report h2, .congress-print-report h3 { break-after: avoid; page-break-after: avoid; }
        .congress-print-report tr, .congress-print-report .lodging-home-head { break-inside: avoid; page-break-inside: avoid; }
        .congress-print-report thead { display: table-header-group; }
        @media print {
          body * { visibility: hidden; }
          .congress-print-report, .congress-print-report * { visibility: visible; }
          .congress-print-report {
            position: absolute; left: 0; top: 0; width: 100%;
            color: var(--gray-900); background: #fff; box-shadow: none;
          }
          .congress-print-no-print { display: none !important; }
          .congress-print-report { padding-bottom: 12mm; }
          @page { size: A4; margin: 12mm 12mm 16mm; }
        }
      `}</style>

      <div className="congress-print-no-print flex flex-wrap items-center gap-2 border-b border-gray-200 px-6 py-4">
        <Button type="button" size="sm" variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onRefresh}>
          Actualizar datos
        </Button>
        <Button type="button" size="sm" disabled={!canPrint} onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </Button>
      </div>

      <header className="border-b-2 border-primary px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          IPN Chile · Iglesia Pentecostal Nazareth
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">3.° Congreso de Varones 2026</h1>
        <p className="text-sm text-gray-600">Quilicura · 21 y 22 de noviembre</p>
        <div className="mt-2">
          <ReportVendorCredit />
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              {meta.code}
            </p>
            <h2 className="text-lg font-semibold">{meta.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">{meta.lead}</p>
          </div>
          <p className="text-xs text-gray-500">Emitido: {generated}</p>
        </div>
      </header>

      <div className="space-y-6 px-6 py-5">
        {report.kind === "briefing" ? <BriefingBody report={report} /> : null}
        {report.kind === "homes" ? <HomesBody report={report} /> : null}
        {report.kind === "capacity" ? <CapacityBody report={report} /> : null}
        {report.kind === "pending" ? <PendingBody report={report} /> : null}
      </div>

      <footer className="space-y-1 border-t border-gray-200 px-6 py-3 text-[11px] text-gray-500">
        <p>
          {meta.code} · {meta.title} · datos vigentes al momento de emisión · {generated}
        </p>
        <ReportVendorCredit repeatOnPrint />
      </footer>
    </article>
  );
}

function Kpis({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden border border-gray-200 bg-gray-200 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyNote({ children }: { children: string }) {
  return <p className="text-sm text-gray-600">{children}</p>;
}

function HomesBody({ report }: { report: Extract<LodgingCatalogReport, { kind: "homes" }> }) {
  const people = report.homes.reduce((sum, home) => sum + home.guestCount, 0);
  const friday = report.homes.reduce((sum, home) => sum + home.bedsFriday, 0);
  const saturday = report.homes.reduce((sum, home) => sum + home.bedsSaturday, 0);

  if (report.homes.length === 0) {
    return (
      <EmptyNote>
        Sin asignaciones de alojamiento para reportar. Asigne camas en hogares para generar el
        documento.
      </EmptyNote>
    );
  }

  return (
    <>
      <Kpis
        items={[
          { label: "Hogares", value: String(report.homes.length) },
          { label: "Personas", value: String(people) },
          { label: "Camas viernes", value: String(friday) },
          { label: "Camas sábado", value: String(saturday) },
        ]}
      />
      {report.homes.map((home) => (
        <section key={home.homeId} className="lodging-home">
          <div className="lodging-home-head mb-2">
            <h3 className="text-sm font-semibold">Hogar N° {home.homeNumber}</h3>
            <p className="text-sm text-gray-700">
              Nombre familia / jefe de hogar: {home.name}
              {home.hostName !== "Sin registrar" &&
              home.hostName.trim().toLowerCase() !== home.name.trim().toLowerCase()
                ? ` · ${home.hostName}`
                : ""}
            </p>
            <p className="text-sm text-gray-700">
              Tel. familia / jefe de hogar: {home.hostPhone}
            </p>
            {home.address ? <p className="text-sm text-gray-600">Dirección: {home.address}</p> : null}
            {home.notes ? (
              <p className="text-sm text-gray-600">Notas / cuidados: {home.notes}</p>
            ) : null}
            <p className="text-xs text-gray-500">
              {home.guestCount} {home.guestCount === 1 ? "persona" : "personas"} · vie{" "}
              {home.bedsFriday} / sáb {home.bedsSaturday}
            </p>
          </div>
          <table>
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Huésped</th>
                <th>Iglesia / zona</th>
                <th>Tel. huésped</th>
                <th>Noche(s)</th>
              </tr>
            </thead>
            <tbody>
              {home.guests.map((guest, index) => (
                <tr key={guest.registrationId}>
                  <td className="num">{index + 1}</td>
                  <td>{guest.fullName}</td>
                  <td>{guest.churchZoneLabel}</td>
                  <td>{guest.phone}</td>
                  <td>{guest.nightsLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}

function BriefingBody({
  report,
}: {
  report: Extract<LodgingCatalogReport, { kind: "briefing" }>;
}) {
  if (report.homes.length === 0) {
    return <EmptyNote>No hay hogares registrados para informar el alojamiento.</EmptyNote>;
  }

  const withGuests = report.homes.filter((home) => home.guestCount > 0);
  const emptyHomes = report.homes.filter((home) => home.guestCount === 0);

  return (
    <>
      <Kpis
        items={[
          { label: "Hogares", value: String(report.homeCount) },
          { label: "Personas", value: String(report.guestCount) },
          { label: "Vie libres", value: String(report.fridayFree) },
          { label: "Por resolver", value: String(report.pendingCount) },
        ]}
      />
      <p className="text-xs text-gray-600">
        El número de hogar sigue el orden alfabético del nombre de la familia y es el mismo en
        ALJ-01, ALJ-02 y este informe. Viernes: {report.fridayUsed} ocupadas de{" "}
        {report.fridayCapacity}. Sábado: {report.saturdayUsed} ocupadas de {report.saturdayCapacity}.
      </p>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Cuadro de hogares</h3>
        <table>
          <thead>
            <tr>
              <th className="num">N°</th>
              <th>Familia / jefe</th>
              <th>Teléfono</th>
              <th className="num">Vie</th>
              <th className="num">Sáb</th>
              <th className="num">Personas</th>
            </tr>
          </thead>
          <tbody>
            {report.homes.map((home) => (
              <tr key={home.homeId}>
                <td className="num">{home.homeNumber}</td>
                <td>
                  <div className="font-medium">{home.name}</div>
                  {home.address ? (
                    <div className="text-[11px] text-gray-500">{home.address}</div>
                  ) : null}
                  {home.notes ? (
                    <div className="text-[11px] text-gray-500">Notas: {home.notes}</div>
                  ) : null}
                </td>
                <td>{home.hostPhone}</td>
                <td className="num">
                  {home.fridayUsed}/{home.fridayCapacity}
                </td>
                <td className="num">
                  {home.saturdayUsed}/{home.saturdayCapacity}
                </td>
                <td className="num">{home.guestCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Huéspedes por hogar</h3>
        {withGuests.length === 0 ? (
          <EmptyNote>Ningún hogar tiene huéspedes asignados.</EmptyNote>
        ) : (
          withGuests.map((home) => (
            <div key={home.homeId} className="lodging-home">
              <div className="lodging-home-head mb-2">
                <h3 className="text-sm font-semibold">
                  Hogar N° {home.homeNumber} · {home.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Tel. {home.hostPhone}
                  {home.address ? ` · ${home.address}` : ""} · {home.guestCount}{" "}
                  {home.guestCount === 1 ? "persona" : "personas"} · vie {home.fridayUsed}/
                  {home.fridayCapacity} · sáb {home.saturdayUsed}/{home.saturdayCapacity}
                </p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th className="num">#</th>
                    <th>Huésped</th>
                    <th>Iglesia / zona</th>
                    <th>Tel. huésped</th>
                    <th>Noche(s)</th>
                  </tr>
                </thead>
                <tbody>
                  {home.guests.map((guest, index) => (
                    <tr key={guest.registrationId}>
                      <td className="num">{index + 1}</td>
                      <td>{guest.fullName}</td>
                      <td>{guest.churchZoneLabel}</td>
                      <td>{guest.phone}</td>
                      <td>{guest.nightsLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
        {emptyHomes.length > 0 ? (
          <p className="text-xs text-gray-600">
            Sin huéspedes:{" "}
            {emptyHomes.map((home) => `N° ${home.homeNumber} ${home.name}`).join(" · ")}
          </p>
        ) : null}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Falta resolver</h3>
        {report.pending.length === 0 ? (
          <EmptyNote>Nadie pendiente de cama.</EmptyNote>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Nombre</th>
                <th>Iglesia / zona</th>
                <th>Teléfono</th>
                <th>Situación</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {report.pending.map((person, index) => (
                <tr key={person.registrationId}>
                  <td className="num">{index + 1}</td>
                  <td>{person.fullName}</td>
                  <td>{person.churchZoneLabel}</td>
                  <td>{person.phone}</td>
                  <td>{person.statusLabel}</td>
                  <td>{person.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function CapacityBody({
  report,
}: {
  report: Extract<LodgingCatalogReport, { kind: "capacity" }>;
}) {
  if (report.homes.length === 0) {
    return <EmptyNote>No hay hogares registrados para reportar cupos.</EmptyNote>;
  }

  return (
    <>
      <Kpis
        items={[
          { label: "Hogares", value: String(report.homeCount) },
          { label: "Vie libres", value: String(report.fridayFree) },
          { label: "Sáb libres", value: String(report.saturdayFree) },
          {
            label: "Ocupadas vie / sáb",
            value: `${report.fridayUsed} / ${report.saturdayUsed}`,
          },
        ]}
      />
      <p className="text-xs text-gray-600">
        Viernes: {report.fridayUsed} ocupadas de {report.fridayCapacity}. Sábado:{" "}
        {report.saturdayUsed} ocupadas de {report.saturdayCapacity}. Un número negativo en libres
        indica más hermanos asignados que camas ofrecidas.
      </p>
      <table>
        <thead>
          <tr>
            <th className="num">N°</th>
            <th>Hogar</th>
            <th>Teléfono</th>
            <th className="num">Vie ocup.</th>
            <th className="num">Vie cupo</th>
            <th className="num">Vie libres</th>
            <th className="num">Sáb ocup.</th>
            <th className="num">Sáb cupo</th>
            <th className="num">Sáb libres</th>
          </tr>
        </thead>
        <tbody>
          {report.homes.map((home) => (
            <tr key={home.homeId}>
              <td className="num">{home.homeNumber}</td>
              <td>
                <div className="font-medium">{home.name}</div>
                <div className="text-[11px] text-gray-500">
                  {[home.hostName !== "Sin registrar" ? home.hostName : null, home.address]
                    .filter(Boolean)
                    .join(" · ") || "Sin contacto"}
                </div>
              </td>
              <td>{home.hostPhone}</td>
              <td className="num">{home.fridayUsed}</td>
              <td className="num">{home.fridayCapacity}</td>
              <td className="num">{home.fridayFree}</td>
              <td className="num">{home.saturdayUsed}</td>
              <td className="num">{home.saturdayCapacity}</td>
              <td className="num">{home.saturdayFree}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3}>
              <strong>Total</strong>
            </td>
            <td className="num">
              <strong>{report.fridayUsed}</strong>
            </td>
            <td className="num">
              <strong>{report.fridayCapacity}</strong>
            </td>
            <td className="num">
              <strong>{report.fridayFree}</strong>
            </td>
            <td className="num">
              <strong>{report.saturdayUsed}</strong>
            </td>
            <td className="num">
              <strong>{report.saturdayCapacity}</strong>
            </td>
            <td className="num">
              <strong>{report.saturdayFree}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function PendingBody({
  report,
}: {
  report: Extract<LodgingCatalogReport, { kind: "pending" }>;
}) {
  const unassigned = report.people.filter((person) => person.statusLabel === "Sin asignar").length;
  const unknown = report.people.filter((person) => person.statusLabel === "Por confirmar").length;
  const unconfirmed = report.people.filter((person) => person.statusLabel === "Asignado").length;

  return (
    <>
      <Kpis
        items={[
          { label: "Por resolver", value: String(report.people.length) },
          { label: "Sin hogar", value: String(unassigned) },
          { label: "Por confirmar", value: String(unknown) },
          { label: "Sin confirmar", value: String(unconfirmed) },
        ]}
      />
      {report.people.length === 0 ? (
        <EmptyNote>Nadie pendiente de cama. El alojamiento solicitado ya está confirmado.</EmptyNote>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Nombre</th>
              <th>Iglesia / zona</th>
              <th>Teléfono</th>
              <th>Situación</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {report.people.map((person, index) => (
              <tr key={person.registrationId}>
                <td className="num">{index + 1}</td>
                <td>{person.fullName}</td>
                <td>{person.churchZoneLabel}</td>
                <td>{person.phone}</td>
                <td>{person.statusLabel}</td>
                <td>{person.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
