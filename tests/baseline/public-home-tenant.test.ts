/**
 * La home pública vacía de un Espacio no hereda bloques, héroe ni copia del SEM.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { composeStoredPublicHome } from "../../src/core/portal/renderer/public-home";

const MENTOR_TENANT_ID = "mentor-prime-capacitacion";
const SEM_MARKERS = [
  "Seminario Eclesiástico",
  "Formamos líderes",
  "Cómo se estudia en el SEM",
  "IPN Chile",
];

function serialized(page: ReturnType<typeof composeStoredPublicHome>): string {
  return JSON.stringify(page);
}

describe("composeStoredPublicHome", () => {
  it("un Espacio sin bloques no recibe la home del SEM", () => {
    for (const tenantId of [ADL_TENANT_ID, MENTOR_TENANT_ID]) {
      const page = composeStoredPublicHome(tenantId, {
        title: tenantId,
        blocks: [],
        seo: { title: tenantId, description: `Portal de ${tenantId}` },
      });

      assert.equal(page.tenantId, tenantId);
      assert.equal(page.blocks.length, 1);
      assert.equal(page.blocks[0]?.type, "hero");
      assert.equal(page.blocks[0]?.settings.variant, "default");
      const body = serialized(page);
      for (const marker of SEM_MARKERS) {
        assert.equal(body.includes(marker), false, marker);
      }
    }
  });

  it("los bloques publicados del Espacio se conservan", () => {
    const page = composeStoredPublicHome(MENTOR_TENANT_ID, {
      title: "Mentor Capacitacion",
      blocks: [
        {
          id: "propio",
          type: "text",
          visible: true,
          order: 0,
          settings: { title: "Cursos de Mentor Prime" },
        },
      ],
      seo: {},
    });

    assert.equal(page.blocks.length, 1);
    assert.equal(page.blocks[0]?.id, "propio");
    assert.equal(page.blocks[0]?.settings.title, "Cursos de Mentor Prime");
  });

  it("SEM sin bloques sigue en su composición institucional", () => {
    const page = composeStoredPublicHome(SEM_TENANT_ID, {
      title: "Inicio",
      blocks: [],
      seo: {},
    });

    assert.equal(page.tenantId, SEM_TENANT_ID);
    assert.equal(serialized(page).includes("Tu llamado merece"), true);
    assert.equal(serialized(page).includes("Seminario Eclesiástico"), true);
  });
});
