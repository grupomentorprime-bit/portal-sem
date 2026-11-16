/**
 * Cargar cuentas no debe armar el catálogo completo de Espacios
 * (sitio, dominio, miembros y media por cliente).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("carga de cuentas de la plataforma", () => {
  it("no llama al catálogo completo de Espacios", () => {
    const maintainer = readSrc("src/lib/platform/user-maintainer.ts");
    const route = readSrc("src/app/api/platform/users/route.ts");
    const page = readSrc("src/app/platform/usuarios/page.tsx");

    for (const src of [maintainer, route, page]) {
      assert.doesNotMatch(src, /listPlatformSpaces\(/);
    }

    assert.match(maintainer, /listPlatformSpaceNames/);
    assert.match(readSrc("src/lib/platform/spaces.ts"), /export async function listPlatformSpaceNames/);
  });

  it("incluye campos de avatar en el roster mantenido", () => {
    const maintainer = readSrc("src/lib/platform/user-maintainer.ts");

    assert.match(maintainer, /avatarPresetId:\s*1/);
    assert.match(maintainer, /avatarPhoto:\s*1/);
    assert.match(maintainer, /avatarPhotoUpdatedAt:\s*1/);
    assert.match(maintainer, /avatarPresetId:/);
    assert.match(maintainer, /avatarPhoto:\s*user\.avatarPhoto\s*===\s*true/);
    assert.match(maintainer, /avatarPhotoUpdatedAt:\s*typeof user\.avatarPhotoUpdatedAt === "string"/);
  });
});
