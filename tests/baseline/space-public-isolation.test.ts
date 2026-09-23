import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { composeStoredPublicHome } from "../../src/core/portal/renderer/public-home";
import {
  getConvocatoriaByFormId,
  getSupersededFormIds,
} from "../../src/lib/admin/forms-center";
import { getDefaultMenusForTenant } from "../../src/lib/cms/menu-defaults";
import { buildDefaultFormExperience } from "../../src/lib/cms/form-experience-defaults";
import { semEditorialPage } from "../../src/lib/portal/sem-identity-v7";

const SPACE = "mentor-prime-capacitacion";
const OTHER = "adl";
const SEM_MARKERS = ["IPN", "Seminario", "Talca", "El SEM"];

function serialized(value: unknown): string {
  return JSON.stringify(value);
}

describe("aislamiento público entre Espacios", () => {
  it("un home vacío no hereda la portada del SEM", () => {
    const home = composeStoredPublicHome(SPACE, {
      title: "Mentor Prime Capacitacion",
      blocks: [],
      seo: { title: "Mentor Prime Capacitacion" },
    });

    assert.equal(home.tenantId, SPACE);
    assert.equal(home.blocks.length, 1);
    assert.equal(home.blocks[0]?.type, "hero");
    assert.equal(home.blocks[0]?.settings.variant, "default");
    for (const marker of SEM_MARKERS) {
      assert.equal(serialized(home).includes(marker), false, marker);
    }

    const sem = composeStoredPublicHome(SEM_TENANT_ID, {
      title: "Inicio",
      blocks: [],
      seo: {},
    });
    assert.equal(serialized(sem).includes("Tu llamado merece"), true);
  });

  it("los bloques propios se conservan y no se mezclan con el editorial SEM", () => {
    const home = composeStoredPublicHome(OTHER, {
      title: "ADL",
      blocks: [
        {
          id: "propio",
          type: "text",
          visible: true,
          order: 0,
          settings: { title: "Curso interno de ADL" },
        },
      ],
      seo: {},
    });

    assert.equal(home.blocks.length, 1);
    assert.equal(home.blocks[0]?.settings.title, "Curso interno de ADL");
    assert.equal(semEditorialPage("/el-sem", OTHER), null);
    assert.equal(semEditorialPage("/", SPACE), null);
  });

  it("menús y formularios del SEM no se ofrecen a otro Espacio", () => {
    const labels = getDefaultMenusForTenant(SPACE).flatMap((menu) =>
      (menu.items ?? []).map((item) => item.title)
    );
    assert.equal(labels.includes("El SEM"), false);
    assert.equal(labels.includes("IPN Chile — Iglesia Pentecostal Nazareth"), false);

    const semLabels = getDefaultMenusForTenant(SEM_TENANT_ID).flatMap((menu) =>
      (menu.items ?? []).map((item) => item.title)
    );
    assert.equal(semLabels.includes("El SEM"), true);

    assert.equal(
      getConvocatoriaByFormId("convocatoria-talca-aurora-jul-2026", SPACE),
      undefined
    );
    assert.equal(getSupersededFormIds(SPACE).size, 0);
    assert.equal(getSupersededFormIds(SEM_TENANT_ID).has("attendance-confirmation"), true);

    const experience = buildDefaultFormExperience(
      SPACE,
      "convocatoria-talca-aurora-jul-2026",
      "Solicitud propia"
    );
    assert.equal(serialized(experience).includes("Talca"), false);
    assert.equal(experience.hero.headline, "Solicitud propia");
  });
});
