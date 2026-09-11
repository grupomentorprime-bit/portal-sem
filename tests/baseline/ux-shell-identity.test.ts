/**
 * OT-GROWTH-UX-SHELL-002 — chrome Growth OS + lenguaje Inicio + tema neutro platform.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";

const ROOT = resolve(process.cwd());

function readSrc(rel: string) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("OT-GROWTH-UX-SHELL-002 — identidad y shell", () => {
  it("navegación y breadcrumbs usan Inicio (no Dashboard)", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    const crumbs = readSrc("src/lib/admin/breadcrumb-from-path.ts");
    assert.match(nav, /id: "dashboard",\s*label: "Inicio"/);
    assert.doesNotMatch(nav, /id: "dashboard",\s*label: "Dashboard"/);
    assert.match(crumbs, /label: "Inicio"/);
    assert.doesNotMatch(crumbs, /label: "Dashboard"/);
    assert.match(crumbs, /admin: "Inicio"/);
  });

  it("ProductChrome + tema neutro existen para platform/auth", () => {
    const mark = readSrc("src/components/product/ProductMark.tsx");
    const auth = readSrc("src/components/product/ProductAuthFrame.tsx");
    const neutral = readSrc("src/components/product/PlatformNeutralTheme.tsx");
    const brand = readSrc("src/styles/tokens/brand.css");
    const colors = readSrc("src/styles/tokens/colors.css");
    const platformShell = readSrc("src/components/platform/PlatformShell.tsx");
    const login = readSrc("src/app/admin/login/page.tsx");
    const noSpace = readSrc("src/app/admin/sin-espacio/page.tsx");
    const platformLayout = readSrc("src/app/platform/layout.tsx");

    assert.match(mark, /PLATFORM_DISPLAY_NAME/);
    assert.match(mark, /isotipo/);
    assert.match(auth, /ProductMark/);
    assert.match(neutral, /growth-os-primary/);
    assert.match(neutral, /color-background-default/);
    assert.match(brand, /--growth-os-primary:\s*#0e4f90/i);
    assert.match(brand, /--growth-os-secondary:\s*#6c99cd/i);
    assert.match(brand, /--growth-os-accent:\s*#7c5cfa/i);
    assert.match(brand, /--growth-os-success:\s*#18b981/i);
    assert.match(brand, /--growth-os-light:\s*#f59b45/i);
    assert.match(colors, /--gray-50:\s*#f4f7fb/i);
    assert.match(colors, /--color-background-default:\s*#f4f7fb/i);
    assert.match(colors, /--color-surface-default:\s*#ffffff/i);
    assert.match(platformShell, /PlatformNeutralTheme/);
    assert.match(platformShell, /Espacios/);
    assert.match(platformShell, /Ir al Espacio/);
    assert.match(login, /ProductAuthFrame/);
    assert.match(noSpace, /ProductAuthFrame/);
    assert.match(platformLayout, /ProductAuthFrame/);
    assert.equal(PLATFORM_DISPLAY_NAME, "Growth OS");
  });

  it("SEM/ADL conservan pack de identidad aparte del default Growth OS", () => {
    const colorsTs = readSrc("src/design/tokens/colors.ts");
    const sem = readSrc("src/core/tenant/sem-site-identity.ts");
    const adl = readSrc("src/core/tenant/adl-site-identity.ts");
    assert.match(colorsTs, /semSiteBrandColors/);
    assert.match(colorsTs, /adlSiteBrandColors/);
    assert.match(colorsTs, /primary:\s*"#002A47"/);
    assert.match(sem, /semSiteBrandColors/);
    assert.doesNotMatch(sem, /colorDefaults\.(primary|secondary)/);
    assert.match(adl, /adlSiteBrandColors/);
    assert.doesNotMatch(adl, /colorDefaults\.(success|danger)/);
  });

  it("Shell V2: producto en chrome; Espacio en sidebar; buscador Personas en topbar", () => {
    const topBar = readSrc("src/components/admin/kit/navigation/AdminTopBar.tsx");
    const sidebar = readSrc("src/components/admin/kit/navigation/AdminSidebar.tsx");
    assert.match(topBar, /ProductMark/);
    assert.match(topBar, /Buscar personas/);
    assert.match(topBar, /\/admin\/personas/);
    assert.doesNotMatch(topBar, /GlobalSearch/);
    assert.match(sidebar, /PLATFORM_DISPLAY_NAME|ProductMark/);
    assert.match(sidebar, /Espacio activo/);
  });

  it("copy visible no usa CMS seguro / usuarios CMS en superficies principales", () => {
    const dashboard = readSrc("src/components/admin/AdminDashboardClient.tsx");
    const status = readSrc("src/components/admin/AdminStatusBadges.tsx");
    assert.doesNotMatch(dashboard, /CMS seguro|CMS compat\./);
    assert.doesNotMatch(status, /\bCMS\b/);
  });

  it("Shell V1 queda deprecado pero conservado detrás del flag", () => {
    const header = readSrc("src/components/admin/AdminInstitutionalHeader.tsx");
    const shell = readSrc("src/components/identity/AdminShell.tsx");
    const flags = readSrc("src/lib/admin/feature-flags.ts");
    assert.match(header, /@deprecated/);
    assert.match(shell, /AdminInstitutionalHeader/);
    assert.match(flags, /ADMIN_SHELL_V2/);
  });
});
