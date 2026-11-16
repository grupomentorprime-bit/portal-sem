import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import { getDefaultRolePermissionTemplate } from "../../src/core/identity/permissions/role-templates";
import { resolveMembershipPermissions } from "../../src/core/identity/permissions/resolver";
import {
  assertCanAssignCustomProfile,
  assertCanWriteProfilePermissions,
  classifyEnterpriseProfile,
  grantablePermissionCodes,
  grantsBeyondCaller,
  validateCustomProfileName,
} from "../../src/lib/identity/enterprise-profiles";
import {
  canResendInvitation,
  filterTeamDirectory,
  filterTeamInvitations,
  membershipStatusLabel,
} from "../../src/lib/desktop/team-directory";
import type { IdentityRole } from "../../src/types/identity";

function role(partial: Partial<IdentityRole> & Pick<IdentityRole, "name" | "system">): IdentityRole {
  return {
    _id: partial._id ?? "role-1",
    tenantId: partial.tenantId ?? "espacio-a",
    name: partial.name,
    description: partial.description ?? "",
    permissionIds: partial.permissionIds ?? [],
    permissionMap: partial.permissionMap,
    code: partial.code,
    system: partial.system,
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-01-01T00:00:00.000Z",
  };
}

describe("perfiles de empresa NELZURI", () => {
  it("separa perfiles de empresa, personalizados y de producto", () => {
    assert.equal(
      classifyEnterpriseProfile({ name: "Institution Admin", code: "institution_admin", system: true }),
      "enterprise"
    );
    assert.equal(
      classifyEnterpriseProfile({ name: "Coordinación comercial", system: false }),
      "custom"
    );
    assert.equal(
      classifyEnterpriseProfile({ name: "Teacher", code: "teacher", system: true }),
      "product"
    );
    assert.equal(
      classifyEnterpriseProfile({ name: "Growth interno", system: true }),
      "product"
    );
  });

  it("no deja otorgar permisos que el administrador no tiene", () => {
    const excess = grantsBeyondCaller(
      { "settings.team.manage": true, "identity.roles.manage": true },
      { "settings.team.manage": true }
    );
    assert.deepEqual(excess, ["identity.roles.manage"]);

    const denied = assertCanWriteProfilePermissions({
      callerCode: ROLE_CODES.INSTITUTION_ADMIN,
      callerEffective: { "settings.team.manage": true },
      role: { name: "Coordinación", system: false },
      permissionMap: { "identity.roles.manage": true },
    });
    assert.equal(denied.ok, false);

    const guestCeiling = assertCanWriteProfilePermissions({
      callerCode: ROLE_CODES.SUPER_ADMIN,
      callerEffective: { "identity.roles.manage": true, "portal.pages.view": true },
      role: { name: "Guest", code: ROLE_CODES.GUEST, system: true },
      permissionMap: { "identity.roles.manage": true, "portal.pages.view": true },
    });
    assert.equal(guestCeiling.ok, false);

    const allowed = assertCanAssignCustomProfile({
      callerCode: ROLE_CODES.INSTITUTION_ADMIN,
      callerEffective: { "settings.team.manage": true, "portal.pages.view": true },
      permissionMap: { "portal.pages.view": true },
    });
    assert.equal(allowed.ok, true);

    const guest = assertCanAssignCustomProfile({
      callerCode: ROLE_CODES.GUEST,
      callerEffective: { "portal.pages.view": true },
      permissionMap: { "portal.pages.view": true },
    });
    assert.equal(guest.ok, false);
  });

  it("rechaza nombres reservados y conserva el techo de los perfiles oficiales", () => {
    assert.equal(validateCustomProfileName("Editor").ok, false);
    assert.equal(validateCustomProfileName("super_admin").ok, false);
    assert.equal(validateCustomProfileName("Coordinación comercial").ok, true);

    const template = getDefaultRolePermissionTemplate(ROLE_CODES.INSTITUTION_ADMIN);
    const resolved = resolveMembershipPermissions({
      roles: [
        role({
          name: "Institution Admin",
          code: ROLE_CODES.INSTITUTION_ADMIN,
          system: true,
          permissionMap: { ...template, "identity.roles.manage": true },
        }),
      ],
      roleCode: ROLE_CODES.INSTITUTION_ADMIN,
    });
    assert.equal(resolved.effective["identity.roles.manage"], false);
    assert.equal(resolved.effective["settings.team.manage"], true);
  });

  it("un perfil personalizado otorga solo su mapa, dentro de un Espacio", () => {
    const resolved = resolveMembershipPermissions({
      roles: [
        role({
          name: "Coordinación comercial",
          system: false,
          permissionMap: {
            "portal.pages.view": true,
            "growth.sales.view": true,
          },
        }),
      ],
      roleCode: null,
    });
    assert.equal(resolved.effective["portal.pages.view"], true);
    assert.equal(resolved.effective["growth.sales.view"], true);
    assert.equal(resolved.effective["identity.roles.manage"], false);

    const internal = resolveMembershipPermissions({
      roles: [
        role({
          name: "Growth interno",
          system: true,
          permissionMap: { "growth.sales.view": true },
        }),
      ],
      roleCode: null,
    });
    assert.equal(internal.effective["growth.sales.view"], false);

    const grantable = grantablePermissionCodes({
      callerEffective: { "portal.pages.view": true, "identity.roles.manage": true },
      role: { name: "Guest", code: ROLE_CODES.GUEST, system: true },
    });
    assert.deepEqual(grantable, ["portal.pages.view"]);
  });
});

describe("directorio de equipo NELZURI", () => {
  const members = [
    {
      membershipId: "m1",
      displayName: "Ana López",
      email: "ana@cliente.cl",
      status: "active",
      roles: [{ id: "r-admin", label: "Administrador" }],
      authorizedApps: ["growth-os"],
    },
    {
      membershipId: "m2",
      displayName: "Bruno Díaz",
      email: "bruno@otro.cl",
      status: "suspended",
      roles: [{ id: "r-com", label: "Comunicaciones" }],
      authorizedApps: ["cumple"],
    },
  ];

  it("busca por nombre o correo y filtra perfil, estado y aplicación", () => {
    assert.equal(filterTeamDirectory(members, { query: "ANA@" }).length, 1);
    assert.equal(filterTeamDirectory(members, { query: "bruno@otro.cl" })[0]?.membershipId, "m2");
    assert.equal(filterTeamDirectory(members, { status: "suspended" }).length, 1);
    assert.equal(filterTeamDirectory(members, { roleId: "r-admin" })[0]?.displayName, "Ana López");
    assert.equal(filterTeamDirectory(members, { appId: "cumple" })[0]?.membershipId, "m2");
    assert.equal(filterTeamDirectory(members, { query: "nadie" }).length, 0);
    assert.equal(membershipStatusLabel("active"), "Activo");
  });

  it("reenvía solo invitaciones pendientes", () => {
    assert.equal(canResendInvitation("pending"), true);
    assert.equal(canResendInvitation("expired"), false);
    const visible = filterTeamInvitations(
      [
        { id: "i1", email: "nueva@cliente.cl", displayName: "Nueva Persona", status: "pending" },
        { id: "i2", email: "vieja@cliente.cl", displayName: "Vieja", status: "accepted" },
        { id: "i3", email: "tardia@cliente.cl", displayName: "Tardía", status: "expired" },
      ],
      "cliente"
    );
    assert.deepEqual(
      visible.map((item) => item.id),
      ["i1", "i3"]
    );
  });
});

describe("superficie de Equipo en Ajustes", () => {
  const team = readFileSync(
    resolve(process.cwd(), "src/components/desktop/DesktopSpaceTeam.tsx"),
    "utf8"
  );
  const profiles = readFileSync(
    resolve(process.cwd(), "src/components/desktop/DesktopSpaceProfiles.tsx"),
    "utf8"
  );
  const settings = readFileSync(
    resolve(process.cwd(), "src/lib/desktop/space-settings.ts"),
    "utf8"
  );
  const rolesRoute = readFileSync(
    resolve(process.cwd(), "src/app/api/identity/roles/route.ts"),
    "utf8"
  );

  it("administra personas, invitaciones y llaves sin crear contraseñas ni planes", () => {
    assert.match(team, /Agregar persona/);
    assert.match(team, /Buscar por nombre o correo/);
    assert.match(team, /\/api\/identity\/invitations/);
    assert.match(team, /\/api\/identity\/invitations\/resend/);
    assert.match(team, /action=suspend/);
    assert.match(team, /action=restore/);
    assert.match(team, /action=remove-access/);
    assert.match(team, /onDirtyChange/);
    assert.doesNotMatch(team, /password/i);
    assert.doesNotMatch(team, /tenantId/);

    assert.match(settings, /panel:\s*"roles"/);
    assert.match(profiles, /identity\.roles|\/api\/identity\/roles/);
    assert.match(profiles, /No puedes otorgar|permisos superiores|Fuera de tu alcance|readOnly/);
    assert.match(rolesRoute, /ctx\.tenantId/);
    assert.doesNotMatch(rolesRoute, /body\.tenantId/);
  });
});
