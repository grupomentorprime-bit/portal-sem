/**
 * OT-GROWTH-UX-TEAM-004 — superficie visual Equipo V1.
 * Valida copy humano, jerarquía, CTAs y ausencia de jerga técnica / caminos fuera de V1.
 * No toca Identity, APIs, permisos ni migración 023.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const FORBIDDEN_UI =
  /\b(Usuarios|CMS|membership|tenantId|Platform Admin|Bloquear|Suspender cuenta|Permisos avanzados|Transferir Dueño|Crear usuario|Crear cuenta)\b/;

describe("OT-GROWTH-UX-TEAM-004 — diseño Equipo", () => {
  it("cabecera Equipo con subtítulo humano", () => {
    const page = readSrc("src/app/admin/settings/team/page.tsx");
    assert.match(page, /title="Equipo"/);
    assert.match(
      page,
      /Las personas que trabajan contigo en este Espacio\./
    );
    assert.doesNotMatch(page, /Miembros, invitaciones/);
    assert.doesNotMatch(page, FORBIDDEN_UI);
  });

  it("listado: nombre, correo, rol, acciones humanas; sin historial ni bloqueo", () => {
    const card = readSrc("src/components/admin/UserCmsCard.tsx");
    assert.match(card, /Cambiar rol/);
    assert.match(card, /Quitar acceso/);
    assert.match(card, /Gestionar/);
    assert.match(card, /data-team-member/);
    assert.doesNotMatch(card, /Historial/);
    assert.doesNotMatch(card, /Editar rol/);
    assert.doesNotMatch(card, /Bloquear/);
    assert.doesNotMatch(card, /Suspender/);
    assert.doesNotMatch(card, />Permisos</);
    assert.doesNotMatch(card, /Asignar formularios/);
    assert.doesNotMatch(card, /Último acceso/);
    assert.doesNotMatch(card, /status === "active"[\s\S]*Activo/);
  });

  it("cliente: invitaciones separadas, estados, confirmaciones y errores humanos", () => {
    const client = readSrc("src/components/admin/UsuariosCmsClient.tsx");
    assert.match(client, /Invitar persona/);
    assert.match(client, /Cancelar invitación/);
    assert.match(client, /Invitaciones pendientes/);
    assert.match(client, /Sin colaboradores adicionales/);
    assert.match(client, /Cargando Equipo/);
    assert.match(client, /¿Quitar acceso a/);
    assert.match(client, /ya no podrá entrar a este Espacio/);
    assert.match(
      client,
      /No puedes quitar este acceso porque el Espacio debe tener al menos un administrador/
    );
    assert.match(client, /data-team-page/);
    assert.match(client, /data-team-invitations/);
    assert.match(client, /data-team-invite-form|InviteUserWizard/);
    assert.doesNotMatch(client, /Actividad reciente/);
    assert.doesNotMatch(client, /AuditTimeline/);
    assert.doesNotMatch(client, /Crear usuario/);
    assert.doesNotMatch(client, /¿Bloquear usuario\?/);
    assert.doesNotMatch(client, FORBIDDEN_UI);
  });

  it("invitar: un solo paso Nombre / Correo / Rol / Enviar invitación", () => {
    const wizard = readSrc("src/components/admin/InviteUserWizard.tsx");
    assert.match(wizard, />Nombre</);
    assert.match(wizard, />Correo</);
    assert.match(wizard, />Rol</);
    assert.match(wizard, /Enviar invitación/);
    assert.match(wizard, /data-team-invite-form/);
    assert.doesNotMatch(wizard, /Paso 1|Paso 2|Paso 3|Paso 4/);
    assert.doesNotMatch(wizard, /\bCMS\b/);
    assert.doesNotMatch(wizard, /Crear usuario|Crear cuenta|membership/i);
  });

  it("no toca Identity, APIs, last-admin ni migración 023", () => {
    const lastAdmin = readSrc("src/core/identity/policies/last-admin.ts");
    assert.match(lastAdmin, /LAST_SPACE_ADMIN_ERROR/);
    const membersApi = readSrc(
      "src/app/api/identity/members/[membershipId]/route.ts"
    );
    assert.match(membersApi, /remove-access/);
    const migration = readSrc(
      "src/core/migrations/023-growth-team-membership-unique.ts"
    );
    assert.match(migration, /userId.*tenantId|tenantId.*userId/);
    const teamApi = readSrc("src/app/api/identity/team/route.ts");
    assert.match(teamApi, /settings\.team/);
  });
});
