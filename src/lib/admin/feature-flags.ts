/**
 * Feature flags del BackOffice AprendeHoy.
 * OT-UX-IMPLEMENTACION-001 — Fase 1
 */

/** Activa el Shell Administrativo V2 (sidebar + topbar + layout maestro). */
export function isAdminShellV2Enabled(): boolean {
  const value = process.env.ADMIN_SHELL_V2?.trim().toLowerCase();
  if (value === "false" || value === "0") return false;
  // Default ON — alineado con .env.example; en Dokploy no hace falta definir la variable.
  return true;
}
