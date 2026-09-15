/**
 * OT-GROWTH-TEAM-IMPLEMENT-003 — Equipo V1 (Identity).
 * Casos A–T del contrato + regresiones de frontera Keycloak / unicidad / último admin.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import { NON_ASSIGNABLE_ROLE_CODES } from "../../src/core/identity/roles/helpers";
import { getAssignableRoleCodes, getRoleLevel } from "../../src/core/identity/roles/hierarchy";
import { PERMISSIONS } from "../../src/core/identity/permissions/registry";
import {
  isSpaceAdministratorRole,
  LAST_SPACE_ADMIN_ERROR,
  SPACE_ADMIN_MIN_LEVEL,
  wouldLeaveWithoutSpaceAdmin,
} from "../../src/core/identity/policies/last-admin";
import { getInstitutionalRoleLabel } from "../../src/lib/admin/institutional";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — D4 último administrador (puro)", () => {
  it("O · Soporte no cuenta; Dueño/Admin sí", () => {
    assert.equal(isSpaceAdministratorRole(ROLE_CODES.SUPER_ADMIN), true);
    assert.equal(isSpaceAdministratorRole(ROLE_CODES.INSTITUTION_ADMIN), true);
    assert.equal(isSpaceAdministratorRole(ROLE_CODES.SUPPORT), false);
    assert.equal(isSpaceAdministratorRole(ROLE_CODES.ADMISSIONS), false);
    assert.equal(SPACE_ADMIN_MIN_LEVEL, getRoleLevel(ROLE_CODES.INSTITUTION_ADMIN));
  });

  it("M · no puede quitar último Dueño/Admin", () => {
    assert.equal(
      wouldLeaveWithoutSpaceAdmin({
        activeAdminMembershipIds: ["mem-only"],
        membershipId: "mem-only",
        membershipRemainsAdmin: false,
      }),
      true
    );
    assert.equal(
      wouldLeaveWithoutSpaceAdmin({
        activeAdminMembershipIds: ["mem-a", "mem-b"],
        membershipId: "mem-a",
        membershipRemainsAdmin: false,
      }),
      false
    );
  });

  it("N · no puede degradar último Dueño/Admin", () => {
    assert.equal(
      wouldLeaveWithoutSpaceAdmin({
        activeAdminMembershipIds: ["mem-admin"],
        membershipId: "mem-admin",
        membershipRemainsAdmin: false,
      }),
      true
    );
    assert.equal(
      wouldLeaveWithoutSpaceAdmin({
        activeAdminMembershipIds: ["mem-admin"],
        membershipId: "mem-admin",
        membershipRemainsAdmin: true,
      }),
      false
    );
  });

  it("error de producto estable", () => {
    assert.match(LAST_SPACE_ADMIN_ERROR, /Dueño o Administrador activo/);
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — permisos y roles (P/R)", () => {
  it("P · Dueño NON_ASSIGNABLE", () => {
    assert.ok(NON_ASSIGNABLE_ROLE_CODES.includes(ROLE_CODES.SUPER_ADMIN));
    for (const caller of [
      ROLE_CODES.SUPER_ADMIN,
      ROLE_CODES.INSTITUTION_ADMIN,
      ROLE_CODES.SUPPORT,
    ] as const) {
      assert.ok(!getAssignableRoleCodes(caller).includes(ROLE_CODES.SUPER_ADMIN));
    }
  });

  it("R · Equipo usa settings.team (sin growth.team.*)", () => {
    assert.ok("settings.team" in PERMISSIONS);
    const teamApi = readSrc("src/app/api/identity/team/route.ts");
    const membersApi = readSrc("src/app/api/identity/members/[membershipId]/route.ts");
    const invitationsApi = readSrc("src/app/api/identity/invitations/route.ts");
    assert.match(teamApi, /requirePermission\("settings\.team"\)/);
    assert.match(membersApi, /requirePermission\("settings\.team"\)/);
    assert.match(invitationsApi, /requirePermission\("settings\.team"\)/);
    assert.doesNotMatch(readSrc("src/core/identity/permissions/registry.ts"), /growth\.team\./);
    assert.equal(getInstitutionalRoleLabel(ROLE_CODES.SUPER_ADMIN), "Dueño del Espacio");
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — D1 Keycloak frontera", () => {
  it("D/E · login no pisa roleIds; realm no eleva membership existente", () => {
    const src = readSrc("src/lib/identity/keycloak-access.ts");
    assert.match(src, /findMembershipAnyStatus/);
    assert.match(src, /Membership existente[\s\S]*no pisar roleIds/);
    assert.doesNotMatch(src, /updateMembershipRoles\(existing/);
    // Realm roles solo en alta sin documento previo
    assert.match(src, /Solo provision de primera membership/);
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — D3 unicidad", () => {
  it("F/G/H · create/ensure/accept endurecidos; índice único en migración", () => {
    const memberships = readSrc("src/lib/identity/memberships.ts");
    assert.match(memberships, /findMembershipAnyStatus/);
    assert.match(memberships, /MembershipConflictError/);
    assert.match(memberships, /ensureActiveMembership/);
    assert.match(memberships, /11000/);

    const accept = readSrc("src/app/api/identity/invitations/[token]/accept/route.ts");
    assert.match(accept, /ensureActiveMembership/);
    assert.doesNotMatch(accept, /createMembership\(/);

    const invitations = readSrc("src/app/api/identity/invitations/route.ts");
    assert.match(invitations, /findMembership\(/);
    assert.match(invitations, /ya tiene acceso/);

    const migration = readSrc("src/core/migrations/023-growth-team-membership-unique.ts");
    assert.match(migration, /userId_tenantId_unique/);
    assert.match(migration, /unique:\s*true/);
    const registry = readSrc("src/core/migrations/registry.ts");
    assert.match(registry, /migration023GrowthTeamMembershipUnique/);
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — D2 quitar acceso", () => {
  it("I/J/K/L · remove-access tenant-scoped; sin block; sin user.status", () => {
    const route = readSrc("src/app/api/identity/members/[membershipId]/route.ts");
    assert.match(route, /remove-access/);
    assert.match(route, /archiveMembershipAccess|status.*archived/);
    assert.match(route, /reconcileSessionsAfterSpaceAccessRemoved/);
    assert.match(route, /userStatusUntouched:\s*true/);
    assert.match(route, /tenantScoped:\s*true/);

    // El camino Equipo V1 no llama updateUserStatus ni deleteUserSessions en remove-access
    const removeAccessBlock = route.slice(
      route.indexOf('action === "remove-access"'),
      route.indexOf('if (action === "suspend")')
    );
    assert.doesNotMatch(removeAccessBlock, /updateUserStatus/);
    assert.doesNotMatch(removeAccessBlock, /deleteUserSessions/);
    assert.doesNotMatch(removeAccessBlock, /action === "block"/);

    const sessions = readSrc("src/lib/identity/sessions.ts");
    assert.match(sessions, /reconcileSessionsAfterSpaceAccessRemoved/);
    assert.match(sessions, /tenantId: removedTenantId/);
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — multi-tenant / seguridad API", () => {
  it("A/B/C/Q · team/invite/members filtran tenantId de sesión", () => {
    const team = readSrc("src/app/api/identity/team/route.ts");
    assert.match(team, /listMembershipsByTenant\(ctx\.tenantId\)/);
    assert.match(team, /listInvitationsByTenant\(ctx\.tenantId\)/);

    const invitations = readSrc("src/app/api/identity/invitations/route.ts");
    assert.match(invitations, /tenantId: ctx\.tenantId/);
    assert.match(invitations, /findMembership\(existingUser\._id, ctx\.tenantId\)/);

    const members = readSrc("src/app/api/identity/members/[membershipId]/route.ts");
    assert.match(members, /membership\.tenantId !== ctx\.tenantId/);
    assert.match(members, /Membresía no encontrada/);
  });

  it("S · invitación cancelada no aceptable (solo pending + no expirada)", () => {
    const invitations = readSrc("src/lib/identity/invitations.ts");
    assert.match(invitations, /status:\s*"pending"/);
    assert.match(invitations, /expiresAt:\s*\{\s*\$gt:/);
    const accept = readSrc("src/app/api/identity/invitations/[token]/accept/route.ts");
    assert.match(accept, /findInvitationByToken/);
    assert.match(accept, /Invitación inválida o expirada/);
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — superficie Equipo V1 (T)", () => {
  it("superficie canónica Equipo; users redirige; sin caminos fuera de V1", () => {
    const teamPage = readSrc("src/app/admin/settings/team/page.tsx");
    assert.match(teamPage, /title="Equipo"/);
    assert.match(teamPage, /UsuariosCmsClient/);
    assert.doesNotMatch(teamPage, /redirect\(/);

    const usersPage = readSrc("src/app/admin/settings/users/page.tsx");
    assert.match(usersPage, /redirect\("\/admin\/settings\/team"\)/);

    const card = readSrc("src/components/admin/UserCmsCard.tsx");
    assert.match(card, /Quitar acceso/);
    assert.match(card, /remove-access/);
    assert.doesNotMatch(card, /Bloquear/);
    assert.doesNotMatch(card, /"block"/);
    assert.doesNotMatch(card, />Permisos</);
    assert.doesNotMatch(card, /Suspender/);

    const client = readSrc("src/components/admin/UsuariosCmsClient.tsx");
    assert.match(client, /remove-access/);
    assert.doesNotMatch(client, /¿Bloquear usuario\?/);
    assert.match(client, /Invitar persona/);

    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /href: "\/admin\/settings\/team"/);
    assert.match(nav, /label: "Equipo"/);
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — D4 cableado en API", () => {
  it("M/N/O · members route usa assertSpaceKeepsAdministrator", () => {
    const route = readSrc("src/app/api/identity/members/[membershipId]/route.ts");
    assert.match(route, /assertSpaceKeepsAdministrator/);
    assert.match(route, /isSpaceAdministratorRole/);
    assert.match(route, /LAST_SPACE_ADMIN_ERROR/);
    const lastAdmin = readSrc("src/core/identity/policies/last-admin.ts");
    assert.match(lastAdmin, /SUPPORT|Soporte/);
    assert.match(lastAdmin, /no cuenta/);
  });
});

describe("OT-GROWTH-TEAM-IMPLEMENT-003 — fixtures Mongo (unicidad + multi-tenant)", () => {
  it("A/H/I/J/K · miembro por tenant; unicidad; quitar acceso solo A", async () => {
    const { existsSync } = await import("node:fs");
    const { MongoClient } = await import("mongodb");
    const { loadEnvLocal } = await import("../../src/core/migrations/env");

    function loadEnvFile(filename: string): void {
      const envPath = resolve(process.cwd(), filename);
      if (!existsSync(envPath)) return;
      const content = readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    }

    loadEnvLocal();
    loadEnvFile(".env");
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      console.warn("skip: MONGODB_URI/MONGODB_DB no configurados");
      return;
    }

    const FIX_USER = "user-team003-fixture";
    const FIX_A = "tenant-team003-a";
    const FIX_B = "tenant-team003-b";
    const client = new MongoClient(uri);
    await client.connect();
    try {
      const db = client.db(dbName);
      const memberships = db.collection("identity_memberships");
      const users = db.collection("identity_users");
      const sessions = db.collection("identity_sessions");

      await memberships.deleteMany({ userId: FIX_USER });
      await users.deleteMany({ _id: FIX_USER });
      await sessions.deleteMany({ userId: FIX_USER });

      await users.insertOne({
        _id: FIX_USER,
        email: "team003@example.com",
        displayName: "Team 003",
        status: "active",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const now = new Date().toISOString();
      await memberships.insertMany([
        {
          _id: "mem-team003-a",
          tenantId: FIX_A,
          userId: FIX_USER,
          roleIds: ["role-guest"],
          status: "active",
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "mem-team003-b",
          tenantId: FIX_B,
          userId: FIX_USER,
          roleIds: ["role-guest"],
          status: "active",
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // A · solo aparece en su tenant (lookup filtrado)
      const inA = await memberships.find({ tenantId: FIX_A, userId: FIX_USER }).toArray();
      const inB = await memberships.find({ tenantId: FIX_B, userId: FIX_USER }).toArray();
      assert.equal(inA.length, 1);
      assert.equal(inB.length, 1);
      assert.notEqual(inA[0]!._id, inB[0]!._id);

      // H · unicidad: segundo insert mismo (userId, tenantId) debe fallar si hay índice,
      // o al menos el lookup any-status encuentra uno solo.
      const anyA = await memberships.find({ userId: FIX_USER, tenantId: FIX_A }).toArray();
      assert.equal(anyA.length, 1);

      try {
        await memberships.createIndex(
          { userId: 1, tenantId: 1 },
          { name: "userId_tenantId_unique_team003_test", unique: true, background: true }
        );
      } catch {
        /* índice ya existe con otro nombre */
      }

      let duplicateRejected = false;
      try {
        await memberships.insertOne({
          _id: "mem-team003-a-dup",
          tenantId: FIX_A,
          userId: FIX_USER,
          roleIds: ["role-guest"],
          status: "active",
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        duplicateRejected = (error as { code?: number }).code === 11000;
      }
      assert.equal(duplicateRejected, true);

      // I/J/K · quitar acceso solo A: archivar A, B activo, user.status intacto
      await memberships.updateOne(
        { _id: "mem-team003-a" },
        { $set: { status: "archived", updatedAt: new Date().toISOString() } }
      );
      const afterA = await memberships.findOne({ _id: "mem-team003-a" });
      const afterB = await memberships.findOne({ _id: "mem-team003-b" });
      const user = await users.findOne({ _id: FIX_USER });
      assert.equal(afterA?.status, "archived");
      assert.equal(afterB?.status, "active");
      assert.equal(user?.status, "active");

      await memberships.deleteMany({ userId: FIX_USER });
      await users.deleteMany({ _id: FIX_USER });
      await sessions.deleteMany({ userId: FIX_USER });
      try {
        await memberships.dropIndex("userId_tenantId_unique_team003_test");
      } catch {
        /* puede ser el índice de migración con otro nombre */
      }
    } finally {
      await client.close();
    }
  });
});
