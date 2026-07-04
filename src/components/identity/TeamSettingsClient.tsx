"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isProtectedMember } from "@/core/identity/roles/helpers";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";

interface AssignableRole {
  id: string;
  name: string;
  code: string;
  label: string;
}

interface TeamMember {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  status: string;
  roleIds: string[];
  roles: Array<{ id: string; name: string; code?: string; label: string }>;
  joinedAt: string;
  lastLoginAt?: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  roles: Array<{ label: string; code?: string }>;
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  userId: string;
  createdAt: string;
}

export function TeamSettingsClient() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleCode, setInviteRoleCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compatMode, setCompatMode] = useState(false);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    const [teamRes, meRes] = await Promise.all([
      fetch("/api/identity/team"),
      fetch("/api/identity/me"),
    ]);

    const team = await teamRes.json();
    const me = await meRes.json();

    if (team.ok) {
      setMembers(team.members ?? []);
      setInvitations(team.invitations ?? []);
      setAudit(team.audit ?? []);
      const roles: AssignableRole[] = team.assignableRoles ?? [];
      setAssignableRoles(roles);
      setInviteRoleCode((current) => current || roles[0]?.code || "");
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

    const selectedRole = assignableRoles.find((r) => r.code === inviteRoleCode);
    const res = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        roleName: selectedRole?.name,
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

  async function handleRoleChange(membershipId: string, roleCode: string) {
    setRoleSavingId(membershipId);
    setError("");
    const res = await fetch(`/api/identity/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleCode }),
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

  if (loading) {
    return <p className="text-sm text-muted">Cargando equipo…</p>;
  }

  return (
    <div className="space-y-8">
      {compatMode ? (
        <div className="rounded-xl border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
          Modo compatibilidad activo — enforcement de identidad deshabilitado.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Miembros del equipo</CardTitle>
          <CardDescription>Usuarios con acceso al tenant actual.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted">
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const currentRoleCode = m.roles[0]?.code ?? "";
                const isProtected = isProtectedMember(m.roles);

                return (
                  <tr key={m.membershipId} className="border-b">
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.displayName || m.email}</div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isProtected ? (
                        <span className="font-medium">
                          {getInstitutionalRoleLabel(m.roles[0]?.code ?? "")}
                        </span>
                      ) : (
                        <select
                          value={currentRoleCode}
                          disabled={roleSavingId === m.membershipId || !assignableRoles.length}
                          onChange={(e) => handleRoleChange(m.membershipId, e.target.value)}
                          className="h-9 min-w-[10rem] rounded-lg border border-border bg-background px-2 text-sm"
                        >
                          {assignableRoles.map((role) => (
                            <option key={role.id} value={role.code}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.status}</td>
                    <td className="px-4 py-3 text-muted">
                      {m.lastLoginAt
                        ? new Date(m.lastLoginAt).toLocaleString("es-CL")
                        : "Sin registro"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
          <CardDescription>Envía una invitación por correo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleInvite} className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Rol</Label>
            <select
              id="invite-role"
              value={inviteRoleCode}
              onChange={(e) => setInviteRoleCode(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {assignableRoles.map((role) => (
                <option key={role.id} value={role.code}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <Button type="submit" disabled={!assignableRoles.length}>
            Enviar invitación
          </Button>
        </form>
      </Card>

      {invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones pendientes</CardTitle>
          </CardHeader>
          <ul className="space-y-2 px-6 pb-6 text-sm">
            {invitations.map((inv) => (
              <li key={inv.id} className="rounded-lg border border-border px-4 py-3">
                <div className="font-medium">{inv.email}</div>
                <div className="text-muted">
                  {inv.roles.map((r) => r.label).join(", ")} · expira{" "}
                  {new Date(inv.expiresAt).toLocaleString("es-CL")}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {audit.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Auditoría reciente</CardTitle>
          </CardHeader>
          <ul className="space-y-2 px-6 pb-6 text-sm">
            {audit.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border px-4 py-3">
                <div className="font-medium">{entry.action}</div>
                <div className="text-muted">
                  {entry.entity} · {new Date(entry.createdAt).toLocaleString("es-CL")}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
