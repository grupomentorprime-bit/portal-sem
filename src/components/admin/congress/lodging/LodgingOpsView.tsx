"use client";

import { useMemo, useState } from "react";
import { AlertBanner, EmptyState, Section } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONGRESS_NIGHTS } from "@/core/congress/constants";
import { isLodgingPending } from "@/core/congress/lodging-status";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "@/core/congress/types";
import {
  formatLodgingNightLabel,
  formatZoneLabel,
  lodgingLabel,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";
import { cn } from "@/lib/utils";

type Props = {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
  churchRequestedBeds: number;
  operate: boolean;
  homeSaving: boolean;
  onCreateHome: (input: {
    name: string;
    contactName?: string;
    address?: string;
    notes?: string;
    capFri: number;
    capSat: number;
  }) => Promise<void>;
  onOpenParticipant: (id: string) => void;
};

function occupiedFor(homeId: string, night: string, assignments: CongressLodgingAssignment[]) {
  return assignments.filter(
    (a) =>
      a.homeId === homeId &&
      a.night === night &&
      a.status !== "cancelled" &&
      (a.status === "assigned" || a.status === "confirmed" || a.confirmed)
  ).length;
}

export function LodgingOpsView({
  homes,
  assignments,
  registrations,
  churchRequestedBeds,
  operate,
  homeSaving,
  onCreateHome,
  onOpenParticipant,
}: Props) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [capFri, setCapFri] = useState("0");
  const [capSat, setCapSat] = useState("0");

  const peopleNeeding = useMemo(() => {
    return registrations
      .map((reg) => {
        const state = resolveRegistrationLodging(reg, assignments);
        return { reg, state };
      })
      .filter(({ state }) => state.status !== "none");
  }, [assignments, registrations]);

  const pendingPeople = useMemo(
    () => peopleNeeding.filter(({ state }) => isLodgingPending(state)),
    [peopleNeeding]
  );

  const assignedPeople = useMemo(
    () =>
      peopleNeeding.filter(
        ({ state }) => state.status === "assigned" || state.status === "confirmed"
      ),
    [peopleNeeding]
  );

  const totalsByNight = useMemo(() => {
    return CONGRESS_NIGHTS.map((night) => {
      const capacity = homes.reduce(
        (sum, h) => sum + (h.capacityByNight[night] ?? 0),
        0
      );
      const used = homes.reduce(
        (sum, h) => sum + occupiedFor(h._id, night, assignments),
        0
      );
      return {
        night,
        capacity,
        used,
        free: Math.max(0, capacity - used),
      };
    });
  }, [assignments, homes]);

  return (
    <div className="space-y-5">
      <AlertBanner variant="info">
        Cupos confirmados por hogar y noche. Use las notas de cuidado (escaleras, piso, mascotas,
        etc.) al asignar. Quien llega sin cama aparece en “Falta asignar”.
      </AlertBanner>

      <div className="rounded-lg border border-border bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Cupos del evento
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Requieren / pendientes</p>
            <p className="text-xl font-semibold tabular-nums">
              {peopleNeeding.length} / {pendingPeople.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Con asignación</p>
            <p className="text-xl font-semibold tabular-nums">{assignedPeople.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Demanda iglesias (referencia)</p>
            <p className="text-xl font-semibold tabular-nums">{churchRequestedBeds}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Hogares</p>
            <p className="text-xl font-semibold tabular-nums">{homes.length}</p>
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Noche</th>
                <th className="px-3 py-2">Cupo confirmado</th>
                <th className="px-3 py-2">Asignados</th>
                <th className="px-3 py-2">Libres</th>
              </tr>
            </thead>
            <tbody>
              {totalsByNight.map((row) => (
                <tr key={row.night} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">
                    {formatLodgingNightLabel(row.night)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.capacity}</td>
                  <td className="px-3 py-2 tabular-nums">{row.used}</td>
                  <td
                    className={cn(
                      "px-3 py-2 tabular-nums font-semibold",
                      row.free === 0
                        ? "text-[var(--color-warning)]"
                        : "text-foreground"
                    )}
                  >
                    {row.free}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Section
        title="Hogares y capacidad"
        description="Cada hogar declara cupos por noche y notas de cuidado para la asignación."
      >
        {operate ? (
          <form
            className="mb-4 grid max-w-3xl gap-2 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              void onCreateHome({
                name: name.trim(),
                contactName: contactName.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
                capFri: Number(capFri) || 0,
                capSat: Number(capSat) || 0,
              }).then(() => {
                setName("");
                setContactName("");
                setAddress("");
                setNotes("");
                setCapFri("0");
                setCapSat("0");
              });
            }}
          >
            <Input
              label="Nombre del hogar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Contacto"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              label="Cupo viernes 20"
              inputMode="numeric"
              value={capFri}
              onChange={(e) => setCapFri(e.target.value)}
            />
            <Input
              label="Cupo sábado 21"
              inputMode="numeric"
              value={capSat}
              onChange={(e) => setCapSat(e.target.value)}
            />
            <Input
              className="sm:col-span-2"
              label="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              className="sm:col-span-2"
              label="Notas / cuidados"
              placeholder="Ej. solo primer piso; no apto para silla de ruedas; hay mascota…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" loading={homeSaving}>
                Registrar hogar con cupos
              </Button>
            </div>
          </form>
        ) : null}

        {homes.length === 0 ? (
          <EmptyState
            title="Sin hogares"
            description="Registre hogares con cupos confirmados para empezar a asignar."
          />
        ) : (
          <ul className="space-y-3">
            {homes.map((home) => {
              const friCap = home.capacityByNight[CONGRESS_NIGHTS[0]] ?? 0;
              const satCap = home.capacityByNight[CONGRESS_NIGHTS[1]] ?? 0;
              const friUsed = occupiedFor(home._id, CONGRESS_NIGHTS[0], assignments);
              const satUsed = occupiedFor(home._id, CONGRESS_NIGHTS[1], assignments);
              return (
                <li
                  key={home._id}
                  className="rounded-lg border border-border bg-white px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{home.name}</p>
                      <p className="text-xs text-muted">
                        {[home.contactName, home.address].filter(Boolean).join(" · ") ||
                          "Sin contacto / dirección"}
                      </p>
                    </div>
                    <div className="text-right text-xs tabular-nums text-muted">
                      <p>
                        Vie: {friUsed}/{friCap} · libres {Math.max(0, friCap - friUsed)}
                      </p>
                      <p>
                        Sáb: {satUsed}/{satCap} · libres {Math.max(0, satCap - satUsed)}
                      </p>
                    </div>
                  </div>
                  {home.notes?.trim() ? (
                    <p className="mt-2 rounded-md border border-[color-mix(in_srgb,var(--color-warning)_30%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_8%,white)] px-3 py-2 text-xs text-foreground">
                      <span className="font-semibold">Cuidados: </span>
                      {home.notes}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">
                      Sin notas de cuidado. Agréguelas al crear/editar el hogar.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section
        title="Falta asignar"
        description="Participantes con necesidad de alojamiento aún sin cama confirmada/asignada."
      >
        {pendingPeople.length === 0 ? (
          <EmptyState title="Nadie pendiente de cama" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-white">
            {pendingPeople.map(({ reg, state }) => (
              <li key={reg._id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-background-soft"
                  onClick={() => onOpenParticipant(reg._id)}
                >
                  <span>
                    <span className="font-medium text-foreground">
                      {reg.identity.fullName}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {reg.churchName} · {formatZoneLabel(reg.zoneId)} ·{" "}
                      {lodgingLabel(state)}
                      {state.pendingReason === "unknown"
                        ? " (necesidad por confirmar)"
                        : state.pendingReason === "unassigned"
                          ? " (sin hogar)"
                          : state.pendingReason === "unconfirmed"
                            ? " (asignado, falta confirmar)"
                            : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    Abrir ficha
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
