import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, it } from "node:test";
import { filterSpaceSettingGroups } from "../../src/lib/desktop/space-settings";
import { desktopDock } from "../../src/lib/desktop/catalog";
import {
  MENTOR_APPS,
  NELZURI_CAPABILITIES,
  appsByClass,
  availableCoreCapabilities,
  decideOpening,
  desktopVisibleApps,
  evaluateAppRequest,
  isMentorAppId,
  listManifests,
  manifestById,
  parseContractPatch,
  resolveContractedApps,
  validateCatalog,
  type AppClass,
  type AppManifest,
} from "../../src/nelzuri";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (entry.endsWith(".ts")) files.push(path);
  }
  return files;
}

function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const pattern =
    /\bfrom\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    const spec = match[1] || match[2] || match[3];
    if (spec) specs.push(spec);
  }
  return specs;
}

const FORBIDDEN_IMPORT = /(?:^|\/)(?:lib\/growth|core\/growth|app\/api\/growth|app\/admin|core\/congress|app\/congreso|core\/tenant|lib\/connect|lib\/desktop|lib\/mongodb|sites)(?:\/|$)|(?:^|\/)(?:admision|congreso|congress)(?:\/|$)|^mongodb$/;

describe("catálogo y contratos de NELZURI", () => {
  it("conserva los ids contratables y su orden", () => {
    assert.deepEqual(MENTOR_APPS, ["growth-os", "cumple", "aprende-hoy", "rrhh"]);
    assert.deepEqual(
      listManifests().filter((item) => item.contractable).map((item) => item.id),
      [...MENTOR_APPS]
    );
  });

  it("Growth OS es transversal; ninguna aplicación es capacidad esencial", () => {
    assert.equal(listManifests().some((item) => (item.class as string) === "essential"), false);
    assert.deepEqual(appsByClass("transversal").map((item) => item.id), [
      "growth-os",
      "cumple",
      "aprende-hoy",
      "rrhh",
      "store",
      "connect",
    ]);
    assert.deepEqual(appsByClass("specialized").map((item) => item.id), [
      "admision",
      "asuntos-estudiantiles",
      "congreso",
    ]);
    const growth = manifestById("growth-os");
    assert.equal(growth.class, "transversal");
    assert.equal(growth.contractable, true);
    assert.equal(growth.integration, "internal");
    assert.deepEqual(growth.open, { type: "internal", href: "/admin" });
    for (const id of ["cumple", "aprende-hoy", "rrhh"] as const) {
      assert.equal(manifestById(id).integration, "connect");
      assert.equal(manifestById(id).class, "transversal");
    }
    for (const item of [...appsByClass("specialized"), manifestById("store"), manifestById("connect")]) {
      assert.equal(item.contractable, false);
      assert.equal(isMentorAppId(item.id), false);
    }
  });

  it("separa lo ya integrado de lo pendiente, y deja Factura fuera", () => {
    assert.deepEqual(
      listManifests()
        .filter((item) => item.integration === "internal" || item.integration === "connect")
        .map((item) => item.id),
      ["growth-os", "cumple", "aprende-hoy", "rrhh"]
    );
    assert.deepEqual(
      listManifests()
        .filter((item) => item.integration === "pending")
        .map((item) => item.id),
      ["store", "connect", "admision", "asuntos-estudiantiles", "congreso"]
    );
    for (const id of ["factura", "nelzuri-factura"]) {
      assert.equal(listManifests().some((item) => item.id === id), false);
      assert.equal(isMentorAppId(id), false);
    }
  });

  it("el núcleo opera sin Growth OS; la omisión del campo sigue siendo solo compatibilidad", () => {
    assert.deepEqual([...NELZURI_CAPABILITIES], [
      "escritorio",
      "identidad",
      "clientes",
      "espacios",
      "usuarios",
      "membresias",
      "permisos",
      "catalogo",
      "administracion",
    ]);
    assert.deepEqual([...availableCoreCapabilities()], [...NELZURI_CAPABILITIES]);
    for (const capability of NELZURI_CAPABILITIES) {
      assert.equal(isMentorAppId(capability), false);
    }

    assert.deepEqual(resolveContractedApps({ tenantId: "espacio-nuevo", contractedApps: [] }), []);
    assert.deepEqual(resolveContractedApps({ tenantId: "espacio-nuevo" }), ["growth-os"]);
    assert.deepEqual(
      desktopVisibleApps({ contracted: [], authorizedApps: null, canRequestPlan: false }),
      []
    );
    assert.deepEqual(
      decideOpening({
        appId: "growth-os",
        tenantId: "espacio-nuevo",
        contracted: [],
        signals: { productOrigin: false, httpsEntry: null },
      }),
      { kind: "request" }
    );
    assert.deepEqual(desktopDock(false), ["growth-os", "cumple", "aprende-hoy", "rrhh", "mensajes"]);
    assert.deepEqual(
      filterSpaceSettingGroups(
        ["settings.update", "settings.team", "identity.roles.manage", "settings.integrations"],
        undefined,
        []
      ).flatMap((group) => group.items.map((item) => item.id)),
      ["empresa", "marca", "equipo", "roles", "canales", "integraciones"]
    );
  });

  it("la omisión de Growth OS y el Espacio de Cumple viven en el manifiesto", () => {
    assert.deepEqual(manifestById("growth-os").defaultContract, { when: "field-missing" });
    assert.deepEqual(manifestById("cumple").defaultContract, {
      when: "field-missing",
      spaceId: "cumple",
    });
    assert.equal(manifestById("cumple").requiresSpaceId, "cumple");
    assert.deepEqual(resolveContractedApps({ tenantId: "seminario-ipn" }), ["growth-os"]);
    assert.deepEqual(resolveContractedApps({ tenantId: "cumple" }), ["growth-os", "cumple"]);

    const desktop = read("src/lib/desktop/contract.ts");
    assert.equal(desktop.includes("defaults.push"), false);
    assert.equal(desktop.includes('["growth-os"]'), false);
    assert.equal(desktop.includes("CUMPLE_SPACE_ID"), false);
    assert.equal(/tenantId\s*===/.test(desktop), false);
    assert.match(desktop, /decideOpening/);
  });

  it("Store, Connect y una especializada no entran al contrato ni a la solicitud", () => {
    for (const id of ["store", "connect", "admision", "congreso"]) {
      assert.deepEqual(parseContractPatch({ contractedApps: [id], aprendeHoyEntryUrl: null }), {
        ok: false,
      });
      assert.deepEqual(evaluateAppRequest({ appId: id, contracted: [] }), {
        ok: false,
        reason: "unknown",
      });
    }
    assert.deepEqual(evaluateAppRequest({ appId: "growth-os", contracted: ["growth-os"] }), {
      ok: false,
      reason: "contracted",
    });
  });

  it("el registro rechaza un catálogo que mezcla clases o duplica ids", () => {
    const specialized: AppManifest = {
      ...manifestById("congreso"),
      contractable: true,
      open: { type: "internal", href: "/admin/portal" },
    };
    assert.throws(() => validateCatalog([specialized], []));
    assert.throws(() => validateCatalog([...listManifests(), manifestById("growth-os")], MENTOR_APPS));
    const markedEssential: AppManifest = {
      ...manifestById("growth-os"),
      class: "essential" as unknown as AppClass,
    };
    assert.throws(() => validateCatalog([markedEssential], ["growth-os"]), /esencial/);
    const factura: AppManifest = {
      ...manifestById("store"),
      id: "nelzuri-factura",
      label: "NELZURI Factura",
    };
    assert.throws(
      () => validateCatalog([manifestById("growth-os"), factura], ["growth-os"]),
      /independiente/
    );
  });

  it("el núcleo no importa Growth OS, Connect ni una funcionalidad de cliente", () => {
    const files = walk(resolve(ROOT, "src/nelzuri"));
    assert.ok(files.length >= 8);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const rel = relative(ROOT, file);
      for (const spec of importSpecifiers(source)) {
        assert.equal(FORBIDDEN_IMPORT.test(spec), false, `${rel} importa ${spec}`);
      }
      assert.equal(/getDatabase|mongodb|updateOne|insertOne|dropDatabase|TENANTS_COLLECTION/.test(source), false, rel);
    }
  });
});
