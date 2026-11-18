"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_CONTRIBUTION_CLP, CONGRESS_NIGHTS } from "@/core/congress/constants";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressLodgingNeed,
  CongressRegistration,
} from "@/core/congress/types";
import {
  contributionLabel,
  expectedDaysText,
  formatClp,
  formatDateTimeSantiago,
  formatLodgingNightLabel,
  formatMarkedAtSantiago,
  formatZoneLabel,
  lodgingLabel,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";
import { remainingBalanceClp } from "@/core/congress/charges";
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
    }
  ) => Promise<void>;
  onIndividualPayment: (input: {
    registrationId: string;
    amountClp: number;
    payerName: string;
    receiptRef?: string;
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
  onAssignBed,
  onAssignmentAction,
  busy,
}: Props) {
  const [tab, setTab] = useState<SheetTab>("asistencia");
  const [payAmount, setPayAmount] = useState(String(CONGRESS_CONTRIBUTION_CLP));
  const [payerName, setPayerName] = useState("");
  const [receiptRef, setReceiptRef] = useState("");
  const [homeId, setHomeId] = useState("");
  const [night, setNight] = useState<string>(NIGHT_BOTH);
  const [expectedPreset, setExpectedPreset] = useState<
    "unconfirmed" | "saturday" | "sunday" | "both"
  >("unconfirmed");

  useEffect(() => {
    if (!registration || !open) return;
    setTab("asistencia");
    setPayerName(registration.identity.fullName);
    setReceiptRef("");
    setHomeId("");
    setNight(NIGHT_BOTH);
    setExpectedPreset(expectedPresetFromReg(registration));
  }, [open, registration?._id]);

  useEffect(() => {
    if (!registration || !open) return;
    const balance = remainingBalanceClp(registration);
    setPayAmount(
      String(
        balance > 0
          ? balance
          : registration.chargeAmountClp ?? CONGRESS_CONTRIBUTION_CLP
      )
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

  const selectedHomeAvailability = useMemo(
    () => homeAvailability.find((row) => row.home._id === homeId) ?? null,
    [homeAvailability, homeId]
  );

  const title = registration?.identity.fullName ?? "Participante";
  const description = registration
    ? `${registration.churchName} · ${formatZoneLabel(registration.zoneId)}`
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
                    <Input
                      label="Monto"
                      inputMode="numeric"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={String(CONGRESS_CONTRIBUTION_CLP)}
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
                          const amount = Number(payAmount.replace(/\D/g, ""));
                          if (!amount) return;
                          void onIndividualPayment({
                            registrationId: registration._id,
                            amountClp: amount,
                            payerName:
                              payerName.trim() || registration.identity.fullName,
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
                        ...homeAvailability.map(
                          ({ home, friFree, satFree, friCap, satCap }) => {
                            const freeLabel =
                              night === NIGHT_BOTH
                                ? `libres vie ${friFree}/${friCap} · sáb ${satFree}/${satCap}`
                                : night === CONGRESS_NIGHTS[0]
                                  ? `libres ${friFree}/${friCap}`
                                  : `libres ${satFree}/${satCap}`;
                            const care = home.notes?.trim() ? " · cuidados" : "";
                            return {
                              value: home._id,
                              label: `${home.name} · ${freeLabel}${care}`,
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
