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
    const login = readSrc("src/app/login/page.tsx");
    const noSpace = readSrc("src/app/admin/sin-espacio/page.tsx");
    const platformLayout = readSrc("src/app/platform/layout.tsx");

    assert.match(mark, /PLATFORM_DISPLAY_NAME/);
    assert.match(mark, /isotipo/);
    assert.match(auth, /ProductMark/);
    assert.match(neutral, /growth-os-primary/);
    assert.match(neutral, /color-background-default/);
    assert.match(brand, /--growth-os-primary:\s*#6d28d9/i);
    assert.match(brand, /--growth-os-secondary:\s*#a78bfa/i);
    assert.match(brand, /--growth-os-accent:\s*#22d3ee/i);
    assert.match(brand, /--growth-os-success:\s*#18b981/i);
    assert.match(brand, /--growth-os-light:\s*#f59b45/i);
    assert.match(colors, /--gray-50:\s*#f7f5ff/i);
    assert.match(colors, /--color-background-default:\s*#f7f5ff/i);
    assert.match(colors, /--color-surface-default:\s*#ffffff/i);
    assert.match(platformShell, /PlatformNeutralTheme/);
    assert.match(platformShell, /Espacios/);
    assert.match(platformShell, /Ir al Espacio/);
    assert.match(login, /ThresholdLogin/);
    assert.match(login, /PlatformNeutralTheme/);
    assert.doesNotMatch(login, /ProductAuthFrame/);
    assert.match(noSpace, /ProductAuthFrame/);
    assert.match(platformLayout, /ProductAuthFrame/);
    assert.equal(PLATFORM_DISPLAY_NAME, "NELZURI");
  });

  it("SEM/ADL conservan pack de identidad aparte del default NELZURI", () => {
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
    assert.match(sidebar, /Plan Pro/);
    assert.doesNotMatch(sidebar, /Acelera tu crecimiento/);
  });

  it("legales públicos y la portada nombran NELZURI y fechan el cambio", () => {
    const legal = readSrc("src/core/legal/platform/content.ts");
    const legalPage = readSrc("src/app/legal/page.tsx");
    const constants = readSrc("src/core/legal/platform/constants.ts");
    const landing = readSrc("src/components/platform/PlatformPublicLanding.tsx");
    assert.match(constants, /PLATFORM_LEGAL_LAST_UPDATED = "2026-11-19"/);
    assert.doesNotMatch(legal, /Growth OS/);
    assert.doesNotMatch(legalPage, /Growth OS/);
    assert.match(legal, /Qué es \$\{PRODUCT\}/);
    assert.match(legal, /Uso de \$\{PRODUCT\}/);
    assert.match(legal, /eliminemos tus datos de \$\{PRODUCT\}/);
    assert.match(legal, /dentro de \$\{PRODUCT\}/);
    assert.doesNotMatch(landing, /Growth OS/);
    assert.match(landing, /PLATFORM_DISPLAY_NAME/);
  });

  it("copy visible no usa CMS seguro / usuarios CMS en superficies principales", () => {
    const dashboard = readSrc("src/components/admin/AdminDashboardClient.tsx");
    const status = readSrc("src/components/admin/AdminStatusBadges.tsx");
    assert.doesNotMatch(dashboard, /CMS seguro|CMS compat\./);
    assert.doesNotMatch(dashboard, /Growth OS/);
    assert.match(dashboard, /PLATFORM_DISPLAY_NAME/);
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
