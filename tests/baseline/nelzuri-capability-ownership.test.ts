import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { APP_MANIFESTS, MENTOR_APPS } from "../../src/nelzuri/catalog/manifests";
import {
  createCapabilityRegistry,
  SPECIALIZED_APPS,
  type SpecializedFormEffect,
  type SpecializedManifestRegistration,
} from "../../src/nelzuri/contracts/capabilities";
import { ensureSpecializedCapabilities } from "../../src/lib/desktop/register-specialized";
import { manifestById } from "../../src/nelzuri";

const ROOT = process.cwd();

function registry() {
  return createCapabilityRegistry({
    transversal: APP_MANIFESTS,
    contractableOrder: MENTOR_APPS,
  });
}

function registration(id: string, spaceId = "espacio-demo"): SpecializedManifestRegistration {
  return {
    manifest: {
      id,
      class: "specialized",
      integration: "internal",
      version: "1",
      publication: "published",
      label: id,
      blurb: "Capacidad de prueba",
      contractable: false,
      defaultContract: { when: "never" },
      requiresSpaceId: spaceId,
      door: { anyPermission: ["example.read"] },
      open: { type: "internal", href: `/admin/portal/${id}` },
    },
    insertNavAfter: "institution-branding",
    navGroupId: "institucion",
    navSequence: 0,
    navItem: {
      id: `${id}-item`,
      href: `/admin/portal/${id}`,
      label: id,
      matchPrefixes: [`/admin/portal/${id}`],
      requiredAnyPermission: ["example.read"],
    },
  };
}

describe("registro de capacidades especializadas", () => {
  it("publica en orden estable, es idempotente y no depende del orden de inscripción", () => {
    const book = registry();
    const later = registration("zeta-capacidad");
    const earlier = registration("alfa-capacidad");
    book.setInstaller(() => {
      book.registerSpecializedManifest(later);
      book.registerSpecializedManifest(earlier);
      book.registerSpecializedManifest(earlier);
    });
    book.ensure();
    book.ensure();
    assert.deepEqual(book.specializedIds, ["alfa-capacidad", "zeta-capacidad"]);
    assert.equal(book.manifest("alfa-capacidad")?.requiresSpaceId, "espacio-demo");
  });

  it("no publica una capacidad con la puerta o la navegación incompletas", () => {
    const book = registry();
    const broken = registration("sin-puerta");
    broken.manifest = { ...broken.manifest, door: undefined };
    assert.throws(() => book.registerSpecializedManifest(broken), /puerta de autorización/);
    const drifted = registration("puerta-distinta");
    drifted.navItem = { ...drifted.navItem, requiredAnyPermission: ["otra.read"] };
    assert.throws(() => book.registerSpecializedManifest(drifted), /misma puerta/);
    book.setInstaller(() => undefined);
    book.ensure();
    assert.deepEqual(book.specializedIds, []);
  });

  it("un registro contradictorio no reemplaza la ficha", () => {
    const book = registry();
    const original = registration("estable");
    book.registerSpecializedManifest(original);
    const changed = registration("estable");
    changed.manifest = { ...changed.manifest, label: "Otra" };
    assert.throws(() => book.registerSpecializedManifest(changed), /otros datos/);
    book.setInstaller(() => undefined);
    book.ensure();
    assert.equal(book.manifest("estable")?.label, "estable");
  });

  it("no aplica un efecto en un Espacio distinto y se niega si dos efectos coinciden", () => {
    const book = registry();
    const effect: SpecializedFormEffect = {
      id: "informe",
      spaceId: "cumple",
      matches: () => true,
      afterSave: async () => ({ extras: { reportPath: "/informe" } }),
    };
    book.registerFormEffect(effect);
    book.registerFormEffect(effect);
    book.setInstaller(() => undefined);
    book.ensure();
    assert.equal(book.formCatalogFor("adl"), null);
    assert.deepEqual(book.resolveFormEffect({ _id: "cumple-diagnostico" }, "adl"), { status: "none" });
    assert.equal(book.resolveFormEffect({ _id: "cumple-diagnostico" }, "cumple").status, "one");
    assert.deepEqual(book.resolvePublicForm("form", "adl"), {
      kind: "generic",
      tone: "default",
      showBrandHeader: true,
      ambiguous: false,
    });

    const clash = registry();
    const other: SpecializedFormEffect = { ...effect, id: "informe-2" };
    clash.registerFormEffect(effect);
    clash.registerFormEffect(other);
    clash.setInstaller(() => undefined);
    clash.ensure();
    assert.equal(clash.resolveFormEffect({ _id: "cumple-diagnostico" }, "cumple").status, "ambiguous");
  });

  it("el catálogo real sigue publicando las tres capacidades ya operativas", () => {
    ensureSpecializedCapabilities();
    ensureSpecializedCapabilities();
    assert.deepEqual([...SPECIALIZED_APPS], ["admision", "asuntos-estudiantiles", "congreso"]);
    assert.equal(manifestById("admision").requiresSpaceId, "seminario-ipn");
    assert.equal(manifestById("congreso").open.type, "internal");
  });

  it("el contrato no importa módulos de cliente", () => {
    const source = readFileSync(resolve(ROOT, "src/nelzuri/contracts/capabilities.ts"), "utf8");
    for (const forbidden of [
      "@/lib/portal",
      "@/lib/student-affairs",
      "@/core/congress",
      "@/core/units/ipn-chile",
      "@/sites/cumple",
      "@/lib/cumple",
      "@/core/tenant/is-sem",
    ]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
  });
});
