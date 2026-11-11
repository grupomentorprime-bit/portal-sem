import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("rutas del escritorio", () => {
  it("la solicitud usa el contrato del Espacio y no inserta si ya está contratada", () => {
    const src = read("src/app/api/desktop/requests/route.ts");
    assert.match(src, /recordAppRequest/);
    assert.match(src, /readSpaceContract/);
    assert.match(src, /requireAuth/);
  });

  it("el fondo solo acepta el parser", () => {
    const src = read("src/app/api/desktop/wallpaper/route.ts");
    assert.match(src, /parseWallpaper/);
    assert.match(src, /setDesktopWallpaper/);
  });

  it("el operador escribe el contrato y cierra las solicitudes nuevas", () => {
    const src = read("src/app/api/platform/spaces/[tenantId]/apps/route.ts");
    assert.match(src, /requirePlatformOperator/);
    assert.match(src, /parseContractPatch/);
    assert.match(src, /newlyContracted/);
    assert.match(src, /fulfillOpen/);
  });
});
