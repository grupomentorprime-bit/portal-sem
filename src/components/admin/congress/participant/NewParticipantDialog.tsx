"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  foldPersonSearchText,
  matchesPersonSearch,
} from "@/lib/experience/forms/person-search";
import { ChilePhoneInput } from "@/components/portal/experience/forms/ChilePhoneInput";
import { ChileRutInput } from "@/components/portal/experience/forms/ChileRutInput";
import {
  CHILE_PHONE_INVALID_MESSAGE,
  isValidChilePhone,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";
import {
  CHILE_RUT_INVALID_MESSAGE,
  isValidChileRut,
  normalizeChileRut,
} from "@/lib/experience/forms/rut-chile";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import type { CongressRegistration } from "@/core/congress/types";
import { displayBrotherName } from "@/core/congress/brother-name";
import { formatZoneLabel } from "@/components/admin/congress/labels";
import { findFoldedNameDuplicates } from "@/core/congress/accent-duplicates";

const CREATE_CHURCH = "__create_church__";

type Props = {
  open: boolean;
  onClose: () => void;
  zoneOptions: { id: string; label: string }[];
  /** Iglesias conocidas por zoneId (siempre asociadas a una zona). */
  churchesByZone?: Record<string, string[]>;
  registrations: CongressRegistration[];
  saving: boolean;
  onSubmit: (payload: {
    fullName: string;
    rut?: string;
    zoneId: string;
    churchName: string;
    phone?: string;
    email?: string;
    expectedDays: { saturday: boolean | null; sunday: boolean | null };
    lodgingNeed: "unknown" | "none" | "requested";
  }) => Promise<void>;
  onOpenExisting: (id: string) => void;
};

export function NewParticipantDialog({
  open,
  onClose,
  zoneOptions,
  churchesByZone = {},
  registrations,
  saving,
  onSubmit,
  onOpenExisting,
}: Props) {
  const [matchQuery, setMatchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [rut, setRut] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [churchSelect, setChurchSelect] = useState("");
  const [churchNewName, setChurchNewName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [expectedPreset, setExpectedPreset] = useState<
    "unconfirmed" | "saturday" | "sunday" | "both"
  >("unconfirmed");
  const [lodgingNeed, setLodgingNeed] = useState<"unknown" | "none" | "requested">(
    "unknown"
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [rutError, setRutError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = matchQuery.trim();
    if (q.length < 2) return [];
    return registrations
      .filter((r) =>
        matchesPersonSearch(q, [
          r.identity.fullName,
          r.identity.rut,
          r.identity.phone,
          r.identity.email,
          r.churchName,
        ])
      )
      .slice(0, 5);
  }, [matchQuery, registrations]);

  /** Siempre Zona 01–11; se mezclan extras del servidor si aparecieran. */
  const effectiveZones = useMemo(() => {
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

  const churchesInZone = useMemo(() => {
    if (!zoneId) return [];
    const fromMap = churchesByZone[zoneId] ?? [];
    const fromRegs = registrations
      .filter((r) => r.zoneId === zoneId)
      .map((r) => r.churchName.trim())
      .filter(Boolean);
    return Array.from(new Set([...fromMap, ...fromRegs])).sort((a, b) =>
      a.localeCompare(b, "es")
    );
  }, [churchesByZone, registrations, zoneId]);

  const zoneLabel = useMemo(() => {
    const found = effectiveZones.find((z) => z.id === zoneId);
    return found?.label || (zoneId ? formatZoneLabel(zoneId) : "");
  }, [effectiveZones, zoneId]);

  const creatingChurch = churchSelect === CREATE_CHURCH;

  const nameDuplicates = useMemo(
    () => findFoldedNameDuplicates(fullName, registrations),
    [fullName, registrations]
  );

  const reset = () => {
    setMatchQuery("");
    setFullName("");
    setRut("");
    setZoneId("");
    setChurchSelect("");
    setChurchNewName("");
    setPhone("");
    setEmail("");
    setExpectedPreset("unconfirmed");
    setLodgingNeed("unknown");
    setLocalError(null);
    setRutError(null);
    setPhoneError(null);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const expectedDays = () => {
    switch (expectedPreset) {
      case "saturday":
        return { saturday: true, sunday: false };
      case "sunday":
        return { saturday: false, sunday: true };
      case "both":
        return { saturday: true, sunday: true };
      default:
        return { saturday: null, sunday: null };
    }
  };

  const resolveChurchName = (): string | null => {
    if (!zoneId) return null;
    if (creatingChurch) {
      const name = churchNewName.trim();
      if (!name) return null;
      // Reutilizar si ya existe en la misma zona (case-insensitive).
      const folded = foldPersonSearchText(name);
      const existing = churchesInZone.find(
        (c) => foldPersonSearchText(c) === folded
      );
      return existing ?? name;
    }
    return churchSelect.trim() || null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!fullName.trim()) {
      setLocalError("El nombre es obligatorio.");
      return;
    }
    if (!zoneId) {
      setLocalError("Seleccione una zona. La iglesia siempre se asocia a una zona.");
      return;
    }
    const rutValue = rut.trim();
    const normalizedRut = rutValue ? normalizeChileRut(rutValue) : null;
    const phoneValue = phone.trim();
    const normalizedPhone = phoneValue ? normalizeChilePhone(phoneValue) : null;
    const nextRutError = rutValue && !normalizedRut ? CHILE_RUT_INVALID_MESSAGE : null;
    const nextPhoneError =
      phoneValue && !normalizedPhone ? CHILE_PHONE_INVALID_MESSAGE : null;
    setRutError(nextRutError);
    setPhoneError(nextPhoneError);
    if (nextRutError || nextPhoneError) return;
    const churchName = resolveChurchName();
    if (!churchName) {
      setLocalError(
        creatingChurch
          ? "Escriba el nombre de la nueva iglesia."
          : "Seleccione una iglesia o créela para esta zona."
      );
      return;
    }
    await onSubmit({
      fullName: fullName.trim(),
      rut: normalizedRut || undefined,
      zoneId,
      churchName,
      phone: normalizedPhone || undefined,
      email: email.trim() || undefined,
      expectedDays: expectedDays(),
      lodgingNeed,
    });
    reset();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nuevo participante"
      description="Busque coincidencias antes de crear. La iglesia siempre queda asociada a una zona."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Buscar coincidencias"
          placeholder="Nombre, RUT o teléfono"
          value={matchQuery}
          onChange={(e) => setMatchQuery(e.target.value)}
        />
        {matches.length > 0 ? (
          <ul className="rounded-md border border-border bg-background-soft text-sm">
            {matches.map((m) => (
              <li key={m._id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white"
                  onClick={() => {
                    handleClose();
                    onOpenExisting(m._id);
                  }}
                >
                  <span>
                    {displayBrotherName(m.identity.fullName)}
                    <span className="ml-2 text-xs text-muted">
                      {m.churchName} · {formatZoneLabel(m.zoneId)}
                    </span>
                  </span>
                  <span className="text-xs text-primary">Abrir ficha</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <ChileRutInput
            label="RUT (opcional)"
            name="rut"
            value={rut}
            error={rutError ?? undefined}
            helper="Opcional. Ej. 12.345.678-5"
            onChange={(value) => {
              setRut(value);
              if (!value.trim() || isValidChileRut(value)) setRutError(null);
            }}
            onBlur={() => {
              if (!rut.trim() || isValidChileRut(rut)) {
                setRutError(null);
                return;
              }
              setRutError(CHILE_RUT_INVALID_MESSAGE);
            }}
          />

          {nameDuplicates.length > 0 ? (
            <div
              className="sm:col-span-2 rounded-md border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_10%,white)] px-3 py-2 text-sm"
              role="status"
            >
              <p className="font-semibold text-foreground">Posible ingreso duplicado</p>
              <ul className="mt-1 space-y-1">
                {nameDuplicates.map((match) => (
                  <li key={match.row._id}>
                    <button
                      type="button"
                      className="text-left text-primary underline-offset-2 hover:underline"
                      onClick={() => {
                        handleClose();
                        onOpenExisting(match.row._id);
                      }}
                    >
                      {displayBrotherName(match.row.identity.fullName)}
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

          <Select
            label="Zona"
            value={zoneId}
            onChange={(e) => {
              setZoneId(e.target.value);
              setChurchSelect("");
              setChurchNewName("");
            }}
            options={[
              { value: "", label: "Seleccionar zona…" },
              ...effectiveZones.map((z) => ({
                value: z.id,
                label: z.label || formatZoneLabel(z.id),
              })),
            ]}
          />

          <Select
            label="Iglesia"
            value={churchSelect}
            disabled={!zoneId}
            onChange={(e) => {
              setChurchSelect(e.target.value);
              if (e.target.value !== CREATE_CHURCH) setChurchNewName("");
            }}
            options={
              !zoneId
                ? [{ value: "", label: "Primero elija la zona…" }]
                : [
                    {
                      value: "",
                      label:
                        churchesInZone.length > 0
                          ? "Seleccionar iglesia…"
                          : "Sin iglesias aún en esta zona…",
                    },
                    ...churchesInZone.map((c) => ({ value: c, label: c })),
                    {
                      value: CREATE_CHURCH,
                      label: `Crear iglesia en ${zoneLabel}…`,
                    },
                  ]
            }
          />

          {creatingChurch && zoneId ? (
            <div className="sm:col-span-2 space-y-1">
              <Input
                label={`Nueva iglesia (${zoneLabel})`}
                placeholder="Nombre de la iglesia"
                value={churchNewName}
                onChange={(e) => setChurchNewName(e.target.value)}
                required
              />
              <p className="text-xs text-muted">
                Se creará asociada a {zoneLabel}. Si el nombre ya existe en esa zona, se
                reutiliza (sin duplicar).
              </p>
            </div>
          ) : null}

          <ChilePhoneInput
            label="Teléfono"
            name="phone"
            value={phone}
            error={phoneError ?? undefined}
            helper="Celular chileno, con +56. Ej. +56 9 1234 5678"
            onChange={(value) => {
              setPhone(value);
              if (!value.trim() || isValidChilePhone(value)) setPhoneError(null);
            }}
            onBlur={() => {
              if (!phone.trim() || isValidChilePhone(phone)) {
                setPhoneError(null);
                return;
              }
              setPhoneError(CHILE_PHONE_INVALID_MESSAGE);
            }}
          />
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select
            label="Confirmar asistencia"
            value={expectedPreset}
            onChange={(e) =>
              setExpectedPreset(e.target.value as typeof expectedPreset)
            }
            options={[
              { value: "unconfirmed", label: "Por confirmar" },
              { value: "saturday", label: "Sábado" },
              { value: "sunday", label: "Domingo" },
              { value: "both", label: "Ambos" },
            ]}
          />
          <Select
            label="Alojamiento"
            value={lodgingNeed}
            onChange={(e) =>
              setLodgingNeed(e.target.value as typeof lodgingNeed)
            }
            options={[
              { value: "unknown", label: "Por confirmar" },
              { value: "none", label: "No requiere" },
              { value: "requested", label: "Requiere alojamiento" },
            ]}
          />
        </div>

        {localError ? (
          <p className="text-sm text-[var(--color-warning)]">{localError}</p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Guardar y abrir ficha
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
