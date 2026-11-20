"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/admin/kit";
import { ClpAmountInput } from "@/components/admin/congress/ClpAmountInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_CONTRIBUTION_CLP, CONGRESS_NIGHTS, CONGRESS_ZONES } from "@/core/congress/constants";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressLodgingNeed,
  CongressPayment,
  CongressPaymentMethod,
  CongressRegistration,
} from "@/core/congress/types";
import {
  contributionLabel,
  expectedDaysText,
  formatClp,
  formatClpInput,
  formatDateTimeSantiago,
  formatLodgingNightLabel,
  formatMarkedAtSantiago,
  formatZoneLabel,
  lodgingLabel,
  registrationDisplayName,
  registrationRoleBadges,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";
import { Checkbox } from "@/components/ui/checkbox";
import { CHARGE_WAIVE_REASONS, isExplicitlyExempt } from "@/core/congress/charge";
import { remainingBalanceClp } from "@/core/congress/charges";
import { formSubmissionDisplay } from "@/core/congress/form-engagement";
import { todayPaidOnSantiago } from "@/core/congress/payment-dates";
import { occupiedBedsForNight } from "@/core/congress/lodging";
import { cn } from "@/lib/utils";

type SheetTab = "asistencia" | "alimentacion" | "alojamiento";
const NIGHT_BOTH = "__both__";

type Props = {
  open: boolean;
  registration: CongressRegistration | null;
  assignments: CongressLodgingAssignment[];
  homes: CongressLodgingHome[];
  operate: boolean;
  canPay: boolean;
  zoneOptions?: { id: string; label: string }[];
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
  ) => Promise<void>;
  onIndividualPayment: (input: {
    registrationId: string;
    amountClp: number;
    payerName: string;
    method: CongressPaymentMethod;
    paidOn: string;
    receiptRef?: string;
  }) => Promise<void>;
  payments: CongressPayment[];
  lastReceiptPayment?: CongressPayment | null;
  onDownloadReceipt: (payment: CongressPayment) => void;
  onChargeChange: (input: {
    registrationId: string;
    action: "exempt" | "restore" | "reduce";
    reason: string;
    waiveClp?: number;
  }) => Promise<void>;
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
};

function chargeHistoryLabel(entry: {
  action: string;
  previousChargeAmountClp: number | null;
  nextChargeAmountClp: number | null;
}): string {
  if (entry.action === "exempt") return "No paga el total";
  if (entry.action === "reduce") {
    const unpaid = Math.max(
      0,
      (entry.previousChargeAmountClp ?? 0) - (entry.nextChargeAmountClp ?? 0)
    );
    return `No paga ${formatClp(unpaid)}`;
  }
  return "Aporte restaurado";
}

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

function expectedPresetFromReg(
  registration: CongressRegistration
): "unconfirmed" | "saturday" | "sunday" | "both" {
  const d = registration.expectedDays;
  if (d?.saturday && d?.sunday) return "both";
  if (d?.saturday) return "saturday";
  if (d?.sunday) return "sunday";
  return "unconfirmed";
}

export function ParticipantSheet({
  open,
  registration,
  assignments,
  homes,
  operate,
  canPay,
  zoneOptions = [],
  onClose,
  onPatchAttendance,
  onPatchRegistration,
  onIndividualPayment,
  payments,
  lastReceiptPayment,
  onDownloadReceipt,
  onChargeChange,
  onAssignBed,
  onAssignmentAction,
  busy,
}: Props) {
  const [tab, setTab] = useState<SheetTab>("asistencia");
  const [payAmount, setPayAmount] = useState<number | null>(CONGRESS_CONTRIBUTION_CLP);
  const [payerName, setPayerName] = useState("");
  const [payMethod, setPayMethod] = useState<CongressPaymentMethod>("cash");
  const [paidOn, setPaidOn] = useState(todayPaidOnSantiago());
  const [receiptRef, setReceiptRef] = useState("");
  const [chargeReason, setChargeReason] = useState("");
  const [adjustCharge, setAdjustCharge] = useState(false);
  const [waiveScope, setWaiveScope] = useState<"total" | "part">("total");
  const [waiveAmount, setWaiveAmount] = useState<number | null>(null);
  const [reasonOther, setReasonOther] = useState("");
  const [homeId, setHomeId] = useState("");
  const [night, setNight] = useState<string>(NIGHT_BOTH);
  const [expectedPreset, setExpectedPreset] = useState<
    "unconfirmed" | "saturday" | "sunday" | "both"
  >("unconfirmed");
  const [editName, setEditName] = useState("");
  const [editRut, setEditRut] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editZone, setEditZone] = useState("");
  const [editChurch, setEditChurch] = useState("");

  useEffect(() => {
    if (!registration || !open) return;
    setTab("asistencia");
    setPayerName(registration.identity.fullName);
    setPayMethod("cash");
    setPaidOn(todayPaidOnSantiago());
    setReceiptRef("");
    setChargeReason("");
    setAdjustCharge(false);
    setWaiveScope("total");
    setWaiveAmount(null);
    setReasonOther("");
    setHomeId("");
    setNight(NIGHT_BOTH);
    setExpectedPreset(expectedPresetFromReg(registration));
    setEditName(registration.identity.fullName);
    setEditRut(registration.identity.rut ?? "");
    setEditEmail(registration.identity.email ?? "");
    setEditPhone(registration.identity.phone ?? "");
    setEditZone(registration.zoneId);
    setEditChurch(registration.churchName);
  }, [open, registration?._id, registration?.updatedAt]);

  useEffect(() => {
    if (!registration || !open) return;
    const balance = remainingBalanceClp(registration);
    setPayAmount(
      balance > 0
        ? balance
        : registration.chargeAmountClp ?? CONGRESS_CONTRIBUTION_CLP
    );
  }, [
    open,
    registration?._id,
    registration?.allocatedPaidClp,
    registration?.chargeAmountClp,
  ]);

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

  const relatedPayments = useMemo(
    () =>
      registration
        ? payments.filter((payment) =>
            payment.allocations.some(
              (allocation) => allocation.registrationId === registration._id
            )
          )
        : [],
    [payments, registration]
  );

  const lastReceiptBelongsToRegistration =
    Boolean(registration) &&
    Boolean(
      lastReceiptPayment?.allocations.some(
        (allocation) => allocation.registrationId === registration?._id
      )
    );

  const title = registration
    ? registrationDisplayName(registration)
    : "Participante";
  const roleBadges = registration ? registrationRoleBadges(registration) : [];
  const formDisplay = registration ? formSubmissionDisplay(registration) : null;
  const description = registration
    ? [
        registration.churchName,
        formatZoneLabel(registration.zoneId),
        ...roleBadges,
      ].join(" · ")
    : undefined;

  const tabs: { id: SheetTab; label: string }[] = [
    { id: "asistencia", label: "Asistencia" },
    { id: "alimentacion", label: "Alimentación" },
    { id: "alojamiento", label: "Alojamiento" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="xl"
    >
      {!registration ? (
        <p className="text-sm text-muted">Seleccione un participante.</p>
      ) : (
        <div className="space-y-4 text-sm">
          {formDisplay?.at && formDisplay.label ? (
            <div
              className="rounded-lg border-2 border-[var(--growth-os-success)] bg-[color-mix(in_srgb,var(--growth-os-success)_14%,white)] px-4 py-3"
              role="status"
            >
              <p className="text-base font-extrabold uppercase tracking-wide text-[var(--growth-os-success)]">
                Formulario OK
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formDisplay.label} · {formatDateTimeSantiago(formDisplay.at)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">Sin formulario</p>
          )}

          <div className="flex flex-wrap gap-1 border-b border-border pb-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                  tab === item.id
                    ? "bg-primary text-text-inverse"
                    : "text-muted hover:bg-background-soft hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="max-h-[min(60vh,32rem)] overflow-y-auto pr-1">
            {tab === "asistencia" ? (
              <div className="space-y-3">
                {operate ? (
                  <div className="space-y-3 rounded-md border border-border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Datos del inscrito
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Nombre"
                        value={editName}
                        disabled={busy}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Input
                        label="RUT"
                        value={editRut}
                        disabled={busy}
                        onChange={(e) => setEditRut(e.target.value)}
                      />
                      <Input
                        label="Correo"
                        type="email"
                        value={editEmail}
                        disabled={busy}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                      <Input
                        label="Teléfono"
                        value={editPhone}
                        disabled={busy}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                      <Select
                        label="Zona"
                        value={editZone}
                        disabled={busy}
                        onChange={(e) => setEditZone(e.target.value)}
                        options={sheetZoneOptions(zoneOptions, editZone)}
                      />
                      <Input
                        label="Iglesia"
                        value={editChurch}
                        disabled={busy}
                        onChange={(e) => setEditChurch(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy || !editName.trim() || !editChurch.trim() || !editZone}
                      onClick={() =>
                        void onPatchRegistration(registration._id, {
                          fullName: editName,
                          rut: editRut,
                          email: editEmail,
                          phone: editPhone,
                          zoneId: editZone,
                          churchName: editChurch,
                        })
                      }
                    >
                      Guardar datos
                    </Button>
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

                <div className="flex flex-wrap items-end gap-3">
                  <p className="text-muted">
                    Previsto: {expectedDaysText(registration.expectedDays)}
                  </p>
                  {operate ? (
                    <Select
                      className="min-w-[10rem]"
                      label="Días previstos"
                      value={expectedPreset}
                      onChange={(e) => {
                        const value = e.target.value as typeof expectedPreset;
                        setExpectedPreset(value);
                        const expectedDays =
                          value === "both"
                            ? { saturday: true, sunday: true }
                            : value === "saturday"
                              ? { saturday: true, sunday: false }
                              : value === "sunday"
                                ? { saturday: false, sunday: true }
                                : { saturday: null, sunday: null };
                        void onPatchRegistration(registration._id, { expectedDays });
                      }}
                      options={[
                        { value: "unconfirmed", label: "Por confirmar" },
                        { value: "saturday", label: "Sábado" },
                        { value: "sunday", label: "Domingo" },
                        { value: "both", label: "Ambos" },
                      ]}
                    />
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {(["saturday", "sunday"] as CongressAttendanceDay[]).map((day) => {
                    const present = registration.attendance[day];
                    const markedAt =
                      day === "saturday"
                        ? registration.attendanceMeta?.saturdayMarkedAt
                        : registration.attendanceMeta?.sundayMarkedAt;
                    return (
                      <div
                        key={day}
                        className="rounded-md border border-border bg-background-soft/40 px-3 py-2"
                      >
                        <p className="font-medium">
                          {day === "saturday" ? "Sábado" : "Domingo"}
                        </p>
                        <p className="text-xs text-muted">
                          {present === true
                            ? `Presente${markedAt ? ` · ${formatMarkedAtSantiago(markedAt)}` : ""}`
                            : "Sin llegada"}
                        </p>
                        {operate ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {present !== true ? (
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() =>
                                  void onPatchAttendance(registration._id, day, true)
                                }
                              >
                                Llegada
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void onPatchAttendance(registration._id, day, false)
                              }
                            >
                              Ausente
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                void onPatchAttendance(registration._id, day, null)
                              }
                            >
                              Sin marcar
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {(registration.attendanceHistory ?? []).length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted">Historial</p>
                    <ul className="max-h-24 space-y-1 overflow-y-auto text-xs text-muted">
                      {[...(registration.attendanceHistory ?? [])]
                        .slice()
                        .reverse()
                        .map((h, idx) => (
                          <li key={`${h.at}-${idx}`}>
                            {formatDateTimeSantiago(h.at)} ·{" "}
                            {h.day === "saturday" ? "Sáb" : "Dom"} →{" "}
                            {h.nextPresent === true ? "Presente" : "Sin llegada"}
                            {h.reason ? ` · ${h.reason}` : ""}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "alimentacion" ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Aporte único de {formatClp(CONGRESS_CONTRIBUTION_CLP)} por ambos días.
                </p>
                <p className="text-base font-semibold">{contributionLabel(registration)}</p>
                {registration.allocatedPaidClp > 0 ? (
                  <p className="text-xs text-muted">
                    Imputado {formatClp(registration.allocatedPaidClp)}
                  </p>
                ) : null}
                {canPay && operate && registration.chargeAmountClp != null ? (
                  <div className="space-y-3 rounded-md border border-border p-3">
                    <p className="text-xs font-semibold uppercase text-muted">Pago</p>
                    <div className="grid grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] items-end gap-3">
                      <div>
                        {!adjustCharge ? (
                          <ClpAmountInput
                            label="Monto"
                            value={payAmount}
                            disabled={busy}
                            onValueChange={setPayAmount}
                            onFocus={(event) => {
                              if (payAmount == null || payAmount <= 0) {
                                setPayAmount(CONGRESS_CONTRIBUTION_CLP);
                              }
                              event.currentTarget.select();
                            }}
                            onBlur={() => {
                              if (payAmount != null && payAmount > 0) return;
                              setPayAmount(CONGRESS_CONTRIBUTION_CLP);
                            }}
                          />
                        ) : waiveScope === "part" ? (
                          <ClpAmountInput
                            label="No se cobra"
                            value={waiveAmount}
                            disabled={busy}
                            placeholder=""
                            onValueChange={setWaiveAmount}
                          />
                        ) : (
                          <div className="h-10" />
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-3">
                        {(
                          [
                            ["total", "Exento de pago"],
                            ["part", "Parcial"],
                          ] as const
                        ).map(([scope, label]) => {
                          const selected = adjustCharge && waiveScope === scope;
                          return (
                            <button
                              key={scope}
                              type="button"
                              disabled={busy}
                              className={
                                selected
                                  ? "h-10 flex-1 rounded-md border border-primary bg-primary/10 px-4 text-sm font-semibold text-primary"
                                  : "h-10 flex-1 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground"
                              }
                              onClick={() => {
                                if (selected) {
                                  setAdjustCharge(false);
                                  setChargeReason("");
                                  setReasonOther("");
                                  setWaiveAmount(null);
                                  return;
                                }
                                setAdjustCharge(true);
                                setWaiveScope(scope);
                                setChargeReason("");
                                setReasonOther("");
                                setWaiveAmount(null);
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {adjustCharge ? (
                      <div className="grid grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] items-end gap-3">
                        <div className="col-span-3">
                        <Select
                          label="Motivo"
                          value={chargeReason}
                          disabled={busy}
                          onChange={(event) => setChargeReason(event.target.value)}
                          options={[
                            { value: "", label: "Elija el motivo…" },
                            ...CHARGE_WAIVE_REASONS.map((reason) => ({
                              value: reason,
                              label: reason,
                            })),
                          ]}
                        />
                        </div>
                        {chargeReason === "Otro" ? (
                          <div className="col-span-3">
                            <Input
                              label="Cuál"
                              value={reasonOther}
                              disabled={busy}
                              onChange={(event) => setReasonOther(event.target.value)}
                            />
                          </div>
                        ) : null}
                        <div className="col-start-2 col-span-2 flex gap-3">
                        <Button
                          size="md"
                          variant="outline"
                          className="h-10 flex-1"
                          disabled={busy}
                          onClick={() => {
                            setAdjustCharge(false);
                            setChargeReason("");
                            setReasonOther("");
                            setWaiveAmount(null);
                            setPayAmount(CONGRESS_CONTRIBUTION_CLP);
                          }}
                        >
                          Volver
                        </Button>
                        <Button
                          size="md"
                          className="h-10 flex-1"
                          disabled={
                            busy ||
                            !chargeReason ||
                            (chargeReason === "Otro" && !reasonOther.trim()) ||
                            (waiveScope === "part" &&
                              !(
                                waiveAmount != null &&
                                waiveAmount > 0 &&
                                waiveAmount < remainingBalanceClp(registration)
                              ))
                          }
                          onClick={() => {
                            const reason =
                              chargeReason === "Otro"
                                ? `Otro: ${reasonOther.trim()}`
                                : chargeReason;
                            const clearsAll =
                              waiveScope === "total" && registration.allocatedPaidClp <= 0;
                            void onChargeChange({
                              registrationId: registration._id,
                              action: clearsAll ? "exempt" : "reduce",
                              reason,
                              waiveClp: clearsAll
                                ? undefined
                                : waiveScope === "total"
                                  ? remainingBalanceClp(registration)
                                  : waiveAmount ?? undefined,
                            }).then(() => {
                              setChargeReason("");
                              setReasonOther("");
                              setWaiveAmount(null);
                              setAdjustCharge(false);
                            });
                          }}
                        >
                          Guardar
                        </Button>
                        </div>
                      </div>
                    ) : null}
                    {!adjustCharge ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Input
                            label="Pagador"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            placeholder={registration.identity.fullName}
                          />
                        </div>
                        <Select
                          label="Tipo"
                          value={payMethod}
                          onChange={(e) =>
                            setPayMethod(e.target.value as CongressPaymentMethod)
                          }
                          options={[
                            { value: "cash", label: "Efectivo" },
                            { value: "transfer", label: "Transferencia" },
                            { value: "other", label: "Otro" },
                          ]}
                        />
                        <Input
                          label="Fecha de pago"
                          type="date"
                          value={paidOn}
                          onChange={(e) => setPaidOn(e.target.value)}
                        />
                        <div className="col-span-2">
                          <Input
                            label="Referencia"
                            value={receiptRef}
                            onChange={(e) => setReceiptRef(e.target.value)}
                          />
                        </div>
                        <div>
                          <Button
                            size="sm"
                            disabled={busy || adjustCharge}
                            onClick={() => {
                              const amount = payAmount ?? 0;
                              if (!amount) return;
                              void onIndividualPayment({
                                registrationId: registration._id,
                                amountClp: amount,
                                payerName:
                                  payerName.trim() || registration.identity.fullName,
                                method: payMethod,
                                paidOn,
                                receiptRef: receiptRef.trim() || undefined,
                              }).then(() => {
                                setReceiptRef("");
                              });
                            }}
                          >
                            Registrar pago
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {lastReceiptPayment && lastReceiptBelongsToRegistration ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onDownloadReceipt(lastReceiptPayment)}
                  >
                    Descargar comprobante
                  </Button>
                ) : null}
                {relatedPayments.length > 0 ? (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <p className="text-xs font-semibold uppercase text-muted">
                      Comprobantes
                    </p>
                    <ul className="space-y-2">
                      {relatedPayments.map((payment) => {
                        const allocation = payment.allocations.find(
                          (row) => row.registrationId === registration._id
                        );
                        return (
                          <li
                            key={payment._id}
                            className="flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <p className="font-medium">
                                {payment.folio ?? "Sin folio"} ·{" "}
                                {formatClp(allocation?.amountClp ?? payment.amountClp)}
                              </p>
                              <p className="text-xs text-muted">
                                {payment.paidOn ?? payment.createdAt.slice(0, 10)} ·{" "}
                                {payment.status}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onDownloadReceipt(payment)}
                            >
                              Comprobante
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                {operate &&
                (isExplicitlyExempt(registration) ||
                  (registration.chargeAmountClp != null &&
                    registration.chargeAmountClp < CONGRESS_CONTRIBUTION_CLP)) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    disabled={busy}
                    onClick={() => {
                      void onChargeChange({
                        registrationId: registration._id,
                        action: "restore",
                        reason: "Vuelve a cobrar",
                      });
                    }}
                  >
                    Restaurar aporte {formatClp(CONGRESS_CONTRIBUTION_CLP)}
                  </Button>
                ) : null}
                {(registration.chargeHistory ?? []).length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted">
                      Historial de cargo
                    </p>
                    <ul className="max-h-24 space-y-1 overflow-y-auto text-xs text-muted">
                      {[...(registration.chargeHistory ?? [])]
                        .slice()
                        .reverse()
                        .map((h, idx) => (
                          <li key={`${h.at}-${idx}`}>
                            {formatDateTimeSantiago(h.at)} · {chargeHistoryLabel(h)}
                            {h.reason ? ` · ${h.reason}` : ""}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "alojamiento" ? (
              <div className="space-y-3">
                <p className="text-base font-semibold">
                  {lodging ? lodgingLabel(lodging) : "—"}
                </p>
                <p className="text-xs text-muted">
                  Noches disponibles: Viernes 20, Sábado 21 o <strong>ambos días</strong>.
                </p>
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

          <p className="border-t border-border pt-3 text-xs text-muted">
            RUT {registration.identity.rut || "—"} · Correo{" "}
            {registration.identity.email || "—"} · Origen {registration.source} · Tel.{" "}
            {registration.identity.phone || "—"}
          </p>
        </div>
      )}
    </Dialog>
  );
}
