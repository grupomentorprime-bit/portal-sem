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
    assert.match(src, /findTenantById/);
    assert.match(src, /getDatabase/);
    assert.match(src, /if\s*\(!tenant\)\s*return NextResponse\.json\(\{ ok: false \}, \{ status: 404 \}\)/);
    assert.match(src, /readSpaceContract\(tenant\.tenantId\)/);
    assert.match(src, /writeSpaceContract\(tenant\.tenantId,\s*patch\)/);
    assert.match(src, /fulfillOpen\(tenant\.tenantId,\s*appId\)/);
  });

  it("la store ignora el duplicado abierto concurrente", () => {
    const src = read("src/lib/desktop/store.ts");
    assert.match(src, /code\s*===\s*11000/);
    assert.match(src, /return;/);
  });

  it("la página redirige con escritorioRedirect y pinta MentorDesktop", () => {
    const src = read("src/app/escritorio/page.tsx");
    assert.match(src, /escritorioRedirect/);
    assert.match(src, /MentorDesktop/);
    assert.match(src, /readSpaceContract/);
    const menu = read("src/components/admin/AdminUserMenuPanel.tsx");
    assert.match(menu, /spaceSwitchLanding/);
  });

  it("Growth OS y Cumple ofrecen volver al escritorio", () => {
    const top = read("src/components/admin/kit/navigation/AdminTopBar.tsx");
    assert.match(top, /href="\/escritorio"/);
    assert.match(top, /Escritorio/);
    const shell = read("src/components/sites/cumple/CumpleShell.tsx");
    assert.match(shell, /EscritorioReturn/);
    const back = read("src/components/desktop/EscritorioReturn.tsx");
    assert.match(back, /\/api\/identity\/me/);
    assert.match(back, /href="\/escritorio"/);
  });
});
