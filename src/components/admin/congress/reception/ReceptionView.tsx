"use client";

import { useMemo } from "react";
import { UserPlus } from "lucide-react";
import { AlertBanner, EmptyState, LoadingState, SearchBar } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import {
  contributionStatusHasBalance,
  deriveContributionStatus,
} from "@/core/congress/finance-status";
import { isLodgingPending } from "@/core/congress/lodging-status";
import type {
  CongressLodgingAssignment,
  CongressRegistration,
} from "@/core/congress/types";
import { matchesPersonSearch } from "@/lib/experience/forms/person-search";
import { cn } from "@/lib/utils";
import {
  attendanceCellText,
  contributionLabel,
  formatZoneLabel,
  journeyDayLabel,
  journeyDayShortLabel,
  lodgingLabel,
  lodgingPendingReasonLabel,
  registrationDisplayName,
  registrationRoleBadges,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";

export type ReceptionQuickFilter =
  | "all"
  | "no_arrival"
  | "with_balance"
  | "lodging_pending";

export type ReceptionDayKpis = {
  expected: number;
  present: number;
  pendingArrival: number;
};

type Props = {
  journeyDay: CongressAttendanceDay;
  onJourneyDayChange: (day: CongressAttendanceDay) => void;
  dayKpis: ReceptionDayKpis;
  registrations: CongressRegistration[];
  assignments: CongressLodgingAssignment[];
  zoneOptions: { id: string; label: string }[];
  churchOptions: string[];
  loading: boolean;
  error: string | null;
  operate: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  zoneFilter: string;
  onZoneFilterChange: (value: string) => void;
  churchFilter: string;
  onChurchFilterChange: (value: string) => void;
  quickFilter: ReceptionQuickFilter;
  onQuickFilterChange: (value: ReceptionQuickFilter) => void;
  onClearFilters: () => void;
  onOpenNew: () => void;
  onOpenParticipant: (id: string) => void;
  onRegisterArrival: (id: string, day: CongressAttendanceDay) => void;
  onRevertArrival: (id: string, day: CongressAttendanceDay) => void;
  arrivalSavingId: string | null;
};

export function ReceptionView({
  journeyDay,
  onJourneyDayChange,
  dayKpis,
  registrations,
  assignments,
  zoneOptions,
  churchOptions,
  loading,
  error,
  operate,
  search,
  onSearchChange,
  zoneFilter,
  onZoneFilterChange,
  churchFilter,
  onChurchFilterChange,
  quickFilter,
  onQuickFilterChange,
  onClearFilters,
  onOpenNew,
  onOpenParticipant,
  onRegisterArrival,
  onRevertArrival,
  arrivalSavingId,
}: Props) {
  const receptionZones = useMemo(() => {
    const byId = new Map(CONGRESS_ZONES.map((z) => [z.id, z]));
    for (const z of zoneOptions) {
      if (!byId.has(z.id)) {
        byId.set(z.id, { id: z.id, label: z.label || formatZoneLabel(z.id) });
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      const na = Number(a.id.replace(/\D/g, "")) || 0;
      const nb = Number(b.id.replace(/\D/g, "")) || 0;
      return na - nb;
    });
  }, [zoneOptions]);

  const churchesForZone = useMemo(() => {
    if (!zoneFilter) return churchOptions;
    const names = new Set(
      registrations
        .filter((r) => r.zoneId === zoneFilter)
        .map((r) => r.churchName)
        .filter(Boolean)
    );
    return churchOptions.filter((c) => names.has(c));
  }, [churchOptions, registrations, zoneFilter]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return registrations.filter((reg) => {
      if (zoneFilter && reg.zoneId !== zoneFilter) return false;
      if (churchFilter && reg.churchName !== churchFilter) return false;
      if (q) {
        if (
          !matchesPersonSearch(q, [
            reg.identity.fullName,
            reg.identity.rut,
            reg.identity.phone,
            reg.identity.email,
            reg.churchName,
          ])
        ) {
          return false;
        }
      }
      if (quickFilter === "no_arrival") {
        if (reg.attendance[journeyDay] === true) return false;
      }
      if (quickFilter === "with_balance") {
        if (!contributionStatusHasBalance(deriveContributionStatus(reg))) return false;
      }
      if (quickFilter === "lodging_pending") {
        const state = resolveRegistrationLodging(reg, assignments);
        if (!isLodgingPending(state)) return false;
      }
      return true;
    });
  }, [
    assignments,
    churchFilter,
    search,
    journeyDay,
    quickFilter,
    registrations,
    zoneFilter,
  ]);

  const quickFilters: { id: ReceptionQuickFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "no_arrival", label: "Sin llegada hoy" },
    { id: "with_balance", label: "Con saldo" },
    { id: "lodging_pending", label: "Alojamiento pendiente" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["saturday", "sunday"] as CongressAttendanceDay[]).map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onJourneyDayChange(day)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-semibold transition",
              journeyDay === day
                ? "border-primary bg-primary text-text-inverse"
                : "border-border bg-white text-foreground hover:bg-background-soft"
            )}
          >
            {journeyDayLabel(day)}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-3 text-sm text-muted">
          <span>
            Previstas <strong className="text-foreground">{dayKpis.expected}</strong>
          </span>
          <span>
            Presentes <strong className="text-foreground">{dayKpis.present}</strong>
          </span>
          <span>
            Pendientes{" "}
            <strong className="text-foreground">{dayKpis.pendingArrival}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <SearchBar
          className="w-full max-w-none flex-1"
          placeholder="Buscar por nombre, RUT o teléfono…"
          value={search}
          onChange={onSearchChange}
        />
        <Select
          className="min-w-[10rem]"
          label="Zona"
          value={zoneFilter}
          onChange={(e) => {
            onZoneFilterChange(e.target.value);
            onChurchFilterChange("");
          }}
          options={[
            { value: "", label: "Todas las zonas" },
          ...receptionZones.map((z) => ({
            value: z.id,
            label: z.label || formatZoneLabel(z.id),
          })),
          ]}
        />
        <Select
          className="min-w-[10rem]"
          label="Iglesia"
          value={churchFilter}
          onChange={(e) => onChurchFilterChange(e.target.value)}
          options={[
            { value: "", label: "Todas las iglesias" },
            ...churchesForZone.map((c) => ({ value: c, label: c })),
          ]}
        />
        {operate ? (
          <Button size="sm" onClick={onOpenNew}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo participante
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {quickFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onQuickFilterChange(f.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-semibold transition",
              quickFilter === f.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-white text-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      </div>

      {error ? <AlertBanner variant="warning">{error}</AlertBanner> : null}
      {loading ? <LoadingState variant="table" /> : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="Sin participantes"
          description="Ajuste los filtros o registre un nuevo participante."
        />
      ) : null}

      {!loading && filtered.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-white md:block">
            <table className="min-w-[64rem] w-full text-left text-sm">
              <thead className="border-b border-border bg-background-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Participante</th>
                  <th className="px-3 py-2 font-semibold">Iglesia / zona</th>
                  <th className="px-3 py-2 font-semibold">Sábado</th>
                  <th className="px-3 py-2 font-semibold">Domingo</th>
                  <th className="px-3 py-2 font-semibold" title="Aporte único $17.000 por ambos días">
                    Alimentación
                  </th>
                  <th className="px-3 py-2 font-semibold">Alojamiento</th>
                  <th className="px-3 py-2 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => {
                  const sat = attendanceCellText(reg, "saturday");
                  const sun = attendanceCellText(reg, "sunday");
                  const lodging = resolveRegistrationLodging(reg, assignments);
                  const arrived = reg.attendance[journeyDay] === true;
                  const arrival = attendanceCellText(reg, journeyDay);
                  return (
                    <tr
                      key={reg._id}
                      className="cursor-pointer border-b border-border/70 hover:bg-background-soft/80"
                      onClick={() => onOpenParticipant(reg._id)}
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-foreground">
                          {registrationDisplayName(reg)}
                        </p>
                        <p className="text-xs text-muted">
                          {[reg.identity.phone || "—", ...registrationRoleBadges(reg)].join(
                            " · "
                          )}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p>{reg.churchName}</p>
                        <p className="text-xs text-muted">{formatZoneLabel(reg.zoneId)}</p>
                      </td>
                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AttendanceBadge
                          {...sat}
                          canRevert={operate && sat.present}
                          reverting={arrivalSavingId === `${reg._id}:saturday`}
                          onRevert={() => onRevertArrival(reg._id, "saturday")}
                        />
                      </td>
                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AttendanceBadge
                          {...sun}
                          canRevert={operate && sun.present}
                          reverting={arrivalSavingId === `${reg._id}:sunday`}
                          onRevert={() => onRevertArrival(reg._id, "sunday")}
                        />
                      </td>
                      <td className="px-3 py-2.5">{contributionLabel(reg)}</td>
                      <td className="px-3 py-2.5">
                        <p>{lodgingLabel(lodging)}</p>
                        {lodging.pendingReason ? (
                          <p className="text-xs text-muted">
                            {lodgingPendingReasonLabel(lodging.pendingReason)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {arrived ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xs text-muted">
                              Llegó · {journeyDayShortLabel(journeyDay)}
                              {arrival.time ? ` · ${arrival.time}` : ""}
                            </span>
                            {operate ? (
                              <Button
                                size="sm"
                                variant="outline"
                                loading={arrivalSavingId === `${reg._id}:${journeyDay}`}
                                onClick={() => onRevertArrival(reg._id, journeyDay)}
                              >
                                Dejar sin marcar
                              </Button>
                            ) : null}
                          </div>
                        ) : operate ? (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={arrivalSavingId === `${reg._id}:${journeyDay}`}
                            onClick={() => onRegisterArrival(reg._id, journeyDay)}
                          >
                            Registrar llegada · {journeyDayShortLabel(journeyDay)}
                          </Button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2 md:hidden">
            {filtered.map((reg) => {
              const lodging = resolveRegistrationLodging(reg, assignments);
              const arrival = attendanceCellText(reg, journeyDay);
              const arrivedMobile = reg.attendance[journeyDay] === true;
              return (
                <li
                  key={reg._id}
                  className="rounded-lg border border-border bg-white px-3 py-3"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => onOpenParticipant(reg._id)}
                  >
                    <p className="font-semibold text-foreground">
                      {registrationDisplayName(reg)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {arrival.text} · {contributionLabel(reg)} · {lodgingLabel(lodging)}
                      {registrationRoleBadges(reg).length
                        ? ` · ${registrationRoleBadges(reg).join(" · ")}`
                        : ""}
                    </p>
                  </button>
                  {operate ? (
                    arrivedMobile ? (
                      <Button
                        className="mt-2"
                        size="sm"
                        variant="outline"
                        loading={arrivalSavingId === `${reg._id}:${journeyDay}`}
                        onClick={() => onRevertArrival(reg._id, journeyDay)}
                      >
                        Dejar sin marcar
                      </Button>
                    ) : (
                      <Button
                        className="mt-2"
                        size="sm"
                        variant="outline"
                        loading={arrivalSavingId === `${reg._id}:${journeyDay}`}
                        onClick={() => onRegisterArrival(reg._id, journeyDay)}
                      >
                        Registrar llegada · {journeyDayShortLabel(journeyDay)}
                      </Button>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function AttendanceBadge({
  text,
  present,
  canRevert,
  reverting,
  onRevert,
}: {
  text: string;
  present: boolean;
  time: string | null;
  canRevert?: boolean;
  reverting?: boolean;
  onRevert?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            present ? "bg-[var(--growth-os-success)]" : "bg-border"
          )}
          aria-hidden
        />
        {text}
      </span>
      {canRevert && onRevert ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          loading={reverting}
          onClick={onRevert}
        >
          Dejar sin marcar
        </Button>
      ) : null}
    </div>
  );
}
