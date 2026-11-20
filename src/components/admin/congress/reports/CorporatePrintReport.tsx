"use client";

import { Button } from "@/components/ui/button";
import { paymentMethodLabel, formatClp, formatDateTimeSantiago } from "@/components/admin/congress/labels";
import { ReportVendorCredit } from "@/components/admin/congress/reports/ReportVendorCredit";
import type {
  ChurchBlock,
  OpsReport,
  ReportPerson,
  ZoneBlock,
} from "@/core/congress/ops-reports";

const COPY: Record<
  OpsReport["kind"],
  { code: string; title: string; lead: string }
> = {
  finance: {
    code: "FIN-01",
    title: "Cuadre financiero",
    lead: "Cargo de alimentación, cobrado y saldo, por zona y por iglesia.",
  },
  cash: {
    code: "FIN-02",
    title: "Caja",
    lead: "Movimientos vigentes por fecha y medio de pago. Los anulados quedan aparte.",
  },
  debtors: {
    code: "FIN-03",
    title: "Saldos pendientes",
    lead: "Hermanos con aporte pendiente, abono o verificación. Ordenados por saldo.",
  },
  roster: {
    code: "NOM-01",
    title: "Nómina por zona",
    lead: "Hermanos inscritos, agrupados por zona e iglesia.",
  },
  attendance: {
    code: "NOM-02",
    title: "Asistencia por zona",
    lead: "Presentes y sin llegada del sábado 21 y del domingo 22.",
  },
  directory: {
    code: "ORG-01",
    title: "Zonas e iglesias",
    lead: "Directorio de las once zonas, sus iglesias, líderes y cantidad de hermanos.",
  },
  "zone-leaders": {
    code: "ORG-02",
    title: "Jefes zonales",
    lead: "Jefe de cada zona y líderes de iglesia, con el número de hermanos.",
  },
  "church-leaders": {
    code: "ORG-03",
    title: "Líderes de iglesia y miembros",
    lead: "Cada iglesia con su líder y la lista de hermanos.",
  },
};

type Props = {
  report: OpsReport;
  onBack: () => void;
  onRefresh: () => void;
};

export function CorporatePrintReport({ report, onBack, onRefresh }: Props) {
  const meta = COPY[report.kind];
  const generated = formatDateTimeSantiago(report.generatedAtIso);
  const breakZones = report.kind === "roster" || report.kind === "church-leaders";

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
        .congress-print-report tr, .congress-print-report .ops-church { break-inside: avoid; page-break-inside: avoid; }
        .congress-print-report thead { display: table-header-group; }
        @media print {
          body * { visibility: hidden; }
          .congress-print-report, .congress-print-report * { visibility: visible; }
          .congress-print-report {
            position: absolute; left: 0; top: 0; width: 100%;
            color: var(--gray-900); background: #fff; box-shadow: none;
          }
          .congress-print-no-print { display: none !important; }
          .ops-zone-break { break-before: page; page-break-before: always; }
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
        <Button type="button" size="sm" onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </Button>
      </div>

      <header className="border-b-2 border-primary px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          IPN Chile · Iglesia Pentecostal Nazareth
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          3.° Congreso de Varones 2026
        </h1>
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
        {report.kind === "finance" ? <FinanceBody report={report} /> : null}
        {report.kind === "cash" ? <CashBody report={report} /> : null}
        {report.kind === "debtors" ? <DebtorsBody report={report} /> : null}
        {report.kind === "roster" ? (
          <ZonePeopleBody
            zones={report.zones}
            total={report.total}
            breakZones={breakZones}
            empty="Sin inscritos en esta zona."
            mode="roster"
          />
        ) : null}
        {report.kind === "attendance" ? <AttendanceBody report={report} /> : null}
        {report.kind === "directory" ? <DirectoryBody report={report} /> : null}
        {report.kind === "zone-leaders" ? <ZoneLeadersBody report={report} /> : null}
        {report.kind === "church-leaders" ? (
          <ChurchLeadersBody zones={report.zones} breakZones={breakZones} />
        ) : null}
      </div>

      <footer className="space-y-1 border-t border-gray-200 px-6 py-3 text-[11px] text-gray-500">
        <p>{meta.code} · {meta.title} · datos vigentes al momento de emisión · {generated}</p>
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

function FinanceBody({ report }: { report: Extract<OpsReport, { kind: "finance" }> }) {
  const { close, reconcile } = report;
  return (
    <>
      <Kpis
        items={[
          { label: "Esperado", value: formatClp(close.expectedClp) },
          { label: "Cobrado", value: formatClp(close.collectedClp) },
          { label: "Saldo", value: formatClp(close.remainingClp) },
          {
            label: "Cuadre de caja",
            value: reconcile.deltaClp === 0 ? "Cuadra" : formatClp(reconcile.deltaClp),
          },
        ]}
      />
      <p className="text-xs text-gray-600">
        Pagados {close.countsByStatus.paid} · Abonos {close.countsByStatus.partial} · Pendientes{" "}
        {close.countsByStatus.pending} · Por verificar {close.countsByStatus.needs_verification} ·
        Sin cargo {close.countsByStatus.no_charge}
        {reconcile.deltaClp === 0
          ? " · Lo imputado en movimientos vigentes coincide con lo cobrado en fichas."
          : ` · Imputado en caja ${formatClp(reconcile.movementsAllocatedClp)} frente a cobrado en fichas ${formatClp(reconcile.collectedClp)}.`}
      </p>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Por zona</h3>
        <MoneyTable
          rows={report.zones.map((z) => ({
            key: z.zoneId,
            cells: [z.zoneLabel, String(z.count), z.expectedClp, z.collectedClp, z.remainingClp],
          }))}
          headers={["Zona", "Hermanos", "Esperado", "Cobrado", "Saldo"]}
        />
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Por iglesia</h3>
        {report.churches.length === 0 ? (
          <Empty>No hay iglesias con inscritos.</Empty>
        ) : (
          <MoneyTable
            rows={report.churches.map((c) => ({
              key: `${c.zoneId}-${c.churchLabel}`,
              cells: [
                c.zoneLabel,
                c.churchLabel,
                String(c.count),
                c.expectedClp,
                c.collectedClp,
                c.remainingClp,
              ],
            }))}
            headers={["Zona", "Iglesia", "Hermanos", "Esperado", "Cobrado", "Saldo"]}
          />
        )}
      </section>
    </>
  );
}

function MoneyTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ key: string; cells: Array<string | number> }>;
}) {
  const numericFrom = headers.findIndex((h) =>
    ["Hermanos", "Esperado", "Cobrado", "Saldo", "Monto", "Movimientos"].includes(h)
  );
  return (
    <table>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className={numericFrom >= 0 && headers.indexOf(h) >= numericFrom ? "num" : ""}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell, i) => (
              <td key={`${row.key}-${i}`} className={i >= numericFrom && numericFrom >= 0 ? "num" : ""}>
                {typeof cell === "number" ? formatClp(cell) : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CashBody({ report }: { report: Extract<OpsReport, { kind: "cash" }> }) {
  const t = report.totalsClp;
  return (
    <>
      <Kpis
        items={[
          { label: "Total vigente", value: formatClp(t.total) },
          { label: "Efectivo", value: formatClp(t.cash) },
          { label: "Transferencia", value: formatClp(t.transfer) },
          { label: "Otro / sin medio", value: formatClp(t.other + t.unclassified) },
        ]}
      />
      <section>
        <h3 className="mb-2 text-sm font-semibold">Por día</h3>
        {report.byDay.length === 0 ? (
          <Empty>No hay movimientos vigentes.</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="num">Movimientos</th>
                <th className="num">Monto</th>
              </tr>
            </thead>
            <tbody>
              {report.byDay.map((day) => (
                <tr key={day.paidOn}>
                  <td>{formatDay(day.paidOn)}</td>
                  <td className="num">{day.count}</td>
                  <td className="num">{formatClp(day.totalClp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <MovementTable title="Movimientos vigentes" rows={report.posted} />
      <MovementTable title="Anulados" rows={report.voided} showReason />
    </>
  );
}

function MovementTable({
  title,
  rows,
  showReason = false,
}: {
  title: string;
  rows: Extract<OpsReport, { kind: "cash" }>["posted"];
  showReason?: boolean;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">
        {title} · {rows.length}
      </h3>
      {rows.length === 0 ? (
        <Empty>Sin movimientos en esta sección.</Empty>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Pagador</th>
              <th>Iglesia</th>
              <th>Medio</th>
              <th className="num">Monto</th>
              <th className="num">Sin imputar</th>
              {showReason ? <th>Motivo</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.folio}</td>
                <td>{formatDay(row.paidOn)}</td>
                <td>{row.payerName}</td>
                <td>{row.churchLabel}</td>
                <td>{paymentMethodLabel(row.method)}</td>
                <td className="num">{formatClp(row.amountClp)}</td>
                <td className="num">{formatClp(row.unallocatedClp)}</td>
                {showReason ? <td>{row.voidReason || "—"}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function DebtorsBody({ report }: { report: Extract<OpsReport, { kind: "debtors" }> }) {
  return (
    <>
      <Kpis
        items={[
          { label: "Hermanos", value: String(report.people) },
          { label: "Saldo", value: formatClp(report.balanceClp) },
        ]}
      />
      {report.zones.length === 0 ? (
        <Empty>No hay saldos pendientes.</Empty>
      ) : (
        report.zones.map((zone) => (
          <section key={zone.zoneId} className="ops-zone">
            <ZoneHeading
              zone={zone}
              extra={`Saldo ${formatClp(zone.remainingClp)}`}
              showChief={false}
            />
            {zone.churches.map((church) => (
              <div key={church.key} className="ops-church mt-3">
                <ChurchHeading church={church} />
                <PeopleTable people={church.people} mode="debtors" />
              </div>
            ))}
          </section>
        ))
      )}
    </>
  );
}

function AttendanceBody({ report }: { report: Extract<OpsReport, { kind: "attendance" }> }) {
  return (
    <>
      <Kpis
        items={[
          { label: "Inscritos", value: String(report.total) },
          {
            label: "Sábado",
            value: `${report.saturdayPresent} presentes`,
          },
          {
            label: "Domingo",
            value: `${report.sundayPresent} presentes`,
          },
          {
            label: "Sin llegada sábado",
            value: String(report.total - report.saturdayPresent),
          },
        ]}
      />
      <table>
        <thead>
          <tr>
            <th>Zona</th>
            <th>Iglesia</th>
            <th className="num">Inscritos</th>
            <th className="num">Sábado</th>
            <th className="num">Domingo</th>
          </tr>
        </thead>
        <tbody>
          {report.zones.flatMap((zone) =>
            zone.churches.length === 0
              ? [
                  <tr key={zone.zoneId}>
                    <td>{zone.zoneLabel}</td>
                    <td>Sin inscritos</td>
                    <td className="num">0</td>
                    <td className="num">0</td>
                    <td className="num">0</td>
                  </tr>,
                ]
              : zone.churches.map((church) => (
                  <tr key={church.key}>
                    <td>{zone.zoneLabel}</td>
                    <td>{church.label}</td>
                    <td className="num">{church.memberCount}</td>
                    <td className="num">
                      {church.saturdayPresent}/{church.memberCount}
                    </td>
                    <td className="num">
                      {church.sundayPresent}/{church.memberCount}
                    </td>
                  </tr>
                ))
          )}
        </tbody>
      </table>
    </>
  );
}

function DirectoryBody({ report }: { report: Extract<OpsReport, { kind: "directory" }> }) {
  return (
    <>
      <Kpis
        items={[
          { label: "Zonas", value: String(report.zones.length) },
          { label: "Iglesias", value: String(report.churchCount) },
          {
            label: "Hermanos",
            value: String(report.zones.reduce((sum, z) => sum + z.memberCount, 0)),
          },
        ]}
      />
      {report.zones.map((zone) => (
        <section key={zone.zoneId} className="ops-zone">
          <ZoneHeading zone={zone} />
          {zone.churches.length === 0 ? (
            <Empty>Sin iglesias en esta zona.</Empty>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Iglesia</th>
                  <th className="num">Hermanos</th>
                  <th>Líder</th>
                  <th>Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {zone.churches.map((church) => (
                  <tr key={church.key}>
                    <td>{church.label}</td>
                    <td className="num">{church.memberCount}</td>
                    <td>{leaderNames(church.leaders)}</td>
                    <td>{church.leaders[0]?.phone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </>
  );
}

function ZoneLeadersBody({ report }: { report: Extract<OpsReport, { kind: "zone-leaders" }> }) {
  return (
    <>
      {report.zones.map((zone) => {
        const chief = zone.zoneLeaders[0];
        return (
          <section key={zone.zoneId} className="ops-zone">
            <h2 className="text-base font-semibold">{zone.zoneLabel}</h2>
            <p className="mb-2 text-sm text-gray-700">
              Jefe zonal: {chief?.name ?? "Sin jefe zonal"}
              {chief ? ` · ${chief.phone} · ${chief.churchLabel}` : ""}
              {zone.zoneLeaders.length > 1
                ? ` · También figura: ${zone.zoneLeaders.slice(1).map((p) => p.name).join(", ")}`
                : ""}
            </p>
            {zone.churches.length === 0 ? (
              <Empty>Sin iglesias en esta zona.</Empty>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Iglesia</th>
                    <th>Líder</th>
                    <th>Teléfono</th>
                    <th className="num">Hermanos</th>
                  </tr>
                </thead>
                <tbody>
                  {zone.churches.map((church) => (
                    <tr key={church.key}>
                      <td>{church.label}</td>
                      <td>{leaderNames(church.leaders)}</td>
                      <td>{church.leaders.map((l) => l.phone).join(", ") || "—"}</td>
                      <td className="num">{church.memberCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </>
  );
}

function ChurchLeadersBody({ zones, breakZones }: { zones: ZoneBlock[]; breakZones: boolean }) {
  return (
    <>
      {zones.map((zone, index) => (
        <section
          key={zone.zoneId}
          className={breakZones && index > 0 ? "ops-zone ops-zone-break" : "ops-zone"}
        >
          <ZoneHeading zone={zone} />
          {zone.churches.length === 0 ? (
            <Empty>Sin iglesias en esta zona.</Empty>
          ) : (
            zone.churches.map((church) => (
              <div key={church.key} className="ops-church mt-4">
                <ChurchHeading church={church} />
                {church.people.length === 0 ? (
                  <Empty>Sin miembros inscritos.</Empty>
                ) : (
                  <PeopleTable people={church.people} mode="roster" />
                )}
              </div>
            ))
          )}
        </section>
      ))}
    </>
  );
}

function ZonePeopleBody({
  zones,
  total,
  breakZones,
  empty,
  mode,
}: {
  zones: ZoneBlock[];
  total: number;
  breakZones: boolean;
  empty: string;
  mode: "roster" | "debtors";
}) {
  return (
    <>
      <Kpis items={[{ label: "Hermanos", value: String(total) }]} />
      {zones.map((zone, index) => (
        <section
          key={zone.zoneId}
          className={breakZones && index > 0 ? "ops-zone ops-zone-break" : "ops-zone"}
        >
          <ZoneHeading zone={zone} />
          {zone.churches.length === 0 ? (
            <Empty>{empty}</Empty>
          ) : (
            zone.churches.map((church) => (
              <div key={church.key} className="ops-church mt-3">
                <ChurchHeading church={church} />
                <PeopleTable people={church.people} mode={mode} />
              </div>
            ))
          )}
        </section>
      ))}
    </>
  );
}

function ZoneHeading({
  zone,
  extra,
  showChief = true,
}: {
  zone: ZoneBlock;
  extra?: string;
  showChief?: boolean;
}) {
  const chief = zone.zoneLeaders[0]?.name ?? "Sin jefe zonal";
  return (
    <div className="mb-2">
      <h2 className="text-base font-semibold">
        {zone.zoneLabel}
        <span className="ml-2 text-sm font-normal text-gray-600">
          {zone.memberCount} {zone.memberCount === 1 ? "hermano" : "hermanos"}
          {extra ? ` · ${extra}` : ""}
        </span>
      </h2>
      {showChief ? <p className="text-sm text-gray-600">Jefe zonal: {chief}</p> : null}
    </div>
  );
}

function ChurchHeading({ church }: { church: ChurchBlock }) {
  return (
    <h3 className="mb-1 text-sm font-semibold">
      {church.label}
      <span className="ml-2 font-normal text-gray-600">
        Líder: {leaderNames(church.leaders)}
        {church.leaders[0] ? ` · ${church.leaders[0].phone}` : ""} · {church.memberCount}{" "}
        {church.memberCount === 1 ? "hermano" : "hermanos"}
      </span>
    </h3>
  );
}

function PeopleTable({
  people,
  mode,
}: {
  people: ReportPerson[];
  mode: "roster" | "debtors";
}) {
  return (
    <table>
      <thead>
        <tr>
          <th className="num">#</th>
          <th>Hermano</th>
          <th>Teléfono</th>
          {mode === "roster" ? (
            <>
              <th>Rol</th>
              <th>Sábado</th>
              <th>Domingo</th>
              <th>Aporte</th>
            </>
          ) : (
            <>
              <th>Estado</th>
              <th className="num">Cargo</th>
              <th className="num">Pagado</th>
              <th className="num">Saldo</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {people.map((person, index) => (
          <tr key={person.id}>
            <td className="num">{index + 1}</td>
            <td>{person.name}</td>
            <td>{person.phone}</td>
            {mode === "roster" ? (
              <>
                <td>{person.roleLabel || "—"}</td>
                <td>{person.saturdayPresent ? "Presente" : "Sin llegada"}</td>
                <td>{person.sundayPresent ? "Presente" : "Sin llegada"}</td>
                <td>{person.financeLabel}</td>
              </>
            ) : (
              <>
                <td>{person.financeLabel}</td>
                <td className="num">{person.chargeClp == null ? "—" : formatClp(person.chargeClp)}</td>
                <td className="num">{formatClp(person.paidClp)}</td>
                <td className="num">{formatClp(person.balanceClp)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function leaderNames(leaders: ReportPerson[]): string {
  if (leaders.length === 0) return "Sin líder registrado";
  return leaders.map((l) => l.name).join(", ");
}

function formatDay(value: string): string {
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
}

function Empty({ children }: { children: string }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}
