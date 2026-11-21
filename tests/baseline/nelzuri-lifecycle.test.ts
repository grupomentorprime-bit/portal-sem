import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  MENTOR_APPS,
  decideOpening,
  hasRealEntry,
  lifecycleMarks,
  listManifests,
  manifestById,
  projectAppLifecycle,
  validateCatalog,
  type AppManifest,
} from "../../src/nelzuri";

const ROOT = process.cwd();
const none = { productOrigin: false, httpsEntry: null };
const linked = { productOrigin: true, httpsEntry: "https://aula.example" };

describe("ciclo de vida visible en Clientes", () => {
  it("el catálogo publicado declara versión y deja lo pendiente en borrador", () => {
    for (const id of MENTOR_APPS) {
      const item = manifestById(id);
      assert.equal(item.version, "1");
      assert.equal(item.publication, "published");
      assert.equal(item.contractable, true);
    }
    for (const item of listManifests()) {
      if (item.integration !== "pending") continue;
      assert.equal(item.publication, "draft");
      assert.equal(item.contractable, false);
      const view = projectAppLifecycle({
        appId: item.id,
        tenantId: "saas-val-ciclo",
        contractedApps: [item.id, ...MENTOR_APPS],
        requestedApps: [item.id],
        signals: linked,
      });
      assert.equal(view.operational, false);
      assert.equal(view.published, false);
      assert.equal(view.available, false);
      assert.equal(view.contracted, false);
      assert.equal(view.enabled, false);
      assert.equal(view.authorized, false);
      assert.equal(view.requested, false);
      assert.deepEqual(lifecycleMarks(view).slice(-1), ["No operativa"]);
    }
  });

  it("separa publicada, disponible, contratada, habilitada y autorizada", () => {
    const growth = projectAppLifecycle({
      appId: "growth-os",
      tenantId: "saas-val-ciclo",
      contractedApps: ["growth-os"],
      requestedApps: ["growth-os"],
      signals: none,
    });
    assert.equal(growth.published, true);
    assert.equal(growth.available, true);
    assert.equal(growth.contracted, true);
    assert.equal(growth.enabled, true);
    assert.equal(growth.authorized, false);
    assert.equal(growth.requested, false);
    assert.deepEqual(lifecycleMarks(growth), [
      "Transversal",
      "Versión 1",
      "Interna",
      "Publicada",
      "Disponible",
      "Contratada",
      "Habilitada",
      "Autorización por persona",
    ]);

    const click = decideOpening({
      appId: "growth-os",
      tenantId: "saas-val-ciclo",
      contracted: ["growth-os"],
      authorized: [],
      signals: none,
    });
    assert.equal(click.kind, "unauthorized");
    assert.equal(growth.enabled, true);
  });

  it("un pedido no contrata y un contrato vacío no habilita", () => {
    const asked = projectAppLifecycle({
      appId: "aprende-hoy",
      tenantId: "saas-val-ciclo",
      contractedApps: [],
      requestedApps: ["aprende-hoy"],
      signals: linked,
    });
    assert.equal(asked.contracted, false);
    assert.equal(asked.enabled, false);
    assert.equal(asked.requested, true);
    assert.equal(asked.available, true);

    const bare = projectAppLifecycle({
      appId: "rrhh",
      tenantId: "saas-val-ciclo",
      contractedApps: [],
      signals: none,
    });
    assert.equal(bare.available, false);
    assert.equal(bare.contracted, false);
    assert.equal(bare.enabled, false);
    assert.ok(lifecycleMarks(bare).includes("Sin contratar"));
    assert.ok(lifecycleMarks(bare).includes("Sin habilitar"));
  });

  it("contratar sin entrada no habilita, y Cumple no se abre fuera de su Espacio", () => {
    const aprende = projectAppLifecycle({
      appId: "aprende-hoy",
      tenantId: "saas-val-ciclo",
      contractedApps: ["aprende-hoy"],
      signals: none,
    });
    assert.equal(aprende.contracted, true);
    assert.equal(aprende.available, false);
    assert.equal(aprende.enabled, false);

    const withEntry = projectAppLifecycle({
      appId: "aprende-hoy",
      tenantId: "saas-val-ciclo",
      contractedApps: ["aprende-hoy"],
      signals: { productOrigin: false, httpsEntry: "https://aula.example" },
    });
    assert.equal(withEntry.available, true);
    assert.equal(withEntry.enabled, true);

    const cumple = projectAppLifecycle({
      appId: "cumple",
      tenantId: "saas-val-ciclo",
      contractedApps: ["cumple"],
      signals: linked,
    });
    assert.equal(cumple.contracted, true);
    assert.equal(cumple.available, false);
    assert.equal(cumple.enabled, false);

    const atHome = projectAppLifecycle({
      appId: "cumple",
      tenantId: "cumple",
      contractedApps: ["cumple"],
      signals: linked,
    });
    assert.equal(atHome.available, true);
    assert.equal(atHome.enabled, true);
  });

  it("la pausa no es un dato que borre el contrato", () => {
    const source = readFileSync(resolve(ROOT, "src/nelzuri/catalog/lifecycle.ts"), "utf8");
    assert.equal(/suspended|deleteMany|\$unset|writeAudit|updateOne/.test(source), false);
    const kept = projectAppLifecycle({
      appId: "growth-os",
      tenantId: "saas-val-ciclo",
      contractedApps: ["growth-os", "rrhh"],
      signals: linked,
    });
    assert.deepEqual(
      ["growth-os", "rrhh"].filter((id) =>
        projectAppLifecycle({
          appId: id,
          tenantId: "saas-val-ciclo",
          contractedApps: ["growth-os", "rrhh"],
          signals: linked,
        }).contracted
      ),
      ["growth-os", "rrhh"]
    );
    assert.equal(kept.contracted, true);
  });

  it("la entrada real coincide con el clic cuando el contrato y la llave ya están", () => {
    const cases = [
      { appId: "growth-os" as const, tenantId: "saas-val-ciclo", signals: none },
      { appId: "rrhh" as const, tenantId: "saas-val-ciclo", signals: none },
      { appId: "rrhh" as const, tenantId: "saas-val-ciclo", signals: linked },
      { appId: "aprende-hoy" as const, tenantId: "saas-val-ciclo", signals: none },
      {
        appId: "aprende-hoy" as const,
        tenantId: "saas-val-ciclo",
        signals: { productOrigin: false, httpsEntry: "https://aula.example" },
      },
      { appId: "cumple" as const, tenantId: "saas-val-ciclo", signals: linked },
      { appId: "cumple" as const, tenantId: "cumple", signals: linked },
    ];
    for (const item of cases) {
      const click = decideOpening({
        appId: item.appId,
        tenantId: item.tenantId,
        contracted: [...MENTOR_APPS],
        authorized: [...MENTOR_APPS],
        signals: item.signals,
      });
      assert.equal(
        hasRealEntry(item.appId, item),
        click.kind === "open" || click.kind === "connect",
        item.appId
      );
    }
  });

  it("un borrador no se contrata y una pendiente no se publica como servicio", () => {
    const draft: AppManifest = {
      ...manifestById("growth-os"),
      id: "growth-os",
      publication: "draft",
    };
    assert.throws(() => validateCatalog([draft], ["growth-os"]), /publicada/);
    const pending: AppManifest = {
      ...manifestById("store"),
      publication: "published",
    };
    assert.throws(() => validateCatalog([pending], []), /servicio operativo/);
  });

  it("el contrato y su auditoría siguen en el mismo endpoint", () => {
    const route = readFileSync(
      resolve(ROOT, "src/app/api/platform/spaces/[tenantId]/apps/route.ts"),
      "utf8"
    );
    assert.match(route, /action: "platform.space.contract"/);
    assert.match(route, /if \(appsChanged \|\| entryChanged\)/);
    assert.match(route, /contractedApps\?: unknown/);
    assert.match(route, /aprendeHoyEntryUrl\?: unknown/);
    assert.equal(route.includes("projectAppLifecycle"), false);
    assert.equal(/deleteMany|\$unset|\$pull/.test(route), false);

    const consoleSrc = readFileSync(
      resolve(ROOT, "src/components/desktop/DesktopClientConsole.tsx"),
      "utf8"
    );
    assert.match(consoleSrc, /projectAppLifecycle/);
    assert.match(consoleSrc, /Este estado no quita aplicaciones del plan/);
    assert.match(consoleSrc, /Un pedido no contrata/);
    assert.match(consoleSrc, /method: "POST"/);
    assert.match(consoleSrc, /contractedApps: apps/);
    assert.equal(consoleSrc.includes("provisionRrhhCompany"), false);
    assert.equal(consoleSrc.includes("provisionAprendeHoyCompany"), false);
  });
});
