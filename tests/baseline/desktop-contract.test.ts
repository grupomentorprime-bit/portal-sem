import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CUMPLE_TENANT_ID } from "../../src/sites/cumple/site";
import {
  CUMPLE_SPACE_ID,
  DESKTOP_FALLBACK,
  desktopCanSwitchSpace,
  desktopContextLabel,
  desktopDock,
  enteredClientId,
  mentorAppBlurb,
  nextWallpaper,
  parseWallpaper,
  spaceSwitchLanding,
} from "../../src/lib/desktop/catalog";
import { desktopClients } from "../../src/lib/desktop/clients";
import {
  desktopClick,
  escritorioRedirect,
  isHttpsEntry,
  newlyContracted,
  parseContractPatch,
  resolveContractedApps,
} from "../../src/lib/desktop/contract";

describe("contrato del escritorio", () => {
  it("el dueño y el cliente tienen escritorios distintos", () => {
    assert.deepEqual(desktopDock(true), ["clientes", "ajustes"]);
    assert.deepEqual(desktopDock(false), ["growth-os", "cumple", "aprende-hoy", "rrhh"]);
  });

  it("el dueño permanece en la plataforma aunque su sesión tenga un cliente", () => {
    assert.equal(
      desktopContextLabel({ owner: true, spaceName: "Mentor Capacitación" }),
      "Plataforma"
    );
    assert.equal(desktopCanSwitchSpace({ owner: true, spaceCount: 4 }), false);
    assert.equal(
      desktopContextLabel({ owner: false, spaceName: "Mentor Capacitación" }),
      "Mentor Capacitación"
    );
    assert.equal(desktopCanSwitchSpace({ owner: false, spaceCount: 2 }), true);
    assert.equal(desktopCanSwitchSpace({ owner: false, spaceCount: 1 }), false);
  });

  it("el dueño entra a un cliente solo cuando lo elige y ese cliente existe", () => {
    const spaceIds = ["adl", "mentor-prime-capacitacion"];
    assert.equal(enteredClientId({ owner: true, requestedId: null, spaceIds }), null);
    assert.equal(enteredClientId({ owner: true, requestedId: "  ", spaceIds }), null);
    assert.equal(
      enteredClientId({ owner: true, requestedId: "mentor-prime-capacitacion", spaceIds }),
      "mentor-prime-capacitacion"
    );
    assert.equal(enteredClientId({ owner: true, requestedId: "otro", spaceIds }), null);
    assert.equal(enteredClientId({ owner: false, requestedId: "adl", spaceIds }), null);
  });

  it("el id de Cumple es el del sitio", () => {
    assert.equal(CUMPLE_SPACE_ID, CUMPLE_TENANT_ID);
  });

  it("sin campo, Growth OS; Cumple suma su app; la lista explícita reemplaza", () => {
    assert.deepEqual(resolveContractedApps({ tenantId: "seminario-ipn" }), ["growth-os"]);
    assert.deepEqual(resolveContractedApps({ tenantId: "cumple" }), ["growth-os", "cumple"]);
    assert.deepEqual(
      resolveContractedApps({ tenantId: "cumple", contractedApps: [] }),
      []
    );
    assert.deepEqual(
      resolveContractedApps({ tenantId: "otro", contractedApps: ["rrhh", "no-existe", "growth-os"] }),
      ["growth-os", "rrhh"]
    );
  });

  it("el clic sigue la tabla de la mesa", () => {
    const base = { tenantId: "seminario-ipn", contracted: ["growth-os"] as const, aprendeHoyEntryUrl: null, cumpleOrigin: null };
    assert.deepEqual(desktopClick({ ...base, appId: "growth-os" }), { kind: "open", href: "/admin" });
    assert.deepEqual(desktopClick({ ...base, appId: "cumple" }), { kind: "request" });
    assert.deepEqual(desktopClick({ ...base, appId: "rrhh", contracted: ["rrhh"] }), { kind: "later" });
    assert.deepEqual(
      desktopClick({ ...base, appId: "aprende-hoy", contracted: ["aprende-hoy"], aprendeHoyEntryUrl: "http://aprende.example" }),
      { kind: "disconnected" }
    );
    assert.deepEqual(
      desktopClick({ ...base, appId: "aprende-hoy", contracted: ["aprende-hoy"], aprendeHoyEntryUrl: "https://aprende.example/aula" }),
      { kind: "open", href: "https://aprende.example/aula" }
    );
    assert.deepEqual(
      desktopClick({ ...base, tenantId: "cumple", appId: "cumple", contracted: ["cumple"], cumpleOrigin: "https://cumple.mentorprime.cl" }),
      { kind: "open", href: "https://cumple.mentorprime.cl" }
    );
    assert.deepEqual(
      desktopClick({ ...base, tenantId: "otro", appId: "cumple", contracted: ["cumple"], cumpleOrigin: "https://otro.example" }),
      { kind: "disconnected" }
    );
  });

  it("solo https es entrada", () => {
    assert.equal(isHttpsEntry("https://aprende.example"), true);
    assert.equal(isHttpsEntry("http://aprende.example"), false);
    assert.equal(isHttpsEntry("  "), false);
    assert.equal(isHttpsEntry(null), false);
  });

  it("la mesa redirige antes de pintar", () => {
    assert.equal(
      escritorioRedirect({ hasSpace: false, studentAffairs: false, isPlatformOperator: true, hasMembership: false }),
      null
    );
    assert.equal(
      escritorioRedirect({ hasSpace: true, studentAffairs: true, isPlatformOperator: false, hasMembership: true }),
      "/admin/portal/asuntos-estudiantiles"
    );
    assert.equal(
      escritorioRedirect({ hasSpace: true, studentAffairs: false, isPlatformOperator: true, hasMembership: false }),
      null
    );
    assert.equal(
      escritorioRedirect({ hasSpace: true, studentAffairs: false, isPlatformOperator: false, hasMembership: true }),
      null
    );
  });

  it("el parche del operador rechaza basura y vacía la url", () => {
    assert.deepEqual(
      parseContractPatch({ contractedApps: ["cumple", "cumple"], aprendeHoyEntryUrl: "" }),
      { ok: true, contractedApps: ["cumple"], aprendeHoyEntryUrl: null }
    );
    assert.deepEqual(parseContractPatch({ contractedApps: ["no"], aprendeHoyEntryUrl: null }), { ok: false });
    assert.deepEqual(
      parseContractPatch({ contractedApps: ["aprende-hoy"], aprendeHoyEntryUrl: "http://x" }),
      { ok: false }
    );
  });

  it("contratar calcula solo las nuevas", () => {
    assert.deepEqual(newlyContracted(["growth-os"], ["growth-os", "cumple"]), ["cumple"]);
  });

  it("el dueño ve todos los clientes; un miembro solo los suyos", () => {
    const catalog = [
      { tenantId: "adl", name: "Academia ADL", status: "active" },
      { tenantId: "fundacion-mueve", name: "Fundacion Mueve", status: "active" },
      { tenantId: "seminario-ipn", name: "Seminario Eclesiástico Mayor", status: "active" },
      { tenantId: "saas-val-temp-empty", name: "Validación SaaS vacío", status: "active" },
      { tenantId: "archived", name: "Cerrado", status: "archived" },
    ];
    const memberships = [{ tenantId: "adl", name: "Academia ADL" }];
    assert.deepEqual(
      desktopClients({ operator: true, memberships, catalog }).map((space) => space.name),
      ["Academia ADL", "Fundacion Mueve", "Seminario Eclesiástico Mayor"]
    );
    assert.equal(
      desktopClients({ operator: true, memberships, catalog }).find((space) => space.tenantId === "fundacion-mueve")
        ?.needsAccess,
      true
    );
    assert.deepEqual(desktopClients({ operator: false, memberships, catalog }), [
      { tenantId: "adl", name: "Academia ADL", needsAccess: false },
    ]);
  });

  it("el fondo cicla y el cambio de Espacio vuelve a la mesa solo desde la mesa", () => {
    assert.equal(parseWallpaper(undefined), "mar");
    assert.equal(parseWallpaper("noche"), "noche");
    assert.equal(parseWallpaper("volcan"), "volcan");
    assert.equal(parseWallpaper("kepler"), "kepler");
    assert.equal(parseWallpaper("otro"), "mar");
    assert.equal(nextWallpaper("mar"), "valle");
    assert.equal(nextWallpaper("valle"), "volcan");
    assert.equal(nextWallpaper("volcan"), "kepler");
    assert.equal(nextWallpaper("kepler"), "noche");
    assert.equal(nextWallpaper("noche"), "mar");
    assert.equal(DESKTOP_FALLBACK, "#102033");
    assert.equal(spaceSwitchLanding("/escritorio"), "/escritorio");
    assert.equal(spaceSwitchLanding("/admin/ventas"), "/admin");
    assert.equal(mentorAppBlurb("rrhh"), "Personas empleadas, contratos y jornada.");
  });
});
