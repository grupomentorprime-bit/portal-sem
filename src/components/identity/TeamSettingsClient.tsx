"use client";

import { useState, useEffect } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamMember {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  joinedAt: string;
  lastLoginAt?: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compatMode, setCompatMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [teamRes, meRes] = await Promise.all([
          fetch("/api/identity/team"),
          fetch("/api/identity/me"),
        ]);
        if (cancelled) return;

        const team = await teamRes.json();
        const me = await meRes.json();

        if (team.ok) {
          setMembers(team.members ?? []);
          setInvitations(team.invitations ?? []);
          setAudit(team.audit ?? []);
        }
        if (me.ok) setCompatMode(me.compatMode === true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, roleName: "Editor" }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo enviar la invitación");
      return;
    }
    setInviteEmail("");
    const teamRes = await fetch("/api/identity/team");
    const team = await teamRes.json();
    if (team.ok) {
      setMembers(team.members ?? []);
      setInvitations(team.invitations ?? []);
      setAudit(team.audit ?? []);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando equipo…</p>;
  }

  return (
    <div className="space-y-8">
      {compatMode ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Modo compatibilidad activo (<code>IDENTITY_ENFORCE</code> no está en <code>true</code>).
          La autorización no bloquea operaciones hasta activar enforcement.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Miembros</CardTitle>
          <CardDescription>Usuarios con acceso a este tenant.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Roles</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.membershipId} className="border-b">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.displayName || m.email}</div>
                    <div className="text-xs text-muted">{m.email}</div>
                  </td>
                  <td className="px-4 py-3">{m.roles.join(", ") || "—"}</td>
                  <td className="px-4 py-3">{m.status}</td>
                  <td className="px-4 py-3 text-muted">
                    {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString("es") : "—"}
                  </td>
                </tr>
              ))}
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
          <CardDescription>Invita nuevos miembros al tenant.</CardDescription>
        </CardHeader>
        <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
          <Button type="submit">Invitar como Editor</Button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {invitations.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex justify-between rounded border px-3 py-2">
                <span>{inv.email}</span>
                <span className="text-muted">expira {new Date(inv.expiresAt).toLocaleDateString("es")}</span>
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
        <ul className="space-y-2 text-sm">
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
