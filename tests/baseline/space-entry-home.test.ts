/**
 * Entrar a un cliente abre siempre Inicio (/admin).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spaceEntryDestination } from "../../src/lib/identity/space-entry";

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("entrada a un cliente", () => {
  it("al cambiar de cliente abre Inicio", () => {
    assert.equal(
      spaceEntryDestination({ pathname: "/admin/ventas", spaceChanges: true }),
      "/admin"
    );
    assert.equal(
      spaceEntryDestination({ pathname: "/platform/spaces/seminario-ipn", spaceChanges: true }),
      "/admin"
    );
    assert.equal(
      spaceEntryDestination({ pathname: "/admin", spaceChanges: true }),
      "/admin"
    );
  });

  it("si el cliente ya está activo y no estás en Inicio, igual abre Inicio", () => {
    assert.equal(
      spaceEntryDestination({ pathname: "/admin/portal/forms", spaceChanges: false }),
      "/admin"
    );
    assert.equal(
      spaceEntryDestination({ pathname: "/admin/ventas", spaceChanges: false }),
      "/admin"
    );
  });

  it("si ya estás en Inicio de ese cliente, no vuelve a navegar", () => {
    assert.equal(
      spaceEntryDestination({ pathname: "/admin", spaceChanges: false }),
      null
    );
  });

  it("el menú y Entrar al Espacio usan esa regla, no otra ruta", () => {
    const menu = readSrc("src/components/admin/AdminUserMenuPanel.tsx");
    const panel = readSrc("src/components/platform/PlatformEnterSpacePanel.tsx");
    assert.match(menu, /spaceEntryDestination/);
    assert.match(panel, /spaceEntryDestination/);
    assert.doesNotMatch(panel, /data\.redirectedTo/);
  });
});
