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
import { listFormConvocatorias } from "../../src/lib/admin/forms-center";
import { getConvocatoriaGenerations } from "../../src/lib/experience/forms/generations";
import { formCatalogFor, manifestById, resolveFormEffect, resolvePublicForm } from "../../src/nelzuri";

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

  it("el catálogo de SEM no se siembra en otro Espacio", () => {
    ensureSpecializedCapabilities();
    const sem = formCatalogFor("seminario-ipn");
    assert.ok(sem);
    assert.ok(sem.convocatorias.some((item) => item.formId.includes("talca-aurora")));
    for (const year of ["G-2023", "G-2024", "G-2025", "G-2026"]) {
      assert.ok(sem.generations.some((item) => item.value === year));
    }
    assert.deepEqual(listFormConvocatorias("seminario-ipn").map((item) => item.formId), [
      "convocatoria-talca-aurora-jul-2026",
      "convocatoria-talca-aurora-nov-2026",
    ]);
    assert.ok(getConvocatoriaGenerations("seminario-ipn").some((item) => item.value === "G-2026"));
    for (const spaceId of ["adl", "ipn-chile", "fundacion-mueve", "mentor-prime-capacitacion", "cumple"]) {
      assert.equal(formCatalogFor(spaceId), null, spaceId);
      assert.deepEqual(listFormConvocatorias(spaceId), []);
      assert.equal(
        getConvocatoriaGenerations(spaceId).some((item) => item.value.startsWith("G-20")),
        false,
        spaceId
      );
    }
  });

  it("un efecto no corre en el Espacio de otro cliente", async () => {
    ensureSpecializedCapabilities();
    assert.equal(
      resolveFormEffect({ _id: "ipn-asistencia-congreso-varones-2026" }, "ipn-chile").status,
      "one"
    );
    assert.equal(
      resolveFormEffect({ _id: "ipn-asistencia-congreso-varones-2026" }, "seminario-ipn").status,
      "none"
    );
    assert.equal(resolveFormEffect({ _id: "cumple-diagnostico" }, "cumple").status, "one");
    assert.equal(resolveFormEffect({ _id: "cumple-diagnostico" }, "adl").status, "none");
    assert.equal(
      resolveFormEffect({ _id: "convocatoria-talca-aurora-nov-2026" }, "seminario-ipn").status,
      "one"
    );
    assert.equal(
      resolveFormEffect({ _id: "convocatoria-talca-aurora-nov-2026" }, "ipn-chile").status,
      "none"
    );
    assert.equal(resolveFormEffect({ _id: "information-request" }, "seminario-ipn").status, "none");

    const congress = resolvePublicForm("ipn-asistencia-congreso-varones-2026", "ipn-chile");
    assert.equal(congress.kind, "congress");
    assert.equal(congress.tone, "corporate");
    assert.equal(congress.showBrandHeader, false);
    assert.equal(congress.ambiguous, false);
    const crossed = resolvePublicForm("ipn-asistencia-congreso-varones-2026", "adl");
    assert.equal(crossed.kind, "generic");
    assert.equal(crossed.tone, "default");
    assert.equal(crossed.ambiguous, false);
    const convocatoria = resolvePublicForm("convocatoria-talca-aurora-nov-2026", "seminario-ipn");
    assert.equal(convocatoria.kind, "convocatoria");
    assert.equal(convocatoria.ambiguous, false);

    const cumple = resolveFormEffect({ _id: "cumple-diagnostico" }, "cumple");
    assert.equal(cumple.status, "one");
    if (cumple.status !== "one") return;
    const after = await cumple.effect.afterSave?.({
      tenant: "cumple",
      form: { _id: "cumple-diagnostico", name: "Diagnóstico", errorMessage: "" },
      formId: "cumple-diagnostico",
      data: {},
      submissionId: "envio-inexistente",
    });
    assert.equal(after?.body, undefined);
    assert.equal(after?.extras?.reportPath, undefined);
  });

  it("el servicio transversal ya no contiene los efectos de cada cliente", () => {
    const submit = readFileSync(resolve(ROOT, "src/app/api/experience/forms/[id]/submit/route.ts"), "utf8");
    for (const forbidden of [
      "@/core/congress",
      "@/sites/cumple",
      "@/lib/cumple",
      "getConvocatoriaByFormId",
      "CONGRESS_VARONES",
    ]) {
      assert.equal(submit.includes(forbidden), false, forbidden);
    }
    for (const file of [
      "src/lib/experience/forms/repository.ts",
      "src/lib/admin/forms-center.ts",
    ]) {
      const source = readFileSync(resolve(ROOT, file), "utf8");
      assert.equal(source.includes("isSemTenant"), false, file);
      assert.equal(source.includes("createSemDefaultForms"), false, file);
    }
    const cumple = readFileSync(resolve(ROOT, "src/sites/cumple/form-effect.ts"), "utf8");
    assert.match(cumple, /catch/);
    assert.doesNotMatch(cumple, /deleteOne|updateOne/);
  });

  it("el shell no nombra las rutas institucionales", () => {
    const source = readFileSync(resolve(ROOT, "src/lib/admin/capability-boundary.ts"), "utf8");
    for (const forbidden of [
      "/admin/portal/admission",
      "/admin/portal/asuntos-estudiantiles",
      "/admin/portal/congreso-varones",
    ]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
    const nav = readFileSync(resolve(ROOT, "src/lib/admin/nav-domains.ts"), "utf8");
    assert.equal(nav.includes("id: \"portal-admission\""), false);
    assert.equal(nav.includes("id: \"convocatorias-resultados\""), false);
    assert.equal(nav.includes("id: \"congreso-varones\""), false);
    assert.equal(nav.includes("ipn-asistencia-congreso-varones-2026"), false);
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
