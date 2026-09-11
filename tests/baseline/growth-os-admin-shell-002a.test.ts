/**
 * OT-GROWTH-UX-ADMIN-SHELL-002A — origen humano en Personas (mismo mecanismo que Ventas).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { humanizeOriginDisplayLabel } from "../../src/lib/growth/humanize-origin-display";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const TECHNICAL_ORIGIN_ID = /portal-admision/;

describe("OT-GROWTH-UX-ADMIN-SHELL-002A — origen Personas", () => {
  it("reutiliza humanizeOriginDisplayLabel (mismo que Ventas)", () => {
    assert.equal(
      humanizeOriginDisplayLabel("Admisión · portal-admision"),
      "Portal web / Admisión"
    );
    const personasRead = readSrc("src/lib/growth/personas-read.ts");
    assert.match(personasRead, /humanizeOriginDisplayLabel/);
    assert.match(personasRead, /presentPersonaListItem/);
    assert.match(personasRead, /presentPersonaDetail/);

    const ventasRead = readSrc("src/lib/growth/ventas-read.ts");
    assert.match(ventasRead, /humanizeOriginDisplayLabel/);
  });

  it("UI Personas / Inicio / Ventas no hardcodean portal-admision", () => {
    for (const rel of [
      "src/components/admin/growth/PersonasListClient.tsx",
      "src/components/admin/growth/PersonaDetailClient.tsx",
      "src/components/admin/growth/VentasListClient.tsx",
      "src/components/admin/growth/VentasOperateClient.tsx",
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx",
      "src/lib/growth/personas-read.ts",
      "src/lib/growth/ventas-read.ts",
    ]) {
      const src = readSrc(rel);
      assert.doesNotMatch(
        src,
        TECHNICAL_ORIGIN_ID,
        `${rel} no debe exponer portal-admision al usuario`
      );
    }
  });

  it("Personas no inventa un label exclusivo; usa el helper compartido", () => {
    const list = readSrc("src/components/admin/growth/PersonasListClient.tsx");
    const detail = readSrc("src/components/admin/growth/PersonaDetailClient.tsx");
    assert.doesNotMatch(list, /Portal web \/ Admisión/);
    assert.doesNotMatch(detail, /Portal web \/ Admisión/);
    assert.match(list, /item\.originLabel/);
  });
});
