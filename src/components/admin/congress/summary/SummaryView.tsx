"use client";

import { useMemo } from "react";
import { AlertBanner, LoadingState, Section } from "@/components/admin/kit";
import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import { deriveContributionStatus } from "@/core/congress/finance-status";
import { isLodgingPending } from "@/core/congress/lodging-status";
import type {
  CongressLodgingAssignment,
  CongressRegistration,
} from "@/core/congress/types";
import {
  formatClp,
  lodgingLabel,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";
import { cn } from "@/lib/utils";

type DayBucket = { expected: number; present: number; pendingArrival: number };
type AttendanceBucket = { present: number; absent: number; unmarked: number };

type Props = {
  loading: boolean;
  error: string | null;
  registrationsTotal: number;
  registrationsBySource: Record<string, number>;
  receptionSaturday: DayBucket;
  receptionSunday: DayBucket;
  attendanceSaturday: AttendanceBucket;
  attendanceSunday: AttendanceBucket;
  balances: {
    totalChargeClp: number;
    totalPaidClp: number;
    totalOutstandingClp: number;
    needsReviewCount: number;
  };
  registrations: CongressRegistration[];
  assignments: CongressLodgingAssignment[];
  homesCount: number;
  churchRequestedBeds: number;
};

function StatRow({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string | number;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
      <div>
        <p className={cn("text-sm", emphasize ? "font-semibold text-foreground" : "text-foreground")}>
          {label}
        </p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <p className={cn("tabular-nums text-sm", emphasize ? "font-semibold" : "text-muted")}>
        {value}
      </p>
    </div>
  );
}

export function SummaryView({
  loading,
  error,
  registrationsTotal,
  registrationsBySource,
  receptionSaturday,
  receptionSunday,
  attendanceSaturday,
  attendanceSunday,
  balances,
  registrations,
  assignments,
  homesCount,
  churchRequestedBeds,
}: Props) {
  const finance = useMemo(() => {
    const counts = {
      no_charge: 0,
      needs_verification: 0,
      pending: 0,
      partial: 0,
      paid: 0,
    };
    for (const reg of registrations) {
      counts[deriveContributionStatus(reg)] += 1;
    }
    return counts;
  }, [registrations]);

  const lodging = useMemo(() => {
    const counts = {
      unknown: 0,
      none: 0,
      unassigned: 0,
      assigned: 0,
      confirmed: 0,
      pending: 0,
    };
    for (const reg of registrations) {
      const state = resolveRegistrationLodging(reg, assignments);
      counts[state.status] += 1;
      if (isLodgingPending(state)) counts.pending += 1;
    }
    return counts;
  }, [assignments, registrations]);

  if (loading) return <LoadingState variant="cards" />;
  if (error) return <AlertBanner variant="warning">{error}</AlertBanner>;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Panorama del evento
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Inscritos</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {registrationsTotal}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Recaudado</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatClp(balances.totalPaidClp)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Saldo pendiente</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatClp(balances.totalOutstandingClp)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Por verificar</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {balances.needsReviewCount}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Aporte {formatClp(CONGRESS_CONTRIBUTION_CLP)} por persona · cubre ambos días · no
          depende del día de llegada.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Recepción por jornada" description="Previstos vs llegada real (todo el evento).">
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Día</th>
                  <th className="px-3 py-2 font-semibold">Previstas</th>
                  <th className="px-3 py-2 font-semibold">Presentes</th>
                  <th className="px-3 py-2 font-semibold">Pendientes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-medium">Sábado 21</td>
                  <td className="px-3 py-2 tabular-nums">{receptionSaturday.expected}</td>
                  <td className="px-3 py-2 tabular-nums">{receptionSaturday.present}</td>
                  <td className="px-3 py-2 tabular-nums">{receptionSaturday.pendingArrival}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-medium">Domingo 22</td>
                  <td className="px-3 py-2 tabular-nums">{receptionSunday.expected}</td>
                  <td className="px-3 py-2 tabular-nums">{receptionSunday.present}</td>
                  <td className="px-3 py-2 tabular-nums">{receptionSunday.pendingArrival}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs text-muted">
            <p>
              Sábado marcado: {attendanceSaturday.present} presentes ·{" "}
              {attendanceSaturday.absent} ausentes · {attendanceSaturday.unmarked} sin marcar
            </p>
            <p>
              Domingo marcado: {attendanceSunday.present} presentes ·{" "}
              {attendanceSunday.absent} ausentes · {attendanceSunday.unmarked} sin marcar
            </p>
          </div>
        </Section>

        <Section
          title="Alimentación y aportes"
          description="Estados derivados del motor de cargos (un aporte por persona)."
        >
          <div className="rounded-md border border-border bg-white px-3">
            <StatRow label="Pendiente" value={finance.pending} />
            <StatRow label="Abono parcial" value={finance.partial} />
            <StatRow label="Pendiente de verificación" value={finance.needs_verification} />
            <StatRow label="Pagado" value={finance.paid} emphasize />
            <StatRow label="Sin cargo" value={finance.no_charge} />
            <StatRow
              label="Cargo total esperado"
              value={formatClp(balances.totalChargeClp)}
              hint={`Referencia ${formatClp(CONGRESS_CONTRIBUTION_CLP)} × personas con cargo`}
            />
          </div>
        </Section>

        <Section
          title="Alojamiento"
          description="Estados por persona; pendientes incluyen desconocido, sin asignar y sin confirmar."
        >
          <div className="rounded-md border border-border bg-white px-3">
            <StatRow label={lodgingLabel({ status: "unknown" })} value={lodging.unknown} />
            <StatRow label={lodgingLabel({ status: "none" })} value={lodging.none} />
            <StatRow label={lodgingLabel({ status: "unassigned" })} value={lodging.unassigned} />
            <StatRow label={lodgingLabel({ status: "assigned" })} value={lodging.assigned} />
            <StatRow label={lodgingLabel({ status: "confirmed" })} value={lodging.confirmed} />
            <StatRow label="Alojamiento pendiente (filtro)" value={lodging.pending} emphasize />
            <StatRow
              label="Hogares / demanda iglesia"
              value={`${homesCount} / ${churchRequestedBeds}`}
              hint="La demanda de iglesia no es cama asignada"
            />
          </div>
        </Section>

        <Section title="Origen de inscripciones">
          <div className="rounded-md border border-border bg-white px-3">
            <StatRow label="Formulario" value={registrationsBySource.form ?? 0} />
            <StatRow label="Importación" value={registrationsBySource.import ?? 0} />
            <StatRow label="Puerta" value={registrationsBySource.door ?? 0} />
          </div>
        </Section>
      </div>
    </div>
  );
}
