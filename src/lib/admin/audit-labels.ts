import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";

interface AuditLike {
  action: string;
  entity: string;
  metadata?: Record<string, unknown>;
}

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "inició sesión",
  "user.register": "creó su cuenta",
  "user.invite": "envió una invitación",
  "user.profile.update": "actualizó su perfil",
  "user.password.change": "cambió su contraseña",
  "membership.roles.update": "actualizó permisos de un usuario",
};

export function formatAuditMessage(
  entry: AuditLike,
  actorName: string
): string {
  const verb = ACTION_LABELS[entry.action];
  if (verb) {
    if (entry.action === "user.invite" && entry.metadata?.email) {
      return `${actorName} invitó a ${entry.metadata.email as string}`;
    }
    if (entry.action === "membership.roles.update" && entry.metadata?.role) {
      const role = getInstitutionalRoleLabel(String(entry.metadata.role));
      return `${actorName} asignó el rol ${role}`;
    }
    return `${actorName} ${verb}`;
  }

  const entityLabels: Record<string, string> = {
    page: "una página",
    news: "una noticia",
    program: "un programa",
    event: "un evento",
    media: "un archivo",
    user: "un usuario",
    invitation: "una invitación",
    session: "una sesión",
    membership: "un usuario",
  };

  const entity = entityLabels[entry.entity] ?? entry.entity;
  return `${actorName} modificó ${entity}`;
}

export function groupAuditByDay<T extends { createdAt: string }>(
  entries: T[]
): Array<{ label: string; items: T[] }> {
  const groups = new Map<string, T[]>();
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();

  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    const key = date.toDateString();
    let label: string;
    if (key === today) label = "Hoy";
    else if (key === yesterdayKey) label = "Ayer";
    else {
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      label = diffDays < 7 ? `Hace ${diffDays} días` : date.toLocaleDateString("es", { dateStyle: "long" });
    }
    const bucket = groups.get(label) ?? [];
    bucket.push(entry);
    groups.set(label, bucket);
  }

  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days === 1 ? "" : "s"}`;
}
