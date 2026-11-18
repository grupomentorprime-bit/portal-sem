"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/admin/kit";
import { ClpAmountInput } from "@/components/admin/congress/ClpAmountInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_CONTRIBUTION_CLP, CONGRESS_NIGHTS } from "@/core/congress/constants";
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
  registrationNeedsHnoPrefix,
  registrationRoleBadges,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";
import { Checkbox } from "@/components/ui/checkbox";
import { isExplicitlyExempt } from "@/core/congress/charge";
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
    action: "exempt" | "restore";
    reason: string;
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
  const [homeId, setHomeId] = useState("");
  const [night, setNight] = useState<string>(NIGHT_BOTH);
  const [expectedPreset, setExpectedPreset] = useState<
    "unconfirmed" | "saturday" | "sunday" | "both"
  >("unconfirmed");

  useEffect(() => {
    if (!registration || !open) return;
    setTab("asistencia");
    setPayerName(registration.identity.fullName);
    setPayMethod("cash");
    setPaidOn(todayPaidOnSantiago());
    setReceiptRef("");
    setChargeReason("");
    setHomeId("");
    setNight(NIGHT_BOTH);
    setExpectedPreset(expectedPresetFromReg(registration));
  }, [open, registration?._id]);

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
                  <div className="space-y-2 rounded-md border border-border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Nombre y roles
                    </p>
                    <p className="text-sm text-foreground">
                      {registrationDisplayName(registration)}
                    </p>
                    {registrationNeedsHnoPrefix(registration) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void onPatchRegistration(registration._id, {
                            ensureHnoPrefix: true,
                          })
                        }
                      >
                        Agregar prefijo Hno
                      </Button>
                    ) : (
                      <p className="text-xs text-muted">
                        Nombre con Hno (pastor también se muestra como Hno).
                      </p>
                    )}
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

                <p className="text-xs text-muted">
                  {formDisplay?.at && formDisplay.label
                    ? `${formDisplay.label} · ${formatDateTimeSantiago(formDisplay.at)}`
                    : "Sin formulario"}
                </p>

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
                  Aporte único de {formatClp(CONGRESS_CONTRIBUTION_CLP)} por ambos días; no
                  cambia según el día de llegada.
                </p>
                <p className="text-base font-semibold">{contributionLabel(registration)}</p>
                <p className="text-muted">
                  Cargo{" "}
                  {registration.chargeAmountClp != null
                    ? formatClp(registration.chargeAmountClp)
                    : "—"}{" "}
                  · Imputado {formatClp(registration.allocatedPaidClp)}
                </p>
                {canPay && operate && registration.chargeAmountClp != null ? (
                  <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                    <p className="sm:col-span-2 text-xs font-semibold uppercase text-muted">
                      Pago individual
                    </p>
                    <Input
                      label="Pagador"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder={registration.identity.fullName}
                    />
                    <ClpAmountInput
                      label="Monto"
                      value={payAmount}
                      onValueChange={setPayAmount}
                      placeholder={formatClpInput(CONGRESS_CONTRIBUTION_CLP)}
                    />
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
                    <Input
                      className="sm:col-span-2"
                      label="Referencia"
                      value={receiptRef}
                      onChange={(e) => setReceiptRef(e.target.value)}
                    />
                    <div className="sm:col-span-2">
                      <Button
                        size="sm"
                        disabled={busy}
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
                {operate ? (
                  <div className="grid gap-2 rounded-md border border-border p-3">
                    <p className="text-xs font-semibold uppercase text-muted">
                      Exención de aporte
                    </p>
                    <Input
                      label="Motivo"
                      value={chargeReason}
                      onChange={(e) => setChargeReason(e.target.value)}
                      placeholder="Invitado, staff, cortesía…"
                    />
                    {registration.chargeAmountClp != null ? (
                      registration.allocatedPaidClp > 0 ? (
                        <p className="text-xs text-muted">
                          Anule los pagos imputados antes de marcar exento.
                        </p>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || !chargeReason.trim()}
                          onClick={() => {
                            void onChargeChange({
                              registrationId: registration._id,
                              action: "exempt",
                              reason: chargeReason.trim(),
                            }).then(() => setChargeReason(""));
                          }}
                        >
                          Marcar exento de pago
                        </Button>
                      )
                    ) : null}
                    {isExplicitlyExempt(registration) ? (
                      <Button
                        size="sm"
                        disabled={busy || !chargeReason.trim()}
                        onClick={() => {
                          void onChargeChange({
                            registrationId: registration._id,
                            action: "restore",
                            reason: chargeReason.trim(),
                          }).then(() => setChargeReason(""));
                        }}
                      >
                        Restaurar aporte {formatClp(CONGRESS_CONTRIBUTION_CLP)}
                      </Button>
                    ) : null}
                  </div>
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
                            {formatDateTimeSantiago(h.at)} ·{" "}
                            {h.action === "exempt" ? "Exento" : "Restaurado"}
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
