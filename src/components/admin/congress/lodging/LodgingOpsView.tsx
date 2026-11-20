"use client";

import { useMemo, useState } from "react";
import { AlertBanner, Dialog, EmptyState, Section } from "@/components/admin/kit";
import { ConfirmDialog } from "@/components/admin/kit/dialogs/ConfirmDialog";
import { ChilePhoneInput } from "@/components/portal/experience/forms/ChilePhoneInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  registrationDisplayName,
  resolveRegistrationLodging,
} from "@/components/admin/congress/labels";
import {
  CHILE_PHONE_INVALID_MESSAGE,
  isValidChilePhone,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";
import { cn } from "@/lib/utils";

function homeContactLabel(home: CongressLodgingHome): string {
  const phone = home.contactPhone?.trim();
  const name = home.contactName?.trim();
  if (phone && name) return `${name} · ${phone}`;
  return phone || name || "";
}

function validateContactPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return isValidChilePhone(trimmed) ? null : CHILE_PHONE_INVALID_MESSAGE;
}

function parseBedCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

function validateHomeCapacity(
  capFriRaw: string,
  capSatRaw: string,
  differentByNight: boolean
): string | null {
  if (!differentByNight) {
    const beds = parseBedCount(capFriRaw);
    if (beds == null) {
      return "Indique el número de camas (cupos) del hogar.";
    }
    if (beds === 0) {
      return "El hogar debe tener al menos 1 cama.";
    }
    return null;
  }
  const capFri = parseBedCount(capFriRaw);
  const capSat = parseBedCount(capSatRaw);
  if (capFri == null || capSat == null) {
    return "Indique el número de camas (cupos) para viernes y sábado.";
  }
  if (capFri === 0 && capSat === 0) {
    return "El hogar debe tener al menos 1 cama en alguna noche.";
  }
  return null;
}

function resolveCapacityValues(
  capFriRaw: string,
  capSatRaw: string,
  differentByNight: boolean
): { capFri: number; capSat: number } {
  if (!differentByNight) {
    const beds = parseBedCount(capFriRaw) ?? 0;
    return { capFri: beds, capSat: beds };
  }
  return {
    capFri: parseBedCount(capFriRaw) ?? 0,
    capSat: parseBedCount(capSatRaw) ?? 0,
  };
}

type HomeFormInput = {
  name: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  capFri: number;
  capSat: number;
};

type Props = {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
  churchRequestedBeds: number;
  operate: boolean;
  homeSaving: boolean;
  onCreateHome: (input: HomeFormInput) => Promise<boolean>;
  onUpdateHome: (homeId: string, input: HomeFormInput) => Promise<boolean>;
  onDeleteHome: (homeId: string) => Promise<boolean>;
  onOpenParticipant: (id: string) => void;
};

function HomeDeleteButton({
  assigned,
  disabled,
  onDelete,
}: {
  assigned: boolean;
  disabled?: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={assigned || disabled}
        title={assigned ? "Este hogar ya tiene hermanos asignados" : undefined}
        onClick={onDelete}
      >
        Eliminar
      </Button>
      {assigned ? (
        <p className="max-w-56 text-right text-xs text-muted">
          No se puede eliminar: ya tiene hermanos asignados.
        </p>
      ) : null}
    </div>
  );
}

function occupiedFor(homeId: string, night: string, assignments: CongressLodgingAssignment[]) {
  return assignments.filter(
    (a) =>
      a.homeId === homeId &&
      a.night === night &&
      a.status !== "cancelled" &&
      (a.status === "assigned" || a.status === "confirmed" || a.confirmed)
  ).length;
}

function HomeFields({
  name,
  setName,
  contactPhone,
  setContactPhone,
  address,
  setAddress,
  notes,
  setNotes,
  capFri,
  setCapFri,
  capSat,
  setCapSat,
  differentByNight,
  setDifferentByNight,
  disabled,
  nameError,
  contactPhoneError,
  capacityError,
}: {
  name: string;
  setName: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  capFri: string;
  setCapFri: (v: string) => void;
  capSat: string;
  setCapSat: (v: string) => void;
  differentByNight: boolean;
  setDifferentByNight: (v: boolean) => void;
  disabled?: boolean;
  nameError?: string | null;
  contactPhoneError?: string | null;
  capacityError?: string | null;
}) {
  return (
    <>
      <Input
        label="Nombre familia / jefe de hogar"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={disabled}
        error={nameError ?? undefined}
        helper="Ej. Familia González o Juan González"
      />
      <ChilePhoneInput
        label="Teléfono familia / jefe de hogar"
        name="contactPhone"
        value={contactPhone}
        onChange={setContactPhone}
        disabled={disabled}
        error={contactPhoneError ?? undefined}
        helper="Teléfono de contacto de la familia o jefe de hogar (formato Chile)"
      />
      {differentByNight ? (
        <>
          <Input
            label="N.º de camas viernes 20"
            helper="Cupo confirmado de camas esa noche"
            inputMode="numeric"
            min={0}
            step={1}
            value={capFri}
            onChange={(e) => setCapFri(e.target.value)}
            required
            disabled={disabled}
            error={capacityError ?? undefined}
          />
          <Input
            label="N.º de camas sábado 21"
            helper="Cupo confirmado de camas esa noche"
            inputMode="numeric"
            min={0}
            step={1}
            value={capSat}
            onChange={(e) => setCapSat(e.target.value)}
            required
            disabled={disabled}
          />
        </>
      ) : (
        <Input
          className="sm:col-span-2"
          label="N.º de camas"
          helper="Mismo cupo confirmado para viernes 20 y sábado 21"
          inputMode="numeric"
          min={0}
          step={1}
          value={capFri}
          onChange={(e) => {
            const next = e.target.value;
            setCapFri(next);
            setCapSat(next);
          }}
          required
          disabled={disabled}
          error={capacityError ?? undefined}
        />
      )}
      <div className="sm:col-span-2">
        <Checkbox
          label="Cupos distintos por noche"
          description="Marque solo si el hogar ofrece distinta cantidad de camas el viernes y el sábado."
          checked={differentByNight}
          disabled={disabled}
          onChange={(e) => {
            const checked = e.target.checked;
            setDifferentByNight(checked);
            if (!checked) {
              setCapSat(capFri);
            }
          }}
        />
      </div>
      <Input
        className="sm:col-span-2"
        label="Dirección"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        disabled={disabled}
      />
      <Textarea
        className="sm:col-span-2"
        label="Notas / cuidados"
        placeholder="Ej. solo primer piso; no apto para silla de ruedas; hay mascota…"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={disabled}
      />
    </>
  );
}

export function LodgingOpsView({
  homes,
  assignments,
  registrations,
  churchRequestedBeds,
  operate,
  homeSaving,
  onCreateHome,
  onUpdateHome,
  onDeleteHome,
  onOpenParticipant,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [capFri, setCapFri] = useState("");
  const [capSat, setCapSat] = useState("");
  const [createDifferentByNight, setCreateDifferentByNight] = useState(false);
  const [createNameError, setCreateNameError] = useState<string | null>(null);
  const [createContactPhoneError, setCreateContactPhoneError] = useState<string | null>(
    null
  );
  const [createCapacityError, setCreateCapacityError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCapFri, setEditCapFri] = useState("0");
  const [editCapSat, setEditCapSat] = useState("0");
  const [editDifferentByNight, setEditDifferentByNight] = useState(false);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [editContactPhoneError, setEditContactPhoneError] = useState<string | null>(
    null
  );
  const [editCapacityError, setEditCapacityError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CongressLodgingHome | null>(null);

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

  const homesWithAvailability = useMemo(() => {
    const fri = CONGRESS_NIGHTS[0];
    const sat = CONGRESS_NIGHTS[1];
    return homes
      .map((home) => {
        const friCap = home.capacityByNight[fri] ?? 0;
        const satCap = home.capacityByNight[sat] ?? 0;
        const friUsed = occupiedFor(home._id, fri, assignments);
        const satUsed = occupiedFor(home._id, sat, assignments);
        const friFree = Math.max(0, friCap - friUsed);
        const satFree = Math.max(0, satCap - satUsed);
        const totalFree = friFree + satFree;
        return {
          home,
          friCap,
          satCap,
          friUsed,
          satUsed,
          friFree,
          satFree,
          totalFree,
          isFull: totalFree === 0,
        };
      })
      .sort((a, b) => {
        if (a.isFull !== b.isFull) return a.isFull ? 1 : -1;
        if (b.totalFree !== a.totalFree) return b.totalFree - a.totalFree;
        return a.home.name.localeCompare(b.home.name, "es");
      });
  }, [assignments, homes]);

  const homesWithFree = homesWithAvailability.filter((row) => !row.isFull);
  const homesFull = homesWithAvailability.filter((row) => row.isFull);

  const resetCreateForm = () => {
    setName("");
    setContactPhone("");
    setAddress("");
    setNotes("");
    setCapFri("");
    setCapSat("");
    setCreateDifferentByNight(false);
    setCreateNameError(null);
    setCreateContactPhoneError(null);
    setCreateCapacityError(null);
  };

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (homeSaving) return;
    setCreateOpen(false);
    resetCreateForm();
  };

  const startEdit = (home: CongressLodgingHome) => {
    const fri = home.capacityByNight[CONGRESS_NIGHTS[0]] ?? 0;
    const sat = home.capacityByNight[CONGRESS_NIGHTS[1]] ?? 0;
    const existingPhone =
      home.contactPhone?.trim() ||
      (home.contactName && isValidChilePhone(home.contactName)
        ? home.contactName
        : "") ||
      "";
    setEditingId(home._id);
    setEditName(home.name);
    setEditContactPhone(
      normalizeChilePhone(existingPhone) ?? existingPhone
    );
    setEditAddress(home.address ?? "");
    setEditNotes(home.notes ?? "");
    setEditCapFri(String(fri));
    setEditCapSat(String(sat));
    setEditDifferentByNight(fri !== sat);
    setEditNameError(null);
    setEditContactPhoneError(null);
    setEditCapacityError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDifferentByNight(false);
    setEditNameError(null);
    setEditContactPhoneError(null);
    setEditCapacityError(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const homeId = pendingDelete._id;
    void onDeleteHome(homeId).then((ok) => {
      if (!ok) return;
      if (editingId === homeId) cancelEdit();
      setPendingDelete(null);
    });
  };

  const submitCreate = () => {
    setCreateNameError(null);
    setCreateContactPhoneError(null);
    setCreateCapacityError(null);
    if (!name.trim()) {
      setCreateNameError("El nombre de la familia o jefe de hogar es obligatorio.");
      return;
    }
    const phoneError = validateContactPhone(contactPhone);
    if (phoneError) {
      setCreateContactPhoneError(phoneError);
      return;
    }
    const capacityError = validateHomeCapacity(
      capFri,
      capSat,
      createDifferentByNight
    );
    if (capacityError) {
      setCreateCapacityError(capacityError);
      return;
    }
    const caps = resolveCapacityValues(capFri, capSat, createDifferentByNight);
    const normalizedPhone = contactPhone.trim()
      ? normalizeChilePhone(contactPhone) ?? undefined
      : undefined;
    if (contactPhone.trim() && !normalizedPhone) {
      setCreateContactPhoneError(validateContactPhone(contactPhone) ?? "Teléfono inválido.");
      return;
    }
    void onCreateHome({
      name: name.trim(),
      contactPhone: normalizedPhone,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      capFri: caps.capFri,
      capSat: caps.capSat,
    }).then((ok) => {
      if (ok) {
        setCreateOpen(false);
        resetCreateForm();
      }
    });
  };

  const submitEdit = (homeId: string) => {
    setEditNameError(null);
    setEditContactPhoneError(null);
    setEditCapacityError(null);
    if (!editName.trim()) {
      setEditNameError("El nombre de la familia o jefe de hogar es obligatorio.");
      return;
    }
    const phoneError = validateContactPhone(editContactPhone);
    if (phoneError) {
      setEditContactPhoneError(phoneError);
      return;
    }
    const capacityError = validateHomeCapacity(
      editCapFri,
      editCapSat,
      editDifferentByNight
    );
    if (capacityError) {
      setEditCapacityError(capacityError);
      return;
    }
    const caps = resolveCapacityValues(
      editCapFri,
      editCapSat,
      editDifferentByNight
    );
    const normalizedPhone = editContactPhone.trim()
      ? normalizeChilePhone(editContactPhone) ?? undefined
      : undefined;
    if (editContactPhone.trim() && !normalizedPhone) {
      setEditContactPhoneError(validateContactPhone(editContactPhone) ?? "Teléfono inválido.");
      return;
    }
    const existing = homes.find((h) => h._id === homeId);
    const legacyName = existing?.contactName?.trim();
    const contactNameToKeep =
      legacyName && !isValidChilePhone(legacyName) ? legacyName : undefined;
    void onUpdateHome(homeId, {
      name: editName.trim(),
      contactName: contactNameToKeep,
      contactPhone: normalizedPhone,
      address: editAddress.trim() || undefined,
      notes: editNotes.trim() || undefined,
      capFri: caps.capFri,
      capSat: caps.capSat,
    }).then((ok) => {
      if (ok) cancelEdit();
    });
  };

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

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            ¿Qué hogar tiene cupos libres?
          </p>
          {homes.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Aún no hay hogares registrados. Agréguelos abajo para ver cupos por hogar.
            </p>
          ) : homesWithFree.length === 0 ? (
            <p className="mt-2 text-sm font-medium text-[var(--color-warning)]">
              Ningún hogar tiene cupos libres (todos completos).
            </p>
          ) : (
            <div className="mt-2 overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-background-soft text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Familia / jefe de hogar</th>
                    <th className="px-3 py-2">Libres vie 20</th>
                    <th className="px-3 py-2">Libres sáb 21</th>
                    <th className="px-3 py-2">Tel. familia / jefe</th>
                  </tr>
                </thead>
                <tbody>
                  {homesWithFree.map((row) => (
                    <tr key={row.home._id} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold text-foreground">
                        {row.home.name}
                        {row.home.notes?.trim() ? (
                          <span className="mt-0.5 block text-xs font-normal text-muted">
                            Cuidados: {row.home.notes}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 tabular-nums font-semibold",
                          row.friFree === 0
                            ? "text-[var(--color-warning)]"
                            : "text-foreground"
                        )}
                      >
                        {row.friFree}
                        <span className="font-normal text-muted"> / {row.friCap}</span>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 tabular-nums font-semibold",
                          row.satFree === 0
                            ? "text-[var(--color-warning)]"
                            : "text-foreground"
                        )}
                      >
                        {row.satFree}
                        <span className="font-normal text-muted"> / {row.satCap}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {[homeContactLabel(row.home), row.home.address]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Section
        title="Hogares y capacidad"
        description="Vea qué hogares aún tienen cupos libres; los completos quedan al final."
        actions={
          operate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              Agregar hogar
            </Button>
          ) : null
        }
      >
        {!operate ? (
          <AlertBanner variant="warning" className="mb-4">
            Su usuario puede ver alojamiento, pero no tiene permiso para registrar hogares.
            Pida a un administrador que active el permiso de operar el congreso.
          </AlertBanner>
        ) : null}

        {homes.length === 0 ? (
          <EmptyState
            title="Sin hogares"
            description={
              operate
                ? "Agregue un hogar e indique cuántas camas (cupos) tiene por noche."
                : "Cuando un operador registre hogares con cupos, aparecerán aquí."
            }
            action={
              operate
                ? {
                    label: "Agregar hogar",
                    onClick: openCreate,
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Hogares con cupos libres ({homesWithFree.length})
              </p>
              {homesWithFree.length === 0 ? (
                <EmptyState
                  title="Sin cupos libres"
                  description="Todos los hogares están completos para ambas noches."
                />
              ) : (
                <ul className="space-y-3">
                  {homesWithFree.map((row) => {
                    const { home } = row;
                    const isEditing = editingId === home._id;
                    return (
                      <li
                        key={home._id}
                        className="rounded-lg border border-border bg-white px-4 py-3 text-sm"
                      >
                        {isEditing ? (
                          <form
                            className="grid max-w-3xl gap-2 sm:grid-cols-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              submitEdit(home._id);
                            }}
                          >
                            <p className="sm:col-span-2 text-sm font-semibold text-foreground">
                              Editar hogar
                            </p>
                            <HomeFields
                              name={editName}
                              setName={setEditName}
                              contactPhone={editContactPhone}
                              setContactPhone={(v) => {
                                setEditContactPhone(v);
                                setEditContactPhoneError(null);
                              }}
                              address={editAddress}
                              setAddress={setEditAddress}
                              notes={editNotes}
                              setNotes={setEditNotes}
                              capFri={editCapFri}
                              setCapFri={(v) => {
                                setEditCapFri(v);
                                setEditCapacityError(null);
                              }}
                              capSat={editCapSat}
                              setCapSat={(v) => {
                                setEditCapSat(v);
                                setEditCapacityError(null);
                              }}
                              differentByNight={editDifferentByNight}
                              setDifferentByNight={(v) => {
                                setEditDifferentByNight(v);
                                setEditCapacityError(null);
                              }}
                              disabled={homeSaving}
                              nameError={editNameError}
                              contactPhoneError={editContactPhoneError}
                              capacityError={editCapacityError}
                            />
                            <div className="flex flex-wrap items-start justify-between gap-2 sm:col-span-2">
                              <HomeDeleteButton
                                assigned={row.friUsed + row.satUsed > 0}
                                disabled={homeSaving}
                                onDelete={() => setPendingDelete(home)}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button type="submit" size="sm" loading={homeSaving}>
                                  Guardar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={homeSaving}
                                  onClick={cancelEdit}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-foreground">{home.name}</p>
                                <p className="text-xs text-muted">
                                  {[homeContactLabel(home), home.address]
                                    .filter(Boolean)
                                    .join(" · ") || "Sin contacto / dirección"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="text-right text-xs tabular-nums">
                                  <p>
                                    <span className="text-muted">
                                      Vie: {row.friUsed}/{row.friCap} camas ·{" "}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-semibold",
                                        row.friFree === 0
                                          ? "text-[var(--color-warning)]"
                                          : "text-foreground"
                                      )}
                                    >
                                      libres {row.friFree}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-muted">
                                      Sáb: {row.satUsed}/{row.satCap} camas ·{" "}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-semibold",
                                        row.satFree === 0
                                          ? "text-[var(--color-warning)]"
                                          : "text-foreground"
                                      )}
                                    >
                                      libres {row.satFree}
                                    </span>
                                  </p>
                                </div>
                                {operate ? (
                                  <div className="flex flex-wrap items-start justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEdit(home)}
                                    >
                                      Editar
                                    </Button>
                                    <HomeDeleteButton
                                      assigned={row.friUsed + row.satUsed > 0}
                                      disabled={homeSaving}
                                      onDelete={() => setPendingDelete(home)}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            {home.notes?.trim() ? (
                              <p className="mt-2 rounded-md border border-[color-mix(in_srgb,var(--color-warning)_30%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_8%,white)] px-3 py-2 text-xs text-foreground">
                                <span className="font-semibold">Cuidados: </span>
                                {home.notes}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-muted">
                                Sin notas de cuidado. Agréguelas al editar el hogar.
                              </p>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {homesFull.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Completos ({homesFull.length})
                </p>
                <ul className="space-y-2">
                  {homesFull.map((row) => {
                    const { home } = row;
                    const isEditing = editingId === home._id;
                    return (
                      <li
                        key={home._id}
                        className={cn(
                          "rounded-lg border border-border px-4 py-2.5 text-sm",
                          isEditing ? "bg-white" : "bg-background-soft opacity-90"
                        )}
                      >
                        {isEditing ? (
                          <form
                            className="grid max-w-3xl gap-2 sm:grid-cols-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              submitEdit(home._id);
                            }}
                          >
                            <p className="sm:col-span-2 text-sm font-semibold text-foreground">
                              Editar hogar
                            </p>
                            <HomeFields
                              name={editName}
                              setName={setEditName}
                              contactPhone={editContactPhone}
                              setContactPhone={(v) => {
                                setEditContactPhone(v);
                                setEditContactPhoneError(null);
                              }}
                              address={editAddress}
                              setAddress={setEditAddress}
                              notes={editNotes}
                              setNotes={setEditNotes}
                              capFri={editCapFri}
                              setCapFri={(v) => {
                                setEditCapFri(v);
                                setEditCapacityError(null);
                              }}
                              capSat={editCapSat}
                              setCapSat={(v) => {
                                setEditCapSat(v);
                                setEditCapacityError(null);
                              }}
                              differentByNight={editDifferentByNight}
                              setDifferentByNight={(v) => {
                                setEditDifferentByNight(v);
                                setEditCapacityError(null);
                              }}
                              disabled={homeSaving}
                              nameError={editNameError}
                              contactPhoneError={editContactPhoneError}
                              capacityError={editCapacityError}
                            />
                            <div className="flex flex-wrap items-start justify-between gap-2 sm:col-span-2">
                              <HomeDeleteButton
                                assigned={row.friUsed + row.satUsed > 0}
                                disabled={homeSaving}
                                onDelete={() => setPendingDelete(home)}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button type="submit" size="sm" loading={homeSaving}>
                                  Guardar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={homeSaving}
                                  onClick={cancelEdit}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground">{home.name}</p>
                              <p className="text-xs tabular-nums text-muted">
                                Vie {row.friUsed}/{row.friCap} · Sáb {row.satUsed}/
                                {row.satCap}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md border border-border bg-white px-2 py-0.5 text-xs font-semibold text-[var(--color-warning)]">
                                Completo
                              </span>
                              {operate ? (
                                <div className="flex flex-wrap items-start justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEdit(home)}
                                  >
                                    Editar
                                  </Button>
                                  <HomeDeleteButton
                                    assigned={row.friUsed + row.satUsed > 0}
                                    disabled={homeSaving}
                                    onDelete={() => setPendingDelete(home)}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </Section>

      <Dialog
        open={createOpen}
        onClose={closeCreate}
        title="Agregar hogar"
        description="Indique el nombre y teléfono de la familia o jefe de hogar, y cuántas camas ofrece (mismo cupo ambos días, salvo que indique lo contrario)."
        size="lg"
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitCreate();
          }}
        >
          <HomeFields
            name={name}
            setName={(v) => {
              setName(v);
              setCreateNameError(null);
            }}
            contactPhone={contactPhone}
            setContactPhone={(v) => {
              setContactPhone(v);
              setCreateContactPhoneError(null);
            }}
            address={address}
            setAddress={setAddress}
            notes={notes}
            setNotes={setNotes}
            capFri={capFri}
            setCapFri={(v) => {
              setCapFri(v);
              setCreateCapacityError(null);
            }}
            capSat={capSat}
            setCapSat={(v) => {
              setCapSat(v);
              setCreateCapacityError(null);
            }}
            differentByNight={createDifferentByNight}
            setDifferentByNight={(v) => {
              setCreateDifferentByNight(v);
              setCreateCapacityError(null);
            }}
            disabled={homeSaving}
            nameError={createNameError}
            contactPhoneError={createContactPhoneError}
            capacityError={createCapacityError}
          />
          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={homeSaving}
              onClick={closeCreate}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={homeSaving}>
              Guardar hogar
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete != null}
        onClose={() => {
          if (homeSaving) return;
          setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar hogar"
        description={
          pendingDelete
            ? `¿Eliminar el hogar de ${pendingDelete.name}? Se borran sus cupos. No se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        loading={homeSaving}
      />

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
                      {registrationDisplayName(reg)}
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
