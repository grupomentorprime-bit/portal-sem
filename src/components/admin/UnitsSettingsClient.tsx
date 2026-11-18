"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

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

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="space-y-3">
        {units.map((unit) => (
          <button
            key={unit.unitId}
            type="button"
            onClick={() => setSelectedId(unit.unitId)}
            className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${
              unit.unitId === selectedId ? "border-foreground bg-background" : "border-border"
            }`}
          >
            <span className="block font-medium">{unit.name}</span>
            <span className="text-xs text-muted">{KIND_LABELS[unit.kind]}</span>
          </button>
        ))}
        {central ? (
          <form onSubmit={createUnit} className="space-y-2 rounded-xl border border-dashed border-border p-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nueva unidad"
              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            />
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as OrgUnit["kind"])}
              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            >
              {Object.entries(KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="submit" className="text-sm font-medium underline">
              Agregar
            </button>
          </form>
        ) : null}
      </div>

      {selected ? (
        <section className="space-y-6">
          <header>
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="text-sm text-muted">
              {KIND_LABELS[selected.kind]}. Las personas de esta unidad no ven las demás si no se les autoriza.
            </p>
          </header>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Aplicaciones</h3>
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
                    className={`rounded-full border px-3 py-1 text-xs ${
                      enabled ? "border-foreground bg-foreground text-background" : "border-border"
                    }`}
                  >
                    {app.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Personas y responsables</h3>
            <ul className="space-y-2">
              {unitMembers.map((member) => {
                const responsible = selected.responsibleUserIds.includes(member.userId);
                const centralMember = !member.unitAccess || member.unitAccess.mode === "tenant";
                return (
                  <li key={member.membershipId} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{member.displayName || member.email}</span>
                    <span className="text-muted">{centralMember ? "Administración del Espacio" : "Unidad"}</span>
                    {responsible ? <span className="text-xs">Responsable</span> : null}
                    {central ? (
                      <>
                        <button
                          type="button"
                          className="text-xs underline"
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
                            className="text-xs underline"
                            onClick={() => void memberAction(member.membershipId, "revoke")}
                          >
                            Quitar de la unidad
                          </button>
                        )}
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {central ? (
              <>
                <MemberGrant
                  members={members.filter((member) => !memberSeesUnit(member, selected.unitId))}
                  onGrant={(membershipId) => void memberAction(membershipId, "grant")}
                />
                <UnitInvite unitId={selected.unitId} onDone={() => void load()} onError={setError} />
              </>
            ) : null}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Documentos</h3>
            {documents.length === 0 ? (
              <p className="text-sm text-muted">Todavía no hay documentos marcados en esta unidad.</p>
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
        <p className="text-sm text-muted">Este Espacio todavía no tiene unidades.</p>
      )}

      {error ? <p className="text-sm text-danger lg:col-span-2">{error}</p> : null}
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
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="Nombre y apellido"
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Correo"
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <button type="submit" className="text-sm underline">
        Invitar a esta unidad
      </button>
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
      className="mt-3 flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (membershipId) onGrant(membershipId);
      }}
    >
      <select
        value={membershipId}
        onChange={(event) => setMembershipId(event.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      >
        <option value="">Agregar persona del Espacio</option>
        {members.map((member) => (
          <option key={member.membershipId} value={member.membershipId}>
            {member.displayName || member.email}
          </option>
        ))}
      </select>
      <button type="submit" className="text-sm underline">
        Autorizar
      </button>
    </form>
  );
}
