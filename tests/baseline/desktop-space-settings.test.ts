import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SPACE_SETTING_GROUPS,
  filterSpaceSettingGroups,
  hasAnySpaceSetting,
  spaceSettingHref,
} from "../../src/lib/desktop/space-settings";
import { ACCOUNT_SECTIONS, wallpaperLabel } from "../../src/lib/desktop/account";

describe("ajustes de empresa y mi cuenta", () => {
  it("separa Presencia: Mi empresa, Marca y Sitio web sin Seguridad personal", () => {
    const labels = SPACE_SETTING_GROUPS.flatMap((group) =>
      group.items.map((item) => item.label)
    );
    assert.deepEqual(labels, [
      "Mi empresa",
      "Marca",
      "Sitio web",
      "Equipo",
      "Roles y permisos",
      "Canales",
      "Integraciones",
    ]);
    assert.equal(labels.includes("Seguridad"), false);

    const presencia = SPACE_SETTING_GROUPS.find((group) => group.title === "Presencia");
    assert.ok(presencia);
    assert.equal(presencia.items[0]?.kind, "panel");
    assert.equal(presencia.items[1]?.kind, "panel");
    assert.equal(presencia.items[2]?.kind, "panel");
    assert.equal(spaceSettingHref(presencia.items[0]!), null);
    assert.equal(spaceSettingHref(presencia.items[2]!), null);
    assert.equal(presencia.items[2]?.panel, "sitio");
    assert.equal(presencia.items[2]?.requiresApp, "growth-os");

    const personas = SPACE_SETTING_GROUPS.find((group) => group.title === "Personas");
    assert.ok(personas);
    assert.equal(personas.items[0]?.id, "equipo");
    assert.equal(personas.items[0]?.kind, "panel");
    assert.equal(personas.items[0]?.panel, "equipo");
    assert.equal(spaceSettingHref(personas.items[0]!), null);
  });

  it("filtra por permisos y plan del Espacio", () => {
    const admissions = filterSpaceSettingGroups(
      ["cms.pages.read", "growth.sales.read"],
      undefined,
      ["growth-os"]
    );
    assert.deepEqual(
      admissions.flatMap((group) => group.items.map((item) => item.id)),
      ["sitio"]
    );
    assert.equal(hasAnySpaceSetting(["cms.pages.read"], ["growth-os"]), true);
    assert.equal(hasAnySpaceSetting(["cms.pages.read"], []), false);
    assert.equal(hasAnySpaceSetting(["growth.sales.read"], ["growth-os"]), false);
    assert.equal(hasAnySpaceSetting(["experience.forms.read"], ["growth-os"]), false);

    const admin = filterSpaceSettingGroups(
      ["settings.update", "settings.team", "settings.integrations"],
      undefined,
      ["growth-os"]
    );
    assert.deepEqual(
      admin.flatMap((group) => group.items.map((item) => item.id)),
      ["empresa", "marca", "sitio", "equipo", "canales", "integraciones"]
    );

    const withoutGrowth = filterSpaceSettingGroups(
      ["settings.update", "settings.team", "settings.integrations", "identity.roles.manage"],
      undefined,
      []
    );
    assert.deepEqual(
      withoutGrowth.flatMap((group) => group.items.map((item) => item.id)),
      ["empresa", "marca", "equipo", "roles", "canales", "integraciones"]
    );
  });

  it("define Mi cuenta con perfil, preferencias y seguridad operativa", () => {
    assert.deepEqual(
      ACCOUNT_SECTIONS.map((section) => section.id),
      ["perfil", "preferencias", "seguridad"]
    );
    assert.equal(wallpaperLabel("volcan"), "Volcán");

    const account = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopAccount.tsx"),
      "utf8"
    );
    assert.match(account, /PATCH/);
    assert.match(account, /\/api\/identity\/me/);
    assert.match(account, /\/api\/desktop\/wallpaper|onWallpaper/);
    assert.doesNotMatch(account, /Próximamente/);

    const desk = readFileSync(
      resolve(process.cwd(), "src/components/desktop/MentorDesktop.tsx"),
      "utf8"
    );
    assert.match(desk, /DesktopAccount/);
    assert.doesNotMatch(desk, /href="\/admin\/settings\/profile"/);

    const space = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopSpaceAjustes.tsx"),
      "utf8"
    );
    assert.match(space, /filterSpaceSettingGroups/);
    assert.match(space, /DesktopSpacePresence/);
    assert.doesNotMatch(space, /admin\/settings\/security/);
  });

  it("edita Mi empresa y Marca con SiteConfig existente, sin hub de Growth OS", () => {
    const presence = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopSpacePresence.tsx"),
      "utf8"
    );
    assert.match(presence, /InstitutionForm/);
    assert.match(presence, /ContactForm/);
    assert.match(presence, /BrandingPanel/);
    assert.match(presence, /\/api\/cms\/config/);
    assert.match(presence, /includePortalHero=\{false\}/);
    assert.match(presence, /showTenant=\{false\}/);
    assert.match(presence, /empresaBlockPatch/);
    assert.match(presence, /EMPRESA_BLOCKS/);
    assert.match(presence, /cfg-blocks/);
    assert.match(presence, /beginEdit/);
    assert.match(presence, /scope="contact"/);
    assert.match(presence, /scope="location"/);
    assert.match(presence, /panel === "sitio"/);

    const blocks = readFileSync(
      resolve(process.cwd(), "src/lib/desktop/presence-patch.ts"),
      "utf8"
    );
    assert.match(blocks, /Información general/);
    assert.match(blocks, /Contacto institucional/);
    assert.match(blocks, /Ubicación/);
    assert.match(presence, /\/admin\/site\/domain/);
    assert.match(presence, /\/admin\/portal\/forms/);
    assert.doesNotMatch(presence, /withSeoFallbacks/);
    assert.doesNotMatch(presence, /seo: config\.seo/);
    assert.doesNotMatch(presence, /\/admin\/config/);

    const space = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopSpaceAjustes.tsx"),
      "utf8"
    );
    assert.match(space, /settings-surface/);
    assert.match(space, /settings-nav/);
    assert.doesNotMatch(space, /space-board/);

    const settings = readFileSync(
      resolve(process.cwd(), "src/lib/desktop/space-settings.ts"),
      "utf8"
    );
    assert.doesNotMatch(settings, /href:\s*"\/admin\/config"/);
    assert.match(settings, /panel:\s*"sitio"/);
    assert.match(settings, /requiresApp:\s*"growth-os"/);
  });

  it("protege las rutas de empresa con autorización de página", () => {
    const team = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/team/page.tsx"),
      "utf8"
    );
    const roles = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/roles/page.tsx"),
      "utf8"
    );
    const integrations = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/integrations/page.tsx"),
      "utf8"
    );
    const config = readFileSync(resolve(process.cwd(), "src/app/admin/config/page.tsx"), "utf8");
    assert.match(team, /settings\.team/);
    assert.match(roles, /identity\.roles\.manage/);
    assert.match(integrations, /settings\.integrations/);
    assert.match(config, /settings\.update/);
  });

  it("Ajustes NELZURI: Escape, foco y diálogos de cambios pendientes", () => {
    const space = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopSpaceAjustes.tsx"),
      "utf8"
    );
    assert.match(space, /event\.key === "Escape"/);
    assert.match(space, /requestClose/);
    assert.match(space, /opener\?\.focus\(\)/);
    assert.match(space, /ajustes-head \.ghost[\s\S]*\?\.focus\(\)/);
    assert.match(space, /event\.key !== "Tab"/);
    assert.match(space, /Hay cambios sin guardar\. ¿Salir y descartarlos\?/);
    assert.match(space, /Hay cambios sin guardar\. ¿Cambiar de sección y descartarlos\?/);
    assert.match(space, /sectionDirty/);
    assert.match(space, /aria-modal="true"/);

    const css = readFileSync(
      resolve(process.cwd(), "src/components/desktop/mentor-desktop.css"),
      "utf8"
    );
    assert.match(css, /\.settings-nav \.space-row:focus-visible/);
    assert.match(css, /\.cfg-block \.ghost:focus-visible/);
  });
});
