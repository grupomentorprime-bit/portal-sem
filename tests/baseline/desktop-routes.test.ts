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

  it("al entrar o al activar Aprende Hoy se crea el perfil master", () => {
    const company = read("src/lib/desktop/ensure-client-company.ts");
    assert.match(company, /provisionAprendeHoyCompany/);
    assert.match(company, /provisionRrhhCompany/);
    const provision = read("src/lib/connect/provision-aprende-hoy.ts");
    assert.match(provision, /\/api\/connect\/provision/);
    const access = read("src/app/api/platform/spaces/[tenantId]/access/route.ts");
    assert.match(access, /ensureClientCompany/);
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
    assert.match(src, /provisionAprendeHoyCompany/);
    assert.match(src, /provisionRrhhCompany/);
    assert.match(src, /ensureDeskProduct/);
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

  it("dueño dentro de un cliente sincroniza la cookie al cambiar de Espacio", () => {
    const desk = read("src/components/desktop/MentorDesktop.tsx");
    assert.match(desk, /canReturnToPlatform/);
    assert.match(desk, /if \(props\.canReturnToPlatform\) \{\s*await enterClient\(tenantId\);/);
    assert.match(desk, /if \(owner \|\| props\.canReturnToPlatform\) void enterClient\(tenantId\)/);
    const menu = read("src/components/admin/AdminUserMenuPanel.tsx");
    assert.match(menu, /syncEnteredClientCookie/);
    const catalog = read("src/lib/desktop/catalog.ts");
    assert.match(catalog, /function syncEnteredClientCookie/);
    assert.match(catalog, /if \(!tenantId \|\| !readEnteredClientCookie\(\)\) return;/);
  });

  it("Growth OS y Cumple ofrecen volver al escritorio", () => {
    const top = read("src/components/admin/kit/navigation/AdminTopBar.tsx");
    assert.match(top, /href="\/escritorio"/);
    assert.match(top, /Escritorio/);
    const shell = read("src/components/sites/cumple/CumpleShell.tsx");
    assert.match(shell, /EscritorioReturn/);
    assert.match(shell, /escritorioReturnHref/);
    const back = read("src/components/desktop/EscritorioReturn.tsx");
    assert.match(back, /\/api\/connect\/session/);
    assert.match(back, /isSafeEscritorioHref/);
  });

  it("identity me serializa avatar del escritorio", () => {
    const route = read("src/app/api/identity/me/route.ts");
    assert.match(route, /avatarPresetId:\s*user\.avatarPresetId\s*\?\?\s*null/);
    assert.match(route, /avatarPhoto:\s*user\.avatarPhoto\s*===\s*true/);
    assert.match(route, /avatarPhotoUpdatedAt:\s*user\.avatarPhotoUpdatedAt\s*\?\?\s*null/);
  });

  it("la barra del escritorio usa DesktopAvatar y refresca al cambiar avatar", () => {
    const page = read("src/app/escritorio/page.tsx");
    assert.match(page, /avatarPresetId:\s*session\.user\.avatarPresetId/);
    assert.match(page, /avatarPhoto:\s*session\.user\.avatarPhoto\s*===\s*true/);
    assert.match(page, /avatarPhotoUpdatedAt:\s*session\.user\.avatarPhotoUpdatedAt/);
    assert.match(page, /id:\s*session\.user\._id/);

    const desk = read("src/components/desktop/MentorDesktop.tsx");
    assert.match(desk, /DesktopAvatar/);
    assert.match(desk, /resolveDesktopAvatar/);
    assert.match(desk, /onAvatarChanged=\{/);
    assert.match(desk, /setAvatarState/);
  });

  it("la ficha del Espacio muestra las aplicaciones y guarda el contrato", () => {
    const view = read("src/components/platform/PlatformSpaceDetailView.tsx");
    assert.match(view, /SpaceAppsPanel/);
    const panel = read("src/components/platform/SpaceAppsPanel.tsx");
    assert.match(panel, /\/api\/platform\/spaces\//);
    assert.match(panel, /contractedApps/);
    assert.match(panel, /Solicitud abierta/);
  });
});
