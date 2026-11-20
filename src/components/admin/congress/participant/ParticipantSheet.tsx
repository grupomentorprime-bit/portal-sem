"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { Dialog } from "@/components/admin/kit";
import { ConfirmDialog } from "@/components/admin/kit/dialogs/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_NIGHTS, CONGRESS_ZONES } from "@/core/congress/constants";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressLodgingNeed,
  CongressPayment,
  CongressRegistration,
} from "@/core/congress/types";
import {
  formatDateTimeSantiago,
  formatLodgingNightLabel,
  formatMarkedAtSantiago,
  formatZoneLabel,
  lodgingLabel,
  registrationDisplayName,
  registrationRoleBadges,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";
import {
  contributionStatusHasBalance,
  deriveContributionStatus,
} from "@/core/congress/finance-status";
import { Checkbox } from "@/components/ui/checkbox";
import { ChilePhoneInput } from "@/components/portal/experience/forms/ChilePhoneInput";
import { ChileRutInput } from "@/components/portal/experience/forms/ChileRutInput";
import {
  CHILE_PHONE_INVALID_MESSAGE,
  formatChilePhoneDisplay,
  isValidChilePhone,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";
import {
  CHILE_RUT_INVALID_MESSAGE,
  formatChileRutDisplay,
  isValidChileRut,
  normalizeChileRut,
} from "@/lib/experience/forms/rut-chile";
import { formSubmissionDisplay } from "@/core/congress/form-engagement";
import { occupiedBedsForNight } from "@/core/congress/lodging";
import { findFoldedNameDuplicates } from "@/core/congress/accent-duplicates";
import { registrationDeleteBlockReason } from "@/core/congress/registration-delete";
import {
  deriveReceptionProgress,
  receptionPrimaryAction,
  type ReceptionMissingField,
  type ReceptionStepId,
} from "@/core/congress/reception-stage";
import { ReceptionStageHeader } from "@/components/admin/congress/participant/ReceptionStageHeader";

const NIGHT_BOTH = "__both__";

type Props = {
  open: boolean;
  registration: CongressRegistration | null;
  assignments: CongressLodgingAssignment[];
  homes: CongressLodgingHome[];
  operate: boolean;
  journeyDay: CongressAttendanceDay;
  zoneOptions?: { id: string; label: string }[];
  onGoToPay?: (registrationId: string) => void;
  onClose: () => void;
  onPatchAttendance: (
    id: string,
    day: CongressAttendanceDay,
    present: boolean | null,
    reason?: string
  ) => Promise<void>;
  onPatchRegistration: (
    id: string,
    patch: {
      expectedDays?: { saturday: boolean | null; sunday: boolean | null };
      lodgingNeed?: CongressLodgingNeed;
      isChurchGroupLeader?: boolean;
      isZoneLeader?: boolean;
      ensureHnoPrefix?: boolean;
      fullName?: string;
      rut?: string;
      email?: string;
      phone?: string;
      zoneId?: string;
      churchName?: string;
    }
  ) => Promise<boolean>;
  payments: CongressPayment[];
  registrations?: CongressRegistration[];
  onOpenRegistration?: (id: string) => void;
  onDeleteRegistration?: (id: string) => Promise<void>;
  onAssignBed: (input: {
    registrationId: string;
    homeId: string;
    night: string;
  }) => Promise<void>;
  onAssignmentAction: (
    assignmentId: string,
    action: "confirm" | "cancel"
  ) => Promise<void>;
  busy: boolean;
  /** Abre la ficha con los datos personales en edición. */
  startEditing?: boolean;
};

function sheetZoneOptions(
  zoneOptions: { id: string; label: string }[],
  currentZoneId: string
): { value: string; label: string }[] {
  const base =
    zoneOptions.length > 0
      ? zoneOptions
      : CONGRESS_ZONES.map((zone) => ({ id: zone.id, label: zone.label }));
  const rows =
    currentZoneId && !base.some((zone) => zone.id === currentZoneId)
      ? [{ id: currentZoneId, label: formatZoneLabel(currentZoneId) }, ...base]
      : base;
  return rows.map((zone) => ({ value: zone.id, label: zone.label }));
}

export function ParticipantSheet({
  open,
  registration,
  assignments,
  homes,
  operate,
  journeyDay,
  zoneOptions = [],
  onGoToPay,
  onClose,
  onPatchAttendance,
  onPatchRegistration,
  payments,
  registrations = [],
  onOpenRegistration,
  onDeleteRegistration,
  onAssignBed,
  onAssignmentAction,
  busy,
  startEditing = false,
}: Props) {
  const [homeId, setHomeId] = useState("");
  const [night, setNight] = useState<string>(NIGHT_BOTH);
  const [editName, setEditName] = useState("");
  const [editRut, setEditRut] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editZone, setEditZone] = useState("");
  const [editChurch, setEditChurch] = useState("");
  const [editRutError, setEditRutError] = useState<string | null>(null);
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [trackedRegistrationId, setTrackedRegistrationId] = useState<string | null>(null);
  const seenUpdatedAt = useRef<string | null>(null);

  if (!open && trackedRegistrationId !== null) {
    setTrackedRegistrationId(null);
  } else if (registration && open && trackedRegistrationId !== registration._id) {
    setTrackedRegistrationId(registration._id);
    setEditing(startEditing);
    seenUpdatedAt.current = registration.updatedAt ?? null;
  }

  useEffect(() => {
    if (!registration || !open) return;
    setHomeId("");
    setNight(NIGHT_BOTH);
    setEditName(registrationDisplayName(registration));
    setEditRut(
      registration.identity.rut ? formatChileRutDisplay(registration.identity.rut) : ""
    );
    setEditEmail(registration.identity.email ?? "");
    setEditPhone(
      registration.identity.phone
        ? formatChilePhoneDisplay(registration.identity.phone)
        : ""
    );
    setEditRutError(null);
    setEditPhoneError(null);
    setConfirmDelete(false);
    setConfirmArmed(false);
    if (
      seenUpdatedAt.current &&
      registration.updatedAt &&
      seenUpdatedAt.current !== registration.updatedAt
    ) {
      setEditing(false);
    }
    seenUpdatedAt.current = registration.updatedAt ?? null;
    setEditZone(registration.zoneId);
    setEditChurch(registration.churchName);
  }, [open, registration?._id, registration?.updatedAt]);

  useEffect(() => {
    if (!confirmDelete) {
      setConfirmArmed(false);
      return;
    }
    const timer = window.setTimeout(() => setConfirmArmed(true), 350);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  const lodging = useMemo(
    () =>
      registration
        ? resolveRegistrationLodging(registration, assignments)
        : null,
    [assignments, registration]
  );

  const personAssignments = useMemo(
    () =>
      registration
        ? assignments.filter(
            (a) => a.registrationId === registration._id && a.status !== "cancelled"
          )
        : [],
    [assignments, registration]
  );

  const activeAssignments = useMemo(
    () =>
      assignments.filter(
        (a) =>
          a.status === "assigned" || a.status === "confirmed" || Boolean(a.confirmed)
      ),
    [assignments]
  );

  const homeAvailability = useMemo(() => {
    const fri = CONGRESS_NIGHTS[0];
    const sat = CONGRESS_NIGHTS[1];
    return homes.map((home) => {
      const friCap = home.capacityByNight[fri] ?? 0;
      const satCap = home.capacityByNight[sat] ?? 0;
      const friFree = Math.max(
        0,
        friCap - occupiedBedsForNight(activeAssignments, home._id, fri)
      );
      const satFree = Math.max(
        0,
        satCap - occupiedBedsForNight(activeAssignments, home._id, sat)
      );
      return { home, friCap, satCap, friFree, satFree };
    });
  }, [activeAssignments, homes]);

  const homeOptionsForNight = useMemo(() => {
    const freeForNight = (row: (typeof homeAvailability)[number]) => {
      if (night === NIGHT_BOTH) return Math.min(row.friFree, row.satFree);
      if (night === CONGRESS_NIGHTS[0]) return row.friFree;
      return row.satFree;
    };
    return [...homeAvailability].sort((a, b) => {
      const aFree = freeForNight(a);
      const bFree = freeForNight(b);
      const aOk = aFree > 0;
      const bOk = bFree > 0;
      if (aOk !== bOk) return aOk ? -1 : 1;
      if (bFree !== aFree) return bFree - aFree;
      return a.home.name.localeCompare(b.home.name, "es");
    });
  }, [homeAvailability, night]);

  const selectedHomeAvailability = useMemo(
    () => homeAvailability.find((row) => row.home._id === homeId) ?? null,
    [homeAvailability, homeId]
  );

  const progress = useMemo(() => {
    if (!registration) return null;
    return deriveReceptionProgress({
      registrationId: registration._id,
      registration,
      payments,
      assignments,
      journeyDay,
    });
  }, [registration, payments, assignments, journeyDay]);

  const [viewStep, setViewStep] = useState<ReceptionStepId>("asistencia");
  const [viewForId, setViewForId] = useState<string | null>(null);
  if (registration && progress && viewForId !== registration._id) {
    setViewForId(registration._id);
    setViewStep(progress.stage === "listo" ? "alojamiento" : progress.stage);
  }

  const title = registration
    ? registrationDisplayName(registration)
    : "Participante";
  const nameDuplicates = registration
    ? findFoldedNameDuplicates(editName || registration.identity.fullName, registrations, registration._id)
    : [];
  const deleteBlockReason = registration
    ? registrationDeleteBlockReason({
        registrationId: registration._id,
        allocatedPaidClp: registration.allocatedPaidClp ?? 0,
        payments,
        assignments,
      })
    : null;
  const roleBadges = registration ? registrationRoleBadges(registration) : [];
  const formDisplay = registration ? formSubmissionDisplay(registration) : null;
  const description = registration
    ? [
        registration.churchName,
        formatZoneLabel(registration.zoneId),
        ...roleBadges,
      ].join(" · ")
    : undefined;

  const cancelIdentityEdit = () => {
    if (!registration) return;
    setEditName(registrationDisplayName(registration));
    setEditRut(
      registration.identity.rut ? formatChileRutDisplay(registration.identity.rut) : ""
    );
    setEditEmail(registration.identity.email ?? "");
    setEditPhone(
      registration.identity.phone
        ? formatChilePhoneDisplay(registration.identity.phone)
        : ""
    );
    setEditZone(registration.zoneId);
    setEditChurch(registration.churchName);
    setEditRutError(null);
    setEditPhoneError(null);
    setEditing(false);
  };

  const saveIdentity = () => {
    if (!registration) return;
    const rutValue = editRut.trim();
    const phoneValue = editPhone.trim();
    const normalizedRut = rutValue ? normalizeChileRut(rutValue) : null;
    const normalizedPhone = phoneValue ? normalizeChilePhone(phoneValue) : null;
    const nextRutError = rutValue && !normalizedRut ? CHILE_RUT_INVALID_MESSAGE : null;
    const nextPhoneError = phoneValue && !normalizedPhone ? CHILE_PHONE_INVALID_MESSAGE : null;
    setEditRutError(nextRutError);
    setEditPhoneError(nextPhoneError);
    if (nextRutError || nextPhoneError) return;
    void onPatchRegistration(registration._id, {
      fullName: editName,
      rut: normalizedRut ?? "",
      email: editEmail,
      phone: normalizedPhone ?? "",
      zoneId: editZone,
      churchName: editChurch,
    });
  };

  const identityControl = (field: ReceptionMissingField) => {
    switch (field) {
      case "fullName":
        return (
          <Input
            key={field}
            label="Nombre"
            value={editName}
            disabled={busy}
            onChange={(e) => setEditName(e.target.value)}
          />
        );
      case "phone":
        return (
          <ChilePhoneInput
            key={field}
            label="Teléfono"
            name="editPhone"
            value={editPhone}
            disabled={busy}
            error={editPhoneError ?? undefined}
            helper="Celular chileno, con +56. Ej. +56 9 1234 5678"
            onChange={(value) => {
              setEditPhone(value);
              if (!value.trim() || isValidChilePhone(value)) setEditPhoneError(null);
            }}
            onBlur={() => {
              if (!editPhone.trim() || isValidChilePhone(editPhone)) {
                setEditPhoneError(null);
                return;
              }
              setEditPhoneError(CHILE_PHONE_INVALID_MESSAGE);
            }}
          />
        );
      case "zoneId":
        return (
          <Select
            key={field}
            label="Zona"
            value={editZone}
            disabled={busy}
            onChange={(e) => setEditZone(e.target.value)}
            options={sheetZoneOptions(zoneOptions, editZone)}
          />
        );
      case "churchName":
        return (
          <Input
            key={field}
            label="Iglesia"
            value={editChurch}
            disabled={busy}
            onChange={(e) => setEditChurch(e.target.value)}
          />
        );
    }
  };

  const missingFields = progress?.missingFields ?? [];
  const isMissing = (field: ReceptionMissingField) => missingFields.includes(field);
  const missingFieldLabels: Record<ReceptionMissingField, string> = {
    fullName: "Nombre",
    phone: "Teléfono",
    zoneId: "Zona",
    churchName: "Iglesia",
  };
  const attendanceDays = ["saturday", "sunday"] as const;
  const primaryAction = progress
    ? receptionPrimaryAction(viewStep, progress.steps)
    : null;

  const identityActions =
    registration && operate ? (
      editing ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={cancelIdentityEdit}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy || !editName.trim() || !editChurch.trim() || !editZone}
            onClick={saveIdentity}
          >
            Guardar
          </Button>
        </>
      ) : (
        <>
          {onGoToPay ? (
            <Button
              type="button"
              size="md"
              disabled={busy}
              className={
                contributionStatusHasBalance(deriveContributionStatus(registration))
                  ? "pay-aporte-alert"
                  : undefined
              }
              onClick={() => onGoToPay(registration._id)}
            >
              <CreditCard className="h-4 w-4" strokeWidth={2} aria-hidden />
              Pagar aporte
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setViewStep("asistencia");
              setEditing(true);
            }}
          >
            Editar
          </Button>
        </>
      )
    ) : null;

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      actions={identityActions}
      size="xl"
    >
      {!registration ? (
        <p className="text-sm text-muted">Seleccione un participante.</p>
      ) : (
        <div className="space-y-4 text-sm">
          {progress ? (
            <ReceptionStageHeader
              progress={progress}
              viewStep={viewStep}
              operate={operate}
              busy={busy}
              onViewStep={setViewStep}
              onPrimary={() => {
                if (!primaryAction || !primaryAction.enabled || busy) return;
                if (primaryAction.kind === "close") {
                  onClose();
                  return;
                }
                setViewStep("alojamiento");
              }}
            />
          ) : null}

          <p className="text-xs text-muted" role="status">
            {formDisplay?.at && formDisplay.label
              ? `Formulario recibido · ${formatDateTimeSantiago(formDisplay.at)}`
              : "Sin formulario"}
          </p>

          {nameDuplicates.length > 0 ? (
            <div
              className="rounded-lg border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_10%,white)] px-4 py-3"
              role="status"
            >
              <p className="font-semibold text-foreground">Posible ingreso duplicado</p>
              <ul className="mt-1 space-y-1">
                {nameDuplicates.map((match) => (
                  <li key={match.row._id}>
                    <button
                      type="button"
                      className="text-left text-primary underline-offset-2 hover:underline"
                      onClick={() => onOpenRegistration?.(match.row._id)}
                    >
                      {registrationDisplayName(match.row)}
                      {match.row.churchName ? ` · ${match.row.churchName}` : ""}
                      {match.accentOnly
                        ? " — puede ser la misma persona, con o sin acento"
                        : " — ya hay una ficha con este nombre"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {viewStep === "asistencia" ? (
            <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {attendanceDays.map((day) => {
                    const present = registration.attendance[day];
                    const isJourney = day === journeyDay;
                    const markedAt =
                      day === "saturday"
                        ? registration.attendanceMeta?.saturdayMarkedAt
                        : registration.attendanceMeta?.sundayMarkedAt;
                    const status =
                      present === true
                        ? `Presente${markedAt ? ` · ${formatMarkedAtSantiago(markedAt)}` : ""}`
                        : present === false
                          ? "No vino"
                          : isJourney && progress?.arrivalRequired
                            ? "Sin llegada · se espera hoy"
                            : "Sin llegada";
                    return (
                      <div
                        key={day}
                        className={cn(
                          "rounded-lg border px-3 py-3",
                          present === true
                            ? "border-[color-mix(in_srgb,var(--growth-os-success)_55%,white)] bg-[color-mix(in_srgb,var(--growth-os-success)_12%,white)]"
                            : isJourney
                              ? "border-primary bg-[color-mix(in_srgb,var(--color-primary)_7%,white)]"
                              : "border-border bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-base font-semibold text-foreground">
                            {day === "saturday" ? "Sábado" : "Domingo"}
                          </p>
                          {isJourney ? (
                            <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_14%,white)] px-2 py-0.5 text-xs font-semibold text-primary">
                              Hoy
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-1 text-sm",
                            present === true
                              ? "font-semibold text-[var(--growth-os-success)]"
                              : "text-muted"
                          )}
                        >
                          {status}
                        </p>
                        {operate && present !== true ? (
                          <Button
                            type="button"
                            variant="primary"
                            className="mt-3 w-full"
                            disabled={busy}
                            onClick={() => void onPatchAttendance(registration._id, day, true)}
                          >
                            Llegó
                          </Button>
                        ) : null}
                        {operate && present != null ? (
                          <div className="mt-2 flex gap-3">
                            {present !== false ? (
                              <button
                                type="button"
                                className="text-xs text-muted underline-offset-2 hover:underline"
                                disabled={busy}
                                onClick={() => void onPatchAttendance(registration._id, day, false)}
                              >
                                No vino
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="text-xs text-muted underline-offset-2 hover:underline"
                              disabled={busy}
                              onClick={() => void onPatchAttendance(registration._id, day, null)}
                            >
                              Quitar marca
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {missingFields.length > 0 ? (
                  <div
                    className="space-y-3 rounded-md border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_10%,white)] p-3"
                    role="status"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      Faltan datos
                    </p>
                    {operate ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {missingFields.map((field) => identityControl(field))}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy || !editName.trim() || !editChurch.trim() || !editZone}
                          onClick={saveIdentity}
                        >
                          Guardar datos
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted">
                        {missingFields.map((field) => missingFieldLabels[field]).join(" · ")}
                      </p>
                    )}
                  </div>
                ) : null}

                {operate && editing ? (
                  <div className="space-y-3 rounded-md border border-border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Datos del inscrito
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {!isMissing("fullName") ? identityControl("fullName") : null}
                        <ChileRutInput
                          label="RUT"
                          name="editRut"
                          value={editRut}
                          disabled={busy}
                          error={editRutError ?? undefined}
                          helper="Opcional. Ej. 12.345.678-5"
                          onChange={(value) => {
                            setEditRut(value);
                            if (!value.trim() || isValidChileRut(value)) setEditRutError(null);
                          }}
                          onBlur={() => {
                            if (!editRut.trim() || isValidChileRut(editRut)) {
                              setEditRutError(null);
                              return;
                            }
                            setEditRutError(CHILE_RUT_INVALID_MESSAGE);
                          }}
                        />
                        <Input
                          label="Correo"
                          type="email"
                          value={editEmail}
                          disabled={busy}
                          onChange={(e) => setEditEmail(e.target.value)}
                        />
                        {!isMissing("phone") ? identityControl("phone") : null}
                        {!isMissing("zoneId") ? identityControl("zoneId") : null}
                        {!isMissing("churchName") ? identityControl("churchName") : null}
                      </div>
                    <div className="flex flex-col items-start gap-2">
                      {onDeleteRegistration ? (
                        deleteBlockReason ? (
                          <p className="text-xs text-muted">{deleteBlockReason}</p>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setConfirmDelete(true)}
                          >
                            Eliminar
                          </Button>
                        )
                      ) : null}
                    </div>
                    <Checkbox
                      label="Líder del grupo (iglesia)"
                      description="Solo uno por iglesia. Puede ser también jefe zonal."
                      checked={registration.isChurchGroupLeader === true}
                      disabled={busy}
                      onChange={(e) =>
                        void onPatchRegistration(registration._id, {
                          isChurchGroupLeader: e.target.checked,
                        })
                      }
                    />
                    <Checkbox
                      label="Jefe zonal"
                      description="Solo uno por zona. Puede ser también líder de iglesia."
                      checked={registration.isZoneLeader === true}
                      disabled={busy}
                      onChange={(e) =>
                        void onPatchRegistration(registration._id, {
                          isZoneLeader: e.target.checked,
                        })
                      }
                    />
                  </div>
                ) : roleBadges.length > 0 ? (
                  <p className="text-xs text-muted">{roleBadges.join(" · ")}</p>
                ) : null}

                {(registration.attendanceHistory ?? []).length > 0 ? (
                  <details className="text-xs text-muted">
                    <summary className="cursor-pointer font-semibold uppercase">Historial</summary>
                    <ul className="mt-1 max-h-24 space-y-1 overflow-y-auto">
                      {[...(registration.attendanceHistory ?? [])]
                        .slice()
                        .reverse()
                        .map((h, idx) => (
                          <li key={`${h.at}-${idx}`}>
                            {formatDateTimeSantiago(h.at)} ·{" "}
                            {h.day === "saturday" ? "Sáb" : "Dom"} →{" "}
                            {h.nextPresent === true
                              ? "Presente"
                              : h.nextPresent === false
                                ? "No vino"
                                : "Sin marca"}
                            {h.reason ? ` · ${h.reason}` : ""}
                          </li>
                        ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : null}

          <div className="max-h-[min(52vh,28rem)] overflow-y-auto pr-1">
            {viewStep === "alojamiento" ? (
              <div className="space-y-3">
                <p className="text-base font-semibold">
                  {lodging ? lodgingLabel(lodging) : "—"}
                </p>
                <p className="text-xs text-muted">
                  Noches disponibles: Viernes 20, Sábado 21 o <strong>ambos días</strong>.
                </p>
                {operate && (registration.lodgingNeed ?? "unknown") === "unknown" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void onPatchRegistration(registration._id, { lodgingNeed: "none" })
                      }
                    >
                      No requiere
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void onPatchRegistration(registration._id, {
                          lodgingNeed: "requested",
                        })
                      }
                    >
                      Necesita alojamiento
                    </Button>
                  </div>
                ) : null}
                {operate ? (
                  <Select
                    label="Necesidad"
                    value={registration.lodgingNeed ?? "unknown"}
                    onChange={(e) =>
                      void onPatchRegistration(registration._id, {
                        lodgingNeed: e.target.value as CongressLodgingNeed,
                      })
                    }
                    options={[
                      { value: "unknown", label: "Por confirmar" },
                      { value: "none", label: "No requiere" },
                      { value: "requested", label: "Requiere" },
                    ]}
                  />
                ) : null}

                {personAssignments.map((a) => {
                  const home = homes.find((h) => h._id === a.homeId);
                  return (
                    <div
                      key={a._id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{home?.name ?? a.homeId}</p>
                        <p className="text-xs text-muted">
                          {formatLodgingNightLabel(a.night)} · {a.status}
                        </p>
                      </div>
                      {operate ? (
                        <div className="flex gap-1">
                          {a.status === "assigned" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void onAssignmentAction(a._id, "confirm")}
                            >
                              Confirmar
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void onAssignmentAction(a._id, "cancel")}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {operate && (registration.lodgingNeed ?? "unknown") !== "none" ? (
                  <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                    <Select
                      label="Hogar"
                      value={homeId}
                      onChange={(e) => setHomeId(e.target.value)}
                      options={[
                        { value: "", label: "Seleccionar hogar…" },
                        ...homeOptionsForNight.map(
                          ({ home, friFree, satFree, friCap, satCap }) => {
                            const freeForNight =
                              night === NIGHT_BOTH
                                ? Math.min(friFree, satFree)
                                : night === CONGRESS_NIGHTS[0]
                                  ? friFree
                                  : satFree;
                            const freeLabel =
                              night === NIGHT_BOTH
                                ? `libres vie ${friFree}/${friCap} · sáb ${satFree}/${satCap}`
                                : night === CONGRESS_NIGHTS[0]
                                  ? `libres ${friFree}/${friCap}`
                                  : `libres ${satFree}/${satCap}`;
                            const care = home.notes?.trim() ? " · cuidados" : "";
                            const full = freeForNight < 1;
                            return {
                              value: home._id,
                              label: full
                                ? `${home.name} · sin cupo · ${freeLabel}${care}`
                                : `${home.name} · ${freeLabel}${care}`,
                              disabled: full,
                            };
                          }
                        ),
                      ]}
                    />
                    <Select
                      label="Noche(s)"
                      value={night}
                      onChange={(e) => setNight(e.target.value)}
                      options={[
                        {
                          value: NIGHT_BOTH,
                          label: "Ambos días (vie 20 y sáb 21)",
                        },
                        ...CONGRESS_NIGHTS.map((n) => ({
                          value: n,
                          label: formatLodgingNightLabel(n),
                        })),
                      ]}
                    />
                    {selectedHomeAvailability ? (
                      <div className="sm:col-span-2 rounded-md border border-[color-mix(in_srgb,var(--color-warning)_30%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_8%,white)] px-3 py-2 text-xs text-foreground">
                        <p className="font-semibold">
                          {selectedHomeAvailability.home.name}
                        </p>
                        <p className="mt-0.5 text-muted">
                          Cupos libres: vie {selectedHomeAvailability.friFree}/
                          {selectedHomeAvailability.friCap} · sáb{" "}
                          {selectedHomeAvailability.satFree}/
                          {selectedHomeAvailability.satCap}
                          {selectedHomeAvailability.home.address
                            ? ` · ${selectedHomeAvailability.home.address}`
                            : ""}
                        </p>
                        {selectedHomeAvailability.home.notes?.trim() ? (
                          <p className="mt-1">
                            <span className="font-semibold">Cuidados: </span>
                            {selectedHomeAvailability.home.notes}
                          </p>
                        ) : (
                          <p className="mt-1 text-muted">
                            Sin notas de cuidado registradas para este hogar.
                          </p>
                        )}
                      </div>
                    ) : null}
                    <div className="sm:col-span-2 space-y-2">
                      <p className="text-xs text-muted">
                        Si elige ambos días, se asigna una cama por cada noche en el mismo
                        hogar. Revise cuidados (p. ej. sin segundo piso) antes de asignar.
                      </p>
                      <Button
                        size="sm"
                        disabled={
                          busy ||
                          !homeId ||
                          !selectedHomeAvailability ||
                          (night === NIGHT_BOTH
                            ? selectedHomeAvailability.friFree < 1 ||
                              selectedHomeAvailability.satFree < 1
                            : night === CONGRESS_NIGHTS[0]
                              ? selectedHomeAvailability.friFree < 1
                              : selectedHomeAvailability.satFree < 1)
                        }
                        onClick={() => {
                          const nights =
                            night === NIGHT_BOTH
                              ? [...CONGRESS_NIGHTS]
                              : [night];
                          void (async () => {
                            for (const n of nights) {
                              await onAssignBed({
                                registrationId: registration._id,
                                homeId,
                                night: n,
                              });
                            }
                          })();
                        }}
                      >
                        {night === NIGHT_BOTH
                          ? "Asignar camas (ambos días)"
                          : "Asignar cama"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Dialog>
    {registration && confirmDelete && onDeleteRegistration ? (
      <ConfirmDialog
        open
        title="Eliminar inscrito"
        description={`¿Eliminar a ${registrationDisplayName(registration)}? La ficha se borra y no se puede deshacer. Si lo apretó por error, cancele.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        destructive
        loading={busy}
        onClose={() => {
          if (busy) return;
          setConfirmDelete(false);
        }}
        onConfirm={() => {
          if (!confirmArmed || busy) return;
          void onDeleteRegistration(registration._id);
        }}
      />
    ) : null}
    </>
  );
}
