import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canManageAppKeys,
  desktopVisibleApps,
  hasAppKey,
  migrationAuthorizedApps,
  parseAuthorizedApps,
  parseAuthorizedAppsPatch,
  resolveAuthorizedApps,
} from "../../src/lib/desktop/app-access";
import { desktopClick } from "../../src/lib/desktop/contract";

describe("llaves de aplicación por persona", () => {
  it("sin campo de llave conserva el techo; lista vacía no otorga nada", () => {
    assert.deepEqual(
      resolveAuthorizedApps({ contracted: ["growth-os", "cumple"], authorizedApps: null }),
      ["growth-os", "cumple"]
    );
    assert.deepEqual(
      resolveAuthorizedApps({ contracted: ["growth-os", "cumple"], authorizedApps: [] }),
      []
    );
    assert.deepEqual(
      resolveAuthorizedApps({
        contracted: ["growth-os", "aprende-hoy"],
        authorizedApps: ["growth-os", "rrhh"],
      }),
      ["growth-os"]
    );
  });

  it("la migración materializa solo el techo de ese momento", () => {
    assert.deepEqual(migrationAuthorizedApps(["growth-os", "cumple"]), ["growth-os", "cumple"]);
    assert.deepEqual(migrationAuthorizedApps([]), []);
    assert.deepEqual(migrationAuthorizedApps(["no-existe" as "growth-os"]), []);
  });

  it("el dock oculta lo contratado sin llave y muestra candados solo al admin", () => {
    assert.deepEqual(
      desktopVisibleApps({
        contracted: ["growth-os", "cumple"],
        authorizedApps: ["growth-os"],
        canRequestPlan: false,
      }),
      ["growth-os"]
    );
    assert.deepEqual(
      desktopVisibleApps({
        contracted: ["growth-os"],
        authorizedApps: ["growth-os"],
        canRequestPlan: true,
      }),
      ["growth-os", "cumple", "aprende-hoy", "rrhh"]
    );
    assert.deepEqual(
      desktopVisibleApps({
        contracted: ["growth-os", "cumple"],
        authorizedApps: [],
        canRequestPlan: true,
      }),
      ["aprende-hoy", "rrhh"]
    );
  });

  it("el parche rechaza apps fuera del techo y acepta lista vacía", () => {
    assert.deepEqual(
      parseAuthorizedAppsPatch({
        authorizedApps: ["growth-os", "cumple"],
        contracted: ["growth-os"],
      }),
      { ok: false }
    );
    assert.deepEqual(
      parseAuthorizedAppsPatch({
        authorizedApps: ["growth-os", "growth-os"],
        contracted: ["growth-os", "cumple"],
      }),
      { ok: true, authorizedApps: ["growth-os"] }
    );
    assert.deepEqual(
      parseAuthorizedAppsPatch({ authorizedApps: [], contracted: ["growth-os"] }),
      { ok: true, authorizedApps: [] }
    );
    assert.equal(parseAuthorizedApps(["growth-os", "no"]), null);
    assert.equal(canManageAppKeys(["settings.team"]), true);
    assert.equal(canManageAppKeys(["settings.update"]), false);
  });

  it("el clic diferencia no contratada, no autorizada y no conectada", () => {
    const base = {
      tenantId: "seminario-ipn",
      contracted: ["growth-os", "aprende-hoy"] as const,
      authorized: ["growth-os"] as const,
      aprendeHoyEntryUrl: null as string | null,
      cumpleOrigin: null as string | null,
    };
    assert.deepEqual(desktopClick({ ...base, appId: "cumple" }), { kind: "request" });
    assert.deepEqual(desktopClick({ ...base, appId: "aprende-hoy" }), { kind: "unauthorized" });
    assert.deepEqual(
      desktopClick({
        ...base,
        appId: "aprende-hoy",
        authorized: ["aprende-hoy"],
        aprendeHoyEntryUrl: null,
      }),
      { kind: "disconnected" }
    );
    assert.deepEqual(desktopClick({ ...base, appId: "growth-os" }), {
      kind: "open",
      href: "/admin",
    });
    assert.equal(hasAppKey("growth-os", { contracted: base.contracted, authorizedApps: base.authorized }), true);
    assert.equal(hasAppKey("aprende-hoy", { contracted: base.contracted, authorizedApps: base.authorized }), false);
  });
});
