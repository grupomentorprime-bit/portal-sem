"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  ActionMenu,
  ActionMenuItem,
  AlertBanner,
  ConfirmDialog,
  EmptyState,
  LoadingState,
  SearchBar,
} from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import {
  mergeCongressChurchOptions,
  sameCongressChurch,
} from "@/core/congress/church-name";
import {
  compareByRegistrationEntryNumber,
  registrationEntryNumber,
} from "@/core/congress/entry-order";
import {
  contributionStatusHasBalance,
  deriveContributionStatus,
} from "@/core/congress/finance-status";
import { formSubmissionDisplay } from "@/core/congress/form-engagement";
import {
  arrivalMarksImmediately,
  deriveReceptionProgress,
} from "@/core/congress/reception-stage";
import { isLodgingPending } from "@/core/congress/lodging-status";
import { registrationDeleteBlockReason } from "@/core/congress/registration-delete";
import type {
  CongressLodgingAssignment,
  CongressPayment,
  CongressRegistration,
} from "@/core/congress/types";
import { normalizeChilePhone } from "@/lib/experience/forms/phone-chile";
import { matchesPersonSearch } from "@/lib/experience/forms/person-search";
import { foldCongressPersonName } from "@/core/congress/brother-name";
import { cn } from "@/lib/utils";
import {
  attendanceCellText,
  contributionLabel,
  formatDateTimeSantiago,
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
  onEditParticipant: (id: string) => void;
  onDeleteParticipant: (id: string) => Promise<boolean | void>;
  payments: CongressPayment[];
  onRegisterArrival: (id: string, day: CongressAttendanceDay) => void;
  onGuideArrival: (id: string, day: CongressAttendanceDay) => void;
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
  onEditParticipant,
  onDeleteParticipant,
  payments,
  onRegisterArrival,
  onGuideArrival,
  onRevertArrival,
  arrivalSavingId,
}: Props) {
  const [pendingDelete, setPendingDelete] = useState<CongressRegistration | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function confirmArrival(reg: CongressRegistration, day: CongressAttendanceDay) {
    const immediate = arrivalMarksImmediately({
      registrationId: reg._id,
      registration: reg,
      payments,
      assignments,
      day,
    });
    if (immediate) onRegisterArrival(reg._id, day);
    else onGuideArrival(reg._id, day);
  }
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
    const source = zoneFilter
      ? registrations
          .filter((r) => r.zoneId === zoneFilter)
          .map((r) => r.churchName)
          .filter(Boolean)
      : churchOptions;
    const merged = mergeCongressChurchOptions([
      ...source,
      ...(zoneFilter ? [] : churchOptions),
    ]).map((o) => o.label);
    return merged;
  }, [churchOptions, registrations, zoneFilter]);

  const duplicateIds = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const reg of registrations) {
      const key = foldCongressPersonName(reg.identity.fullName);
      if (!key || key.split(" ").length < 2) continue;
      const list = groups.get(key) ?? [];
      list.push(reg._id);
      groups.set(key, list);
    }
    const ids = new Set<string>();
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      for (const id of list) ids.add(id);
    }
    return ids;
  }, [registrations]);

  const stageLabelById = useMemo(() => {
    const labels = new Map<string, string>();
    for (const reg of registrations) {
      labels.set(
        reg._id,
        deriveReceptionProgress({
          registrationId: reg._id,
          registration: reg,
          payments: [],
          assignments,
          journeyDay,
        }).stageLabel
      );
    }
    return labels;
  }, [registrations, assignments, journeyDay]);

  const filtered = useMemo(() => {
    const q = search.trim();
    const rows = registrations.filter((reg) => {
      if (zoneFilter && reg.zoneId !== zoneFilter) return false;
      if (churchFilter && !sameCongressChurch(reg.churchName, churchFilter)) {
        return false;
      }
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
    rows.sort(compareByRegistrationEntryNumber);
    return rows;
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
                  <th
                    className="w-16 px-3 py-2 text-right font-semibold"
                    title="Correlativo de ficha"
                  >
                    N°
                  </th>
                  <th className="px-3 py-2 font-semibold">Participante</th>
                  <th className="px-3 py-2 font-semibold">Iglesia / zona</th>
                  <th className="px-3 py-2 font-semibold">Sábado</th>
                  <th className="px-3 py-2 font-semibold">Domingo</th>
                  <th className="px-3 py-2 font-semibold" title="Aporte único $17.000 por ambos días">
                    Alimentación
                  </th>
                  <th className="px-3 py-2 font-semibold">Alojamiento</th>
                  <th className="px-3 py-2 font-semibold">Formulario</th>
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
                  const entryNumber = registrationEntryNumber(reg);
                  const form = formSubmissionDisplay(reg);
                  return (
                    <tr
                      key={reg._id}
                      className="cursor-pointer border-b border-border/70 hover:bg-background-soft/80"
                      onClick={() => onOpenParticipant(reg._id)}
                    >
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">
                        {entryNumber ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-foreground">
                          {registrationDisplayName(reg)}
                        </p>
                        <p className="text-xs font-extrabold text-primary">
                          {stageLabelById.get(reg._id)}
                        </p>
                        {duplicateIds.has(reg._id) ? (
                          <p className="text-xs font-semibold text-[var(--color-warning)]">
                            Posible duplicado, con o sin acento
                          </p>
                        ) : null}
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
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <ArrivalConfirm
                          text={sat}
                          operate={operate}
                          saving={arrivalSavingId === `${reg._id}:saturday`}
                          onConfirm={() => confirmArrival(reg, "saturday")}
                        />
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <ArrivalConfirm
                          text={sun}
                          operate={operate}
                          saving={arrivalSavingId === `${reg._id}:sunday`}
                          onConfirm={() => confirmArrival(reg, "sunday")}
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
                      <td className="px-3 py-2.5">
                        {form.at && form.label ? (
                          <FormOkNotice at={form.at} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
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
                              onClick={() => confirmArrival(reg, journeyDay)}
                            >
                              Registrar llegada · {journeyDayShortLabel(journeyDay)}
                            </Button>
                          ) : (
                            <span>—</span>
                          )}
                          {operate ? (
                            <ParticipantActionsMenu
                              registration={reg}
                              onEdit={() => onEditParticipant(reg._id)}
                              onDelete={() => setPendingDelete(reg)}
                            />
                          ) : null}
                        </div>
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
              const entryNumber = registrationEntryNumber(reg);
              const form = formSubmissionDisplay(reg);
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
                      <span className="mr-2 tabular-nums text-muted">
                        {entryNumber ?? "—"}
                      </span>
                      {registrationDisplayName(reg)}
                    </p>
                    <p className="text-xs font-extrabold text-primary">
                      {stageLabelById.get(reg._id)}
                    </p>
                    {duplicateIds.has(reg._id) ? (
                      <p className="text-xs font-semibold text-[var(--color-warning)]">
                        Posible duplicado, con o sin acento
                      </p>
                    ) : null}
                    <p className="mt-1">
                      {form.at && form.label ? (
                        <FormOkNotice at={form.at} />
                      ) : (
                        <span className="text-xs text-muted">Sin formulario</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {arrival.text} · {contributionLabel(reg)} · {lodgingLabel(lodging)}
                      {registrationRoleBadges(reg).length
                        ? ` · ${registrationRoleBadges(reg).join(" · ")}`
                        : ""}
                    </p>
                  </button>
                  {operate ? (
                    <div className="mt-2 flex items-center gap-1">
                      {arrivedMobile ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={arrivalSavingId === `${reg._id}:${journeyDay}`}
                          onClick={() => onRevertArrival(reg._id, journeyDay)}
                        >
                          Dejar sin marcar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={arrivalSavingId === `${reg._id}:${journeyDay}`}
                          onClick={() => confirmArrival(reg, journeyDay)}
                        >
                          Registrar llegada · {journeyDayShortLabel(journeyDay)}
                        </Button>
                      )}
                      <ParticipantActionsMenu
                        registration={reg}
                        onEdit={() => onEditParticipant(reg._id)}
                        onDelete={() => setPendingDelete(reg)}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {pendingDelete ? (
        <DeleteParticipantDialog
          registration={pendingDelete}
          assignments={assignments}
          payments={payments}
          loading={deleteBusy}
          onClose={() => {
            if (deleteBusy) return;
            setPendingDelete(null);
          }}
          onConfirm={() => {
            const id = pendingDelete._id;
            setDeleteBusy(true);
            void onDeleteParticipant(id).then((ok) => {
              setDeleteBusy(false);
              if (ok !== false) setPendingDelete(null);
            });
          }}
        />
      ) : null}
    </div>
  );
}

function FormOkNotice({ at }: { at: string }) {
  return (
    <span className="inline-flex flex-col rounded-md border-2 border-[var(--growth-os-success)] bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)] px-2 py-1 leading-tight">
      <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--growth-os-success)]">
        Formulario OK
      </span>
      <span className="text-xs font-semibold text-foreground">{formatDateTimeSantiago(at)}</span>
    </span>
  );
}

function ArrivalConfirm({
  text,
  operate,
  saving,
  onConfirm,
}: {
  text: { text: string; present: boolean; time: string | null };
  operate: boolean;
  saving: boolean;
  onConfirm: () => void;
}) {
  if (text.present || !operate) return <AttendanceBadge {...text} />;
  return (
    <button
      type="button"
      disabled={saving}
      className="rounded-md text-left hover:bg-background-soft disabled:opacity-60"
      onClick={onConfirm}
    >
      <AttendanceBadge {...text} />
    </button>
  );
}

function AttendanceBadge({
  text,
  present,
}: {
  text: string;
  present: boolean;
  time: string | null;
}) {
  return (
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
  );
}

function whatsappHref(phone: string | null | undefined): string | null {
  const normalized = normalizeChilePhone(phone ?? "");
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, "");
  const text = encodeURIComponent(
    "Hola, te escribimos desde la recepción del Congreso de Varones."
  );
  return `https://wa.me/${digits}?text=${text}`;
}

function ParticipantActionsMenu({
  registration,
  onEdit,
  onDelete,
}: {
  registration: CongressRegistration;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const whatsapp = whatsappHref(registration.identity.phone);
  return (
    <ActionMenu label={`Acciones de ${registrationDisplayName(registration)}`}>
      <ActionMenuItem onClick={onEdit}>Editar</ActionMenuItem>
      {whatsapp ? (
        <ActionMenuItem href={whatsapp} external>
          Escribir por WhatsApp
        </ActionMenuItem>
      ) : (
        <ActionMenuItem disabled>Escribir por WhatsApp (sin teléfono)</ActionMenuItem>
      )}
      <ActionMenuItem destructive onClick={onDelete}>
        Eliminar
      </ActionMenuItem>
    </ActionMenu>
  );
}

function DeleteParticipantDialog({
  registration,
  assignments,
  payments,
  loading,
  onClose,
  onConfirm,
}: {
  registration: CongressRegistration;
  assignments: CongressLodgingAssignment[];
  payments: CongressPayment[];
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const block = registrationDeleteBlockReason({
    registrationId: registration._id,
    allocatedPaidClp: registration.allocatedPaidClp ?? 0,
    payments,
    assignments,
  });
  if (block) {
    return (
      <ConfirmDialog
        open
        title="No se puede eliminar"
        description={block}
        confirmLabel="Entendido"
        hideCancel
        onClose={onClose}
        onConfirm={onClose}
      />
    );
  }
  return (
    <ConfirmDialog
      open
      title="Eliminar inscrito"
      description={`¿Eliminar a ${registrationDisplayName(registration)}? La ficha se borra y no se puede deshacer.`}
      confirmLabel="Sí, eliminar"
      cancelLabel="Cancelar"
      destructive
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
