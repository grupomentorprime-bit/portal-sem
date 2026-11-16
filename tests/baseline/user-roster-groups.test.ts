import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupMaintainedUsers, type MaintainedUserRow } from "../../src/lib/platform/user-profiles";

function row(partial: Partial<MaintainedUserRow> & Pick<MaintainedUserRow, "id" | "displayName">): MaintainedUserRow {
  return {
    email: `${partial.id}@example.com`,
    profile: partial.profile ?? "",
    status: "active",
    ...partial,
  };
}

describe("groupMaintainedUsers", () => {
  it("keeps each client apart and leaves ecosystem accounts out of every client", () => {
    const groups = groupMaintainedUsers([
      row({
        id: "owner",
        displayName: "Marco Antonio",
        platformLabel: "Dueño de Growth OS",
        memberships: [
          { tenantId: "sem", spaceName: "Seminario Eclesiástico Mayor", roleLabel: "Dueño del Espacio" },
          { tenantId: "ari", spaceName: "Academia ARI", roleLabel: "Dueño del Espacio" },
        ],
      }),
      row({
        id: "operator",
        displayName: "Admin de usuarios",
        platformLabel: "Operador de Growth OS",
      }),
      row({
        id: "alejandra",
        displayName: "Alejandra Lara",
        memberships: [
          { tenantId: "sem", spaceName: "Seminario Eclesiástico Mayor", roleLabel: "Asuntos Estudiantiles" },
        ],
      }),
      row({
        id: "ari-admin",
        displayName: "Ana ARI",
        memberships: [{ tenantId: "ari", spaceName: "Academia ARI", roleLabel: "Administrador" }],
      }),
      row({
        id: "loose",
        displayName: "Sin espacio",
      }),
    ]);

    assert.deepEqual(
      groups.map((group) => ({
        id: group.id,
        title: group.title,
        people: group.users.map((user) => `${user.displayName} · ${user.profile}`),
      })),
      [
        {
          id: "ecosystem",
          title: "Ecosistema",
          people: ["Admin de usuarios · Operador de Growth OS", "Marco Antonio · Dueño de Growth OS"],
        },
        {
          id: "ari",
          title: "Academia ARI",
          people: ["Ana ARI · Administrador"],
        },
        {
          id: "sem",
          title: "Seminario Eclesiástico Mayor",
          people: ["Alejandra Lara · Asuntos Estudiantiles"],
        },
        {
          id: "unassigned",
          title: "Sin cliente",
          people: ["Sin espacio · "],
        },
      ]
    );
  });

  it("shows a person in each client they belong to, with only that client's role", () => {
    const groups = groupMaintainedUsers([
      row({
        id: "shared",
        displayName: "Camila",
        memberships: [
          { tenantId: "a", spaceName: "Academia", roleLabel: "Soporte" },
          { tenantId: "b", spaceName: "Fundación", roleLabel: "Consulta" },
          { tenantId: "a", spaceName: "Academia", roleLabel: "Soporte" },
        ],
      }),
    ]);

    assert.equal(groups.length, 2);
    assert.deepEqual(
      groups.map((group) => [group.title, group.users.map((user) => user.profile)]),
      [
        ["Academia", ["Soporte"]],
        ["Fundación", ["Consulta"]],
      ]
    );
  });
});
