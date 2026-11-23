import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { createMemoryAppRequestStore, recordAppRequest } from "../../src/lib/desktop/requests";
import {
  availableCoreCapabilities,
  desktopBands,
  evaluateAppRequest,
  listManifests,
  relevance,
  validateCatalog,
  type AppManifest,
} from "../../src/nelzuri";

const ROOT = process.cwd();

describe("mesa por perfil empresarial", () => {
  it("el rubro orienta y no escribe el contrato", () => {
    assert.deepEqual(relevance("education"), ["aprende-hoy"]);
    assert.deepEqual(relevance("business"), ["growth-os", "rrhh"]);
    assert.deepEqual(relevance("community"), []);
    assert.deepEqual(relevance("institution"), []);
    assert.deepEqual(relevance("academy"), []);
    assert.deepEqual(relevance("platform"), []);
    assert.deepEqual(relevance(""), []);
    assert.deepEqual(relevance("   "), []);
    assert.deepEqual(relevance(null), []);
    assert.deepEqual(relevance(undefined), []);

    const contracted = ["growth-os"] as const;
    const bands = desktopBands({
      spaceType: "education",
      contracted,
      authorizedApps: ["growth-os"],
      canRequestPlan: true,
    });
    assert.deepEqual(contracted, ["growth-os"]);
    assert.deepEqual(bands.mine, ["growth-os"]);
    assert.deepEqual(bands.recommended, ["aprende-hoy"]);
    assert.deepEqual(bands.explore, ["cumple", "rrhh"]);
  });

  it("lo contratado y autorizado sigue visible aunque el rubro no lo nombre", () => {
    const bands = desktopBands({
      spaceType: "education",
      contracted: ["growth-os", "rrhh", "aprende-hoy"],
      authorizedApps: ["growth-os", "rrhh"],
      canRequestPlan: true,
    });
    assert.deepEqual(bands.mine, ["growth-os", "rrhh"]);
    assert.deepEqual(bands.recommended, []);
    assert.deepEqual(bands.explore, ["cumple"]);
  });

  it("sin rubro no recomienda y deja el resto para explorar", () => {
    const bands = desktopBands({
      spaceType: null,
      contracted: ["growth-os"],
      authorizedApps: null,
      canRequestPlan: true,
    });
    assert.deepEqual(bands.mine, ["growth-os"]);
    assert.deepEqual(bands.recommended, []);
    assert.deepEqual(bands.explore, ["cumple", "aprende-hoy", "rrhh"]);
  });

  it("quien no puede solicitar solo ve lo habilitado", () => {
    const bands = desktopBands({
      spaceType: "business",
      contracted: [],
      authorizedApps: null,
      canRequestPlan: false,
    });
    assert.deepEqual(bands.mine, []);
    assert.deepEqual(bands.recommended, []);
    assert.deepEqual(bands.explore, []);
    assert.ok(availableCoreCapabilities().includes("escritorio"));
  });

  it("un Espacio sin aplicaciones contratadas conserva el escritorio y las recomendaciones", () => {
    const bands = desktopBands({
      spaceType: "business",
      contracted: [],
      authorizedApps: [],
      canRequestPlan: true,
    });
    assert.deepEqual(bands.mine, []);
    assert.deepEqual(bands.recommended, ["growth-os", "rrhh"]);
    assert.deepEqual(bands.explore, ["cumple", "aprende-hoy"]);
  });

  it("una aplicación de otro sector sigue siendo solicitable y pedirla no contrata", async () => {
    const contracted = ["growth-os"];
    const decision = evaluateAppRequest({ appId: "aprende-hoy", contracted });
    assert.deepEqual(decision, { ok: true, appId: "aprende-hoy" });
    assert.deepEqual(contracted, ["growth-os"]);

    const store = createMemoryAppRequestStore();
    const recorded = await recordAppRequest(store, {
      tenantId: "saas-val-relevance",
      appId: "aprende-hoy",
      requestedBy: "persona-sintetica",
      contracted,
      now: "2026-11-20T00:00:00.000Z",
    });
    assert.deepEqual(recorded, { ok: true, already: false });
    assert.deepEqual(contracted, ["growth-os"]);
    assert.equal((await store.listOpen("saas-val-relevance")).length, 1);
    assert.deepEqual(await store.listOpen("seminario-ipn"), []);
    assert.deepEqual(await store.listOpen("ipn-chile"), []);
  });

  it("no recomienda pendientes ni especializadas como si ya operaran", () => {
    const pending = listManifests()
      .filter((item) => item.integration === "pending" || item.class === "specialized")
      .map((item) => item.id);
    assert.deepEqual(pending, [
      "store",
      "connect",
      "admision",
      "asuntos-estudiantiles",
      "congreso",
    ]);
    for (const item of listManifests()) {
      if (item.integration === "pending" || item.class === "specialized") {
        assert.equal(item.sectors, undefined);
      }
    }
    for (const spaceType of ["education", "business", "community", null]) {
      const bands = desktopBands({
        spaceType,
        contracted: [],
        authorizedApps: null,
        canRequestPlan: true,
      });
      const shown = [...bands.mine, ...bands.recommended, ...bands.explore];
      for (const id of pending) assert.equal(shown.some((item) => item === id), false);
    }

    const pendingWithSector: AppManifest = {
      ...listManifests().find((item) => item.id === "admision")!,
      sectors: ["education"],
    };
    assert.throws(() => validateCatalog([pendingWithSector], []), /rubro/);
  });

  it("la mesa lee el perfil y no escribe el contrato", () => {
    const page = readFileSync(resolve(ROOT, "src/app/escritorio/page.tsx"), "utf8");
    const desk = readFileSync(resolve(ROOT, "src/components/desktop/MentorDesktop.tsx"), "utf8");
    const store = readFileSync(resolve(ROOT, "src/lib/desktop/store.ts"), "utf8");
    assert.match(page, /spaceType=\{contract\.spaceType\}/);
    assert.equal(page.includes("writeSpaceContract"), false);
    assert.match(desk, /Mis aplicaciones/);
    assert.match(desk, /Recomendadas/);
    assert.match(desk, /Explorar catálogo/);
    assert.match(desk, /desktopBands/);
    assert.match(desk, /no contrata/);
    assert.match(store, /spaceType:/);
    assert.match(store, /function writeSpaceContract/);
    const reader = store.slice(store.indexOf("export async function readSpaceContract"), store.indexOf("export async function writeSpaceContract"));
    assert.equal(/updateOne|insertOne|\$set/.test(reader), false);
  });
});
