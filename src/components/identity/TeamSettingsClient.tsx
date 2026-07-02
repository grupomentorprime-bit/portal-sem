"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleOption {
  id: string;
  name: string;
  description: string;
}

interface TeamMember {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  status: string;
  roleIds: string[];
  roles: RoleOption[];
  joinedAt: string;
  lastLoginAt?: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  roles: RoleOption[];
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  userId: string;
  createdAt: string;
}

const INVITE_ROLE_BLOCKLIST = new Set(["Tenant Owner"]);

export function TeamSettingsClient() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compatMode, setCompatMode] = useState(false);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    const [teamRes, rolesRes, meRes] = await Promise.all([
      fetch("/api/identity/team"),
      fetch("/api/identity/roles"),
      fetch("/api/identity/me"),
    ]);

    const team = await teamRes.json();
    const roles = await rolesRes.json();
    const me = await meRes.json();

    if (team.ok) {
      setMembers(team.members ?? []);
      setInvitations(team.invitations ?? []);
      setAudit(team.audit ?? []);
    }

    if (roles.ok) {
      const options = (roles.roles ?? []).filter(
        (r: RoleOption) => !INVITE_ROLE_BLOCKLIST.has(r.name)
      );
      setRoleOptions(options);
      setInviteRoleId((current) => {
        if (current) return current;
        const editor = options.find((r: RoleOption) => r.name === "Editor");
        return editor?.id ?? options[0]?.id ?? "";
      });
    }

    if (me.ok) setCompatMode(me.compatMode === true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadTeam();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadTeam]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const selectedRole = roleOptions.find((r) => r.id === inviteRoleId);
    const res = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        roleName: selectedRole?.name ?? "Editor",
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo enviar la invitación");
      return;
    }

    setInviteEmail("");
    await loadTeam();
  }

  async function handleRoleChange(membershipId: string, roleId: string) {
    setRoleSavingId(membershipId);
    setError("");

    const selectedRole = roleOptions.find((r) => r.id === roleId);
    const res = await fetch(`/api/identity/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId, roleName: selectedRole?.name }),
    });
    const data = await res.json();

    if (!data.ok) {
      setError(data.error ?? "No se pudo actualizar el rol");
      setRoleSavingId(null);
      return;
    }

    await loadTeam();
    setRoleSavingId(null);
  }

  const selectableRoles = roleOptions;

  if (loading) {
    return <p className="text-sm text-muted">Cargando equipo…</p>;
  }

  return (
    <div className="space-y-8">
      {compatMode ? (
        <div className="rounded-lg border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
          Modo compatibilidad activo (<code>IDENTITY_ENFORCE</code> no está en <code>true</code>).
          La autorización no bloquea operaciones hasta activar enforcement.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Miembros</CardTitle>
          <CardDescription>Usuarios con acceso a este tenant y sus roles.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const currentRoleId = m.roleIds[0] ?? m.roles[0]?.id ?? "";
                const isOwner = m.roles.some((r) => r.name === "Tenant Owner");

                return (
                  <tr key={m.membershipId} className="border-b">
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.displayName || m.email}</div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isOwner ? (
                        <span className="font-medium">Tenant Owner</span>
                      ) : (
                        <select
                          value={currentRoleId}
                          disabled={roleSavingId === m.membershipId}
                          onChange={(e) => handleRoleChange(m.membershipId, e.target.value)}
                          className="h-9 min-w-[10rem] rounded-lg border border-border bg-background px-2 text-sm"
                        >
                          {selectableRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.status}</td>
                    <td className="px-4 py-3 text-muted">
                      {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString("es") : "—"}
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No hay miembros registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitaciones</CardTitle>
          <CardDescription>Invita nuevos miembros al tenant con un rol asignado.</CardDescription>
        </CardHeader>
        <form onSubmit={handleInvite} className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="inviteEmail">Email</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="usuario@institucion.cl"
              required
            />
          </div>
          <div className="w-full space-y-1.5 sm:w-56">
            <Select
              label="Rol"
              id="inviteRole"
              value={inviteRoleId}
              onChange={(e) => setInviteRoleId(e.target.value)}
              options={selectableRoles.map((role) => ({
                value: role.id,
                label: role.name,
              }))}
              required
            />
          </div>
          <Button type="submit" disabled={!inviteRoleId}>
            Enviar invitación
          </Button>
        </form>
        {error ? <p className="px-6 pb-4 text-sm text-[var(--color-danger)]">{error}</p> : null}
        {invitations.length > 0 ? (
          <ul className="space-y-2 px-6 pb-6 text-sm">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex flex-wrap justify-between gap-2 rounded border px-3 py-2">
                <span>{inv.email}</span>
                <span className="text-muted">
                  {inv.roles.map((r) => r.name).join(", ") || "Editor"} · expira{" "}
                  {new Date(inv.expiresAt).toLocaleDateString("es")}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auditoría reciente</CardTitle>
          <CardDescription>Últimas acciones registradas en el tenant.</CardDescription>
        </CardHeader>
        <ul className="space-y-2 px-6 pb-6 text-sm">
          {audit.map((entry) => (
            <li key={entry.id} className="flex justify-between border-b py-2">
              <span>
                <code className="text-xs">{entry.action}</code> — {entry.entity}
              </span>
              <span className="text-muted">{new Date(entry.createdAt).toLocaleString("es")}</span>
            </li>
          ))}
          {audit.length === 0 ? (
            <li className="py-4 text-center text-muted">Sin registros de auditoría.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
