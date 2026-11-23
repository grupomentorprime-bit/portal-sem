import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { MongoClient } from "mongodb";
import { membershipUnitScope } from "../../src/core/units/access";
import { IPN_CHILE_TENANT_ID, IPN_CHILE_VARONES } from "../../src/core/units/ipn-chile";
import { listOrgUnits } from "../../src/core/units/repository";
import { ORG_UNITS_COLLECTION } from "../../src/core/units/types";
import { PROTECTED_OPERATIONAL_SPACE_IDS, SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { getAllNavTreeItems } from "../../src/lib/admin/nav-domains";
import { isUnitScopedAdminPathAllowed } from "../../src/lib/admin/nav-access";
import { desktopSearch } from "../../src/lib/desktop/search";
import {
  clientDeskApps,
  openSpecializedFromDesk,
  specializedForDesk,
  type DeskSpecializedInput,
} from "../../src/lib/desktop/specialized";
import {
  createOwnedDatabase,
  dropOwnedDatabase,
} from "../../src/lib/mongo/destructive-guard";
import {
  assertNonProductionClient,
  classifyLocalMongo,
} from "../../src/lib/mongo/local-boundary";
import {
  lifecycleMarks,
  manifestById,
  MENTOR_APPS,
  parseContractPatch,
  projectAppLifecycle,
  relevance,
  resolveContractedApps,
  SPECIALIZED_APPS,
} from "../../src/nelzuri";

const ROOT = process.cwd();
const none = { productOrigin: false, httpsEntry: null };
const VARONES = IPN_CHILE_VARONES.unitId;

const admissionPermissions = [
  "cms.pages.read",
  "experience.forms.read",
  "experience.forms.manage",
  "students.read",
] as const;
const affairsPermissions = [
  "student-affairs.read",
  "student-affairs.checkin",
  "student-affairs.manage",
  "experience.forms.read",
  "experience.forms.manage",
] as const;
const congressPermissions = ["congress.view", "congress.operate"] as const;

function person(input: Partial<DeskSpecializedInput> & Pick<DeskSpecializedInput, "tenantId">): DeskSpecializedInput {
  return {
    tenantId: input.tenantId,
    permissions: input.permissions ?? [],
    unitIds: input.unitIds ?? null,
    enabledUnitAppIds: input.enabledUnitAppIds ?? null,
  };
}

function navItem(id: string) {
  const item = getAllNavTreeItems().find((entry) => entry.id === id);
  assert.ok(item, id);
  return item;
}

describe("capacidades especializadas del escritorio", () => {
  it("registra las tres en el catálogo, fuera del plan y sin rubro", () => {
    assert.deepEqual(MENTOR_APPS, ["growth-os", "cumple", "aprende-hoy", "rrhh"]);
    assert.deepEqual([...SPECIALIZED_APPS], ["admision", "asuntos-estudiantiles", "congreso"]);
    assert.equal(manifestById("growth-os").class, "transversal");
    assert.equal(manifestById("growth-os").contractable, true);
    assert.equal(manifestById("growth-os").label, "Growth OS");

    const admission = manifestById("admision");
    const affairs = manifestById("asuntos-estudiantiles");
    const congress = manifestById("congreso");
    assert.equal(admission.requiresSpaceId, SEM_TENANT_ID);
    assert.equal(affairs.requiresSpaceId, SEM_TENANT_ID);
    assert.equal(congress.requiresSpaceId, IPN_CHILE_TENANT_ID);
    assert.equal(congress.door?.unitId, VARONES);
    assert.deepEqual(admission.door?.anyPermission, navItem("portal-admission").requiredAnyPermission);
    assert.deepEqual(affairs.door?.anyPermission, navItem("convocatorias-resultados").requiredAnyPermission);
    assert.deepEqual(congress.door?.anyPermission, navItem("congreso-varones").requiredAnyPermission);
    assert.equal(admission.open.type === "internal" && admission.open.href, navItem("portal-admission").href);
    assert.equal(
      affairs.open.type === "internal" && affairs.open.href,
      navItem("convocatorias-resultados").href
    );
    assert.equal(congress.open.type === "internal" && congress.open.href, navItem("congreso-varones").href);

    for (const id of SPECIALIZED_APPS) {
      const item = manifestById(id);
      assert.equal(item.class, "specialized");
      assert.equal(item.contractable, false);
      assert.equal(item.sectors, undefined);
      assert.equal(item.integration, "internal");
      assert.equal(item.publication, "published");
    }

    assert.deepEqual(relevance("education"), ["aprende-hoy"]);
    assert.deepEqual(relevance("business"), ["growth-os", "rrhh"]);
    assert.deepEqual(relevance("community"), []);
    assert.deepEqual(
      resolveContractedApps({
        tenantId: IPN_CHILE_TENANT_ID,
        contractedApps: ["growth-os", "congreso", "admision"],
      }),
      ["growth-os"]
    );
    assert.deepEqual(parseContractPatch({ contractedApps: ["congreso"], aprendeHoyEntryUrl: null }), {
      ok: false,
    });
    assert.deepEqual(PROTECTED_OPERATIONAL_SPACE_IDS, [
      "seminario-ipn",
      "ipn-chile",
      "adl",
      "fundacion-mueve",
      "mentor-prime-capacitacion",
      "cumple",
    ]);
  });

  it("un miembro del SEM ve sus capacidades y no el Congreso", () => {
    const central = person({
      tenantId: SEM_TENANT_ID,
      permissions: [...admissionPermissions, ...affairsPermissions, ...congressPermissions],
    });
    assert.deepEqual(specializedForDesk(central), ["admision", "asuntos-estudiantiles"]);
    assert.deepEqual(openSpecializedFromDesk("congreso", central), { kind: "denied" });
    assert.equal(openSpecializedFromDesk("admision", central).kind, "open");
    if (openSpecializedFromDesk("admision", central).kind === "open") {
      assert.equal(
        (openSpecializedFromDesk("admision", central) as { href: string }).href,
        "/admin/portal/admission"
      );
    }

    assert.deepEqual(
      specializedForDesk(person({ tenantId: SEM_TENANT_ID, permissions: ["cms.pages.read"] })),
      ["admision"]
    );
    assert.deepEqual(
      specializedForDesk(person({ tenantId: SEM_TENANT_ID, permissions: ["student-affairs.read"] })),
      ["asuntos-estudiantiles"]
    );
    assert.deepEqual(
      specializedForDesk(person({ tenantId: SEM_TENANT_ID, permissions: ["congress.view"] })),
      []
    );
    assert.deepEqual(
      specializedForDesk(
        person({
          tenantId: SEM_TENANT_ID,
          permissions: [...admissionPermissions],
          unitIds: ["unidad-sintetica"],
          enabledUnitAppIds: ["sitio-web"],
        })
      ),
      []
    );
    assert.deepEqual(
      specializedForDesk(
        person({
          tenantId: SEM_TENANT_ID,
          permissions: ["students.read"],
          unitIds: ["unidad-sintetica"],
          enabledUnitAppIds: ["institucion"],
        })
      ),
      []
    );
    assert.deepEqual(
      specializedForDesk(person({ tenantId: SEM_TENANT_ID, permissions: ["experience.forms.read"] })),
      []
    );
    assert.deepEqual(
      specializedForDesk(
        person({ tenantId: SEM_TENANT_ID, permissions: ["experience.forms.manage"] })
      ),
      ["asuntos-estudiantiles"]
    );
  });

  it("IPN Chile abre el Congreso solo con permiso y con su unidad", () => {
    const href = "/admin/portal/congreso-varones";
    assert.equal(isUnitScopedAdminPathAllowed(href, ["sitio-web"]), true);
    assert.equal(isUnitScopedAdminPathAllowed(href, ["institucion"]), false);
    assert.equal(isUnitScopedAdminPathAllowed("/admin/portal/admission", ["institucion"]), true);
    assert.equal(isUnitScopedAdminPathAllowed("/admin/portal/admission", ["sitio-web"]), false);

    const central = person({
      tenantId: IPN_CHILE_TENANT_ID,
      permissions: ["congress.view"],
    });
    assert.deepEqual(specializedForDesk(central), ["congreso"]);
    assert.deepEqual(openSpecializedFromDesk("congreso", central), {
      kind: "open",
      href,
    });
    assert.deepEqual(openSpecializedFromDesk("admision", central), { kind: "denied" });

    assert.deepEqual(
      specializedForDesk(person({ tenantId: IPN_CHILE_TENANT_ID, permissions: ["congress.operate"] })),
      ["congreso"]
    );
    assert.deepEqual(
      specializedForDesk(
        person({
          tenantId: IPN_CHILE_TENANT_ID,
          permissions: ["cms.pages.read", "student-affairs.manage"],
        })
      ),
      []
    );

    const varones = person({
      tenantId: IPN_CHILE_TENANT_ID,
      permissions: ["congress.view"],
      unitIds: [VARONES],
      enabledUnitAppIds: ["sitio-web"],
    });
    assert.deepEqual(specializedForDesk(varones), ["congreso"]);

    const sinPermiso = person({
      tenantId: IPN_CHILE_TENANT_ID,
      permissions: ["settings.team"],
      unitIds: [VARONES],
      enabledUnitAppIds: ["sitio-web"],
    });
    assert.deepEqual(specializedForDesk(sinPermiso), []);
    assert.deepEqual(openSpecializedFromDesk("congreso", sinPermiso), { kind: "denied" });

    const otraUnidad = person({
      tenantId: IPN_CHILE_TENANT_ID,
      permissions: ["congress.view", "congress.operate"],
      unitIds: ["otra-unidad-sintetica"],
      enabledUnitAppIds: ["sitio-web"],
    });
    assert.deepEqual(specializedForDesk(otraUnidad), []);
    assert.deepEqual(openSpecializedFromDesk("congreso", otraUnidad), { kind: "denied" });

    const sinGrupo = person({
      tenantId: IPN_CHILE_TENANT_ID,
      permissions: ["congress.view"],
      unitIds: [VARONES],
      enabledUnitAppIds: ["institucion"],
    });
    assert.deepEqual(specializedForDesk(sinGrupo), []);

    const inactiva = membershipUnitScope({
      unitAccess: { mode: "units", unitIds: [VARONES] },
      units: [
        {
          unitId: VARONES,
          status: "inactive",
          enabledAppIds: ["sitio-web"],
        },
      ],
    });
    assert.deepEqual(inactiva.enabledUnitAppIds, []);
    assert.deepEqual(
      specializedForDesk(
        person({
          tenantId: IPN_CHILE_TENANT_ID,
          permissions: ["congress.view"],
          unitIds: inactiva.unitIds,
          enabledUnitAppIds: inactiva.enabledUnitAppIds,
        })
      ),
      []
    );
  });

  it("otro Espacio no recibe la capacidad por pertenecer a un rubro", () => {
    const permissions = [...admissionPermissions, ...affairsPermissions, ...congressPermissions];
    for (const tenantId of [
      "adl",
      "fundacion-mueve",
      "mentor-prime-capacitacion",
      "cumple",
      "mentor-cumple",
      "mentor-capacitacion",
      "saas-val-especializada",
    ]) {
      assert.deepEqual(
        specializedForDesk(person({ tenantId, permissions })),
        [],
        tenantId
      );
      assert.deepEqual(openSpecializedFromDesk("congreso", person({ tenantId, permissions })), {
        kind: "denied",
      });
    }

    const desk = clientDeskApps({
      owner: false,
      spaceType: "education",
      contracted: ["growth-os"],
      authorizedApps: ["growth-os"],
      ...person({ tenantId: "adl", permissions }),
    });
    assert.deepEqual(desk, ["growth-os", "mensajes"]);
    assert.equal(desk.includes("congreso"), false);
    assert.equal(desk.includes("admision"), false);

    const owner = clientDeskApps({
      owner: true,
      spaceType: "education",
      contracted: ["growth-os"],
      authorizedApps: null,
      ...person({ tenantId: IPN_CHILE_TENANT_ID, permissions: ["congress.view"] }),
    });
    assert.equal(owner.includes("congreso"), false);
  });

  it("el buscador y la consola no las tratan como aplicación contratable", () => {
    const spaces = [{ tenantId: SEM_TENANT_ID, name: "Seminario" }];
    assert.equal(
      desktopSearch({ query: "congreso", owner: false, spaces }).some((hit) => hit.id === "congreso"),
      false
    );
    assert.equal(
      desktopSearch({ query: "", owner: false, spaces }).some((hit) => hit.id === "admision"),
      false
    );
    assert.deepEqual(
      desktopSearch({
        query: "congreso",
        owner: false,
        spaces,
        specialized: ["congreso"],
      }).map((hit) => hit.id),
      ["congreso"]
    );

    const atSem = projectAppLifecycle({
      appId: "admision",
      tenantId: SEM_TENANT_ID,
      contractedApps: ["admision", "growth-os"],
      requestedApps: ["admision"],
      signals: none,
    });
    assert.equal(atSem.contracted, false);
    assert.equal(atSem.requested, false);
    assert.equal(atSem.available, true);
    assert.equal(atSem.contractable, false);
    assert.ok(lifecycleMarks(atSem).includes("De este Espacio"));
    assert.ok(lifecycleMarks(atSem).includes("No se contrata"));
    assert.equal(lifecycleMarks(atSem).includes("Sin contratar"), false);

    const atIpn = projectAppLifecycle({
      appId: "congreso",
      tenantId: SEM_TENANT_ID,
      contractedApps: ["congreso"],
      signals: none,
    });
    assert.equal(atIpn.available, false);
    assert.ok(lifecycleMarks(atIpn).includes("De otro Espacio"));

    const growth = projectAppLifecycle({
      appId: "growth-os",
      tenantId: "saas-val-especializada",
      contractedApps: ["growth-os"],
      signals: none,
    });
    assert.equal(growth.category, "transversal");
    assert.equal(growth.contracted, true);
    assert.equal(growth.available, true);
  });

  it("no mueve las rutas ni el guardia que ya abre el Congreso", () => {
    const congressPage = readFileSync(
      resolve(ROOT, "src/app/admin/portal/congreso-varones/page.tsx"),
      "utf8"
    );
    assert.match(congressPage, /congress\.view/);
    assert.match(congressPage, /congress\.operate/);
    assert.equal(congressPage.includes("@/nelzuri"), false);
    const admission = readFileSync(resolve(ROOT, "src/app/admin/portal/admission/page.tsx"), "utf8");
    assert.equal(admission.includes("@/nelzuri"), false);
    const affairs = readFileSync(
      resolve(ROOT, "src/app/admin/portal/asuntos-estudiantiles/page.tsx"),
      "utf8"
    );
    assert.equal(affairs.includes("@/nelzuri"), false);
    const desk = readFileSync(resolve(ROOT, "src/app/escritorio/page.tsx"), "utf8");
    assert.match(desk, /membershipUnitScope/);
    assert.equal(desk.includes("writeSpaceContract"), false);
  });

  it("lee la unidad sintética desde el Mongo aislado y no crea cuentas", async (t) => {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      t.skip("Mongo aislado no autorizado");
      return;
    }
    assertNonProductionClient(uri, process.env);
    if (classifyLocalMongo(uri, process.env) !== "isolated-test") {
      throw new Error("Las pruebas solo abren el Mongo isolated-test.");
    }

    const owned = createOwnedDatabase(process.env);
    const client = new MongoClient(uri);
    const now = "2026-11-22T00:00:00.000Z";
    try {
      await client.connect();
      const db = client.db(owned.name);
      await db.collection(ORG_UNITS_COLLECTION).insertMany([
        {
          tenantId: IPN_CHILE_TENANT_ID,
          unitId: VARONES,
          name: "Departamento Nacional de Varones",
          kind: "department",
          status: "active",
          responsibleUserIds: [],
          enabledAppIds: ["sitio-web"],
          createdAt: now,
          updatedAt: now,
        },
        {
          tenantId: IPN_CHILE_TENANT_ID,
          unitId: "otra-unidad-sintetica",
          name: "Otra unidad sintética",
          kind: "unit",
          status: "active",
          responsibleUserIds: [],
          enabledAppIds: ["sitio-web"],
          createdAt: now,
          updatedAt: now,
        },
      ]);
      const units = await listOrgUnits(db, IPN_CHILE_TENANT_ID);
      const varones = membershipUnitScope({
        unitAccess: { mode: "units", unitIds: [VARONES] },
        units,
      });
      const otra = membershipUnitScope({
        unitAccess: { mode: "units", unitIds: ["otra-unidad-sintetica"] },
        units,
      });
      assert.deepEqual(
        specializedForDesk(
          person({
            tenantId: IPN_CHILE_TENANT_ID,
            permissions: ["congress.view"],
            unitIds: varones.unitIds,
            enabledUnitAppIds: varones.enabledUnitAppIds,
          })
        ),
        ["congreso"]
      );
      assert.deepEqual(
        specializedForDesk(
          person({
            tenantId: IPN_CHILE_TENANT_ID,
            permissions: ["congress.view"],
            unitIds: otra.unitIds,
            enabledUnitAppIds: otra.enabledUnitAppIds,
          })
        ),
        []
      );
      assert.deepEqual(
        specializedForDesk(
          person({
            tenantId: SEM_TENANT_ID,
            permissions: ["congress.view", "cms.pages.read"],
            unitIds: varones.unitIds,
            enabledUnitAppIds: varones.enabledUnitAppIds,
          })
        ),
        []
      );
      assert.equal(await db.collection("identity_users").countDocuments(), 0);
      assert.equal(await db.collection("tenants").countDocuments(), 0);
    } finally {
      try {
        await dropOwnedDatabase(client, uri, owned, process.env);
      } finally {
        await client.close();
      }
    }
  });
});
