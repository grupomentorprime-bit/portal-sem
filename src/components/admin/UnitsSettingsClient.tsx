"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";

interface UnitApp {
  id: string;
  label: string;
}

interface OrgUnit {
  unitId: string;
  name: string;
  kind: "department" | "area" | "branch" | "unit";
  status: "active" | "inactive" | "archived";
  responsibleUserIds: string[];
  enabledAppIds: string[];
}

interface TeamMember {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  status: string;
  unitAccess?: { mode: "tenant" } | { mode: "units"; unitIds: string[] };
}

const KIND_LABELS: Record<OrgUnit["kind"], string> = {
  department: "Departamento",
  area: "Área",
  branch: "Sede",
  unit: "Unidad",
};

function memberSeesUnit(member: TeamMember, unitId: string): boolean {
  if (!member.unitAccess || member.unitAccess.mode === "tenant") return true;
  return member.unitAccess.unitIds.includes(unitId);
}

export function UnitsSettingsClient() {
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [apps, setApps] = useState<UnitApp[]>([]);
  const [central, setCentral] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<OrgUnit["kind"]>("department");
  const [documents, setDocuments] = useState<Array<{ _id: string; title?: string; originalName: string }>>([]);

  const load = useCallback(async () => {
    const [unitsResponse, teamResponse] = await Promise.all([
      fetch("/api/identity/units"),
      fetch("/api/identity/team"),
    ]);
    const unitsBody = (await unitsResponse.json()) as {
      ok: boolean;
      error?: string;
      central?: boolean;
      apps?: UnitApp[];
      units?: OrgUnit[];
    };
    if (!unitsResponse.ok || !unitsBody.ok) {
      setError(unitsBody.error || "No se pudieron cargar las unidades.");
      return;
    }
    setUnits(unitsBody.units ?? []);
    setApps(unitsBody.apps ?? []);
    setCentral(Boolean(unitsBody.central));
    setSelectedId((current) => current ?? unitsBody.units?.[0]?.unitId ?? null);
    if (teamResponse.ok) {
      const teamBody = (await teamResponse.json()) as { members?: TeamMember[] };
      setMembers(teamBody.members ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = units.find((unit) => unit.unitId === selectedId) ?? null;

  useEffect(() => {
    const unitId = selected?.unitId;
    if (!unitId) {
      setDocuments([]);
      return;
    }
    void fetch(`/api/cms/media?unitId=${encodeURIComponent(unitId)}&limit=8`)
      .then(async (response) => {
        if (!response.ok) {
          setDocuments([]);
          return;
        }
        const body = (await response.json()) as {
          items?: Array<{ _id: string; title?: string; originalName: string }>;
        };
        setDocuments(body.items ?? []);
      })
      .catch(() => setDocuments([]));
  }, [selected?.unitId]);

  async function createUnit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/identity/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, kind, enabledAppIds: [] }),
    });
    const body = (await response.json()) as { ok: boolean; error?: string; unit?: OrgUnit };
    if (!response.ok || !body.ok) {
      setError(body.error || "No se pudo crear la unidad.");
      return;
    }
    setName("");
    setSelectedId(body.unit?.unitId ?? null);
    await load();
  }

  async function saveApps(appIds: string[]) {
    if (!selected) return;
    setError("");
    const response = await fetch(`/api/identity/units/${selected.unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabledAppIds: appIds }),
    });
    const body = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !body.ok) {
      setError(body.error || "No se pudieron guardar las aplicaciones.");
      return;
    }
    await load();
  }

  async function memberAction(membershipId: string, action: "grant" | "revoke" | "responsible" | "clear-responsible") {
    if (!selected) return;
    setError("");
    const response = await fetch(`/api/identity/units/${selected.unitId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, action }),
    });
    const body = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !body.ok) {
      setError(body.error || "No se pudo actualizar el acceso.");
      return;
    }
    await load();
  }

  const unitMembers = selected
    ? members.filter((member) => memberSeesUnit(member, selected.unitId))
    : [];

  const fieldClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-[var(--growth-os-primary)]";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          {units.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">Todavía no hay departamentos.</p>
          ) : (
            units.map((unit) => {
              const active = unit.unitId === selectedId;
              return (
                <button
                  key={unit.unitId}
                  type="button"
                  onClick={() => setSelectedId(unit.unitId)}
                  className={`block w-full border-b border-border px-4 py-3 text-left last:border-b-0 ${
                    active ? "bg-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)]" : "hover:bg-background-muted"
                  }`}
                >
                  <span className="block text-sm font-semibold text-foreground">{unit.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{KIND_LABELS[unit.kind]}</span>
                </button>
              );
            })
          )}
        </div>
        {central ? (
          <form onSubmit={createUnit} className="space-y-3 rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">Nuevo departamento</p>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Nombre</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Dorcas"
                className={fieldClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Tipo</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as OrgUnit["kind"])}
                className={fieldClass}
              >
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm">
              Agregar
            </Button>
          </form>
        ) : null}
      </aside>

      {selected ? (
        <section className="space-y-8 rounded-2xl border border-border bg-background p-5 sm:p-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {KIND_LABELS[selected.kind]}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{selected.name}</h2>
            <p className="mt-1 text-sm text-muted">
              Quien pertenece a este departamento no ve los demás, salvo que se le autorice.
            </p>
          </header>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Aplicaciones</h3>
            <div className="flex flex-wrap gap-2">
              {apps.map((app) => {
                const enabled = selected.enabledAppIds.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    disabled={!central}
                    onClick={() => {
                      const next = enabled
                        ? selected.enabledAppIds.filter((id) => id !== app.id)
                        : [...selected.enabledAppIds, app.id];
                      void saveApps(next);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      enabled
                        ? "bg-[var(--growth-os-primary)] text-white"
                        : "border border-border bg-background text-muted hover:text-foreground"
                    }`}
                  >
                    {app.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Personas</h3>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {unitMembers.map((member) => {
                const responsible = selected.responsibleUserIds.includes(member.userId);
                const centralMember = !member.unitAccess || member.unitAccess.mode === "tenant";
                return (
                  <li
                    key={member.membershipId}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-foreground">{member.displayName || member.email}</span>
                    <span className="text-xs text-muted">
                      {centralMember ? "Administración del Espacio" : "Del departamento"}
                      {responsible ? " · Responsable" : ""}
                    </span>
                    {central ? (
                      <span className="ml-auto flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs font-medium text-[var(--growth-os-primary)]"
                          onClick={() =>
                            void memberAction(
                              member.membershipId,
                              responsible ? "clear-responsible" : "responsible"
                            )
                          }
                        >
                          {responsible ? "Quitar responsable" : "Hacer responsable"}
                        </button>
                        {centralMember ? null : (
                          <button
                            type="button"
                            className="text-xs font-medium text-muted"
                            onClick={() => void memberAction(member.membershipId, "revoke")}
                          >
                            Quitar
                          </button>
                        )}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {central ? (
              <div className="mt-4 space-y-3">
                <MemberGrant
                  members={members.filter((member) => !memberSeesUnit(member, selected.unitId))}
                  onGrant={(membershipId) => void memberAction(membershipId, "grant")}
                />
                <UnitInvite unitId={selected.unitId} onDone={() => void load()} onError={setError} />
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Documentos</h3>
            {documents.length === 0 ? (
              <p className="text-sm text-muted">Todavía no hay documentos en este departamento.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {documents.map((document) => (
                  <li key={document._id}>{document.title || document.originalName}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-border bg-background px-5 py-8 text-sm text-muted">
          Elige un departamento o crea el primero.
        </p>
      )}

      {error ? <p className="text-sm text-[#9b1c1c] lg:col-span-2">{error}</p> : null}
    </div>
  );
}

function UnitInvite({
  unitId,
  onDone,
  onError,
}: {
  unitId: string;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName,
        roleCode: "support",
        unitId,
      }),
    });
    const body = (await response.json()) as { ok: boolean; error?: string; granted?: boolean };
    if (!response.ok || !body.ok) {
      onError(body.error || "No se pudo invitar a la unidad.");
      return;
    }
    setEmail("");
    setDisplayName("");
    onError("");
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
      <input
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="Nombre y apellido"
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
      />
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        placeholder="Correo"
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
      />
      <Button type="submit" size="sm" variant="outline">
        Invitar
      </Button>
    </form>
  );
}

function MemberGrant({
  members,
  onGrant,
}: {
  members: TeamMember[];
  onGrant: (membershipId: string) => void;
}) {
  const [membershipId, setMembershipId] = useState("");
  if (members.length === 0) return null;
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (membershipId) onGrant(membershipId);
      }}
    >
      <select
        value={membershipId}
        onChange={(event) => setMembershipId(event.target.value)}
        className="h-10 min-w-[16rem] rounded-lg border border-border bg-background px-3 text-sm"
      >
        <option value="">Agregar persona del Espacio</option>
        {members.map((member) => (
          <option key={member.membershipId} value={member.membershipId}>
            {member.displayName || member.email}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline">
        Autorizar
      </Button>
    </form>
  );
}
