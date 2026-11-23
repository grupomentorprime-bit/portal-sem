import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import {
  OWNER_LEGAL,
  OWNER_PLATFORM,
  OWNER_SECTIONS,
  OWNER_SESSION_DAYS,
  clientIdFromActivity,
  activityKind,
  formatOwnerWhen,
  ownerProducts,
  ownerSecurity,
  platformActivityLine,
  platformAddress,
} from "../../src/lib/desktop/owner-settings";

describe("ajustes del dueño", () => {
  it("agrega las secciones de la plataforma junto a las cuentas", () => {
    assert.deepEqual(
      OWNER_SECTIONS.map((section) => section.label),
      [
        "Cuentas",
        "Tu cuenta",
        "Plataforma",
        "Dirección",
        "Productos",
        "Atención al Cliente",
        "Seguridad",
        "Legales",
        "Actividad",
      ]
    );
  });

  it("muestra la marca y los documentos de la plataforma", () => {
    assert.equal(OWNER_PLATFORM.name, "NELZURI");
    assert.equal(
      OWNER_SECTIONS.find((section) => section.id === "plataforma")?.subtitle,
      "El nombre y quién opera NELZURI."
    );
    assert.equal(OWNER_PLATFORM.operator, "Mentor Prime");
    assert.deepEqual(
      OWNER_LEGAL.map((item) => item.href),
      ["/legal/privacidad", "/legal/terminos", "/legal/eliminacion-de-datos"]
    );
  });

  it("describe la dirección base y el localhost de este equipo", () => {
    assert.equal(platformAddress("mentorprime.cl").host, "nombre.mentorprime.cl");
    assert.match(platformAddress("mentorprime.cl").detail, /dominio propio/);
    assert.equal(platformAddress(null).host, "nombre.localhost");
    assert.match(platformAddress("  ").detail, /este equipo/);
  });

  it("deja Growth OS en un cliente nuevo y el resto en la ficha", () => {
    const products = ownerProducts();
    assert.equal(products[0]?.id, "growth-os");
    assert.equal(products[0]?.label, "Growth OS");
    assert.match(products[0]?.text ?? "", /cliente nuevo/);
    assert.match(products.find((item) => item.id === "cumple")?.text ?? "", /Cumple/);
    assert.match(products.find((item) => item.id === "rrhh")?.text ?? "", /ficha del cliente/);
  });

  it("cuenta los dueños activos y coincide con la cookie de 30 días", () => {
    assert.match(ownerSecurity(null)[1]?.text ?? "", /al menos un dueño/);
    assert.match(ownerSecurity(1)[1]?.text ?? "", /un dueño activo/);
    assert.match(ownerSecurity(3)[1]?.text ?? "", /3 dueños/);
    assert.equal(OWNER_SESSION_DAYS, 30);
    const sessions = readFileSync(
      resolve(process.cwd(), "src/lib/identity/sessions.ts"),
      "utf8"
    );
    assert.match(sessions, /maxAge: 60 \* 60 \* 24 \* 30/);
  });

  it("cuenta en español quién creó, entró o cambió un contrato", () => {
    assert.equal(
      platformActivityLine({
        action: "platform.space.create",
        metadata: { name: "Fundación Mueve" },
      }),
      "Creó el cliente Fundación Mueve."
    );
    assert.equal(
      platformActivityLine({ action: "platform.space.access.grant", metadata: {} }),
      "Entró a un cliente."
    );
    assert.equal(
      platformActivityLine({
        action: "platform.space.access.grant",
        metadata: { tenantId: "mentor", name: "Mentor Capacitación" },
      }),
      "Entró al cliente Mentor Capacitación."
    );
    assert.equal(
      clientIdFromActivity({
        entity: "membership",
        metadata: { tenantId: "mentor" },
      }),
      "mentor"
    );
    assert.equal(
      platformActivityLine({
        action: "platform.space.contract",
        metadata: {
          name: "Fundación Mueve",
          appsChanged: true,
          contractedApps: ["growth-os", "aprende-hoy"],
        },
      }),
      "Cambió los productos de Fundación Mueve: Growth OS, Aprende Hoy."
    );
    assert.equal(
      platformActivityLine({
        action: "platform.user.create",
        metadata: { email: "ana@mentorprime.cl", password: "no-mostrar" },
      }),
      "Creó la cuenta ana@mentorprime.cl."
    );
    assert.equal(platformActivityLine({ action: "platform.access.denied" }), "Se negó una entrada a la plataforma.");
    assert.equal(activityKind("platform.space.access.grant"), "enter");
    assert.equal(activityKind("platform.space.delete"), "remove");
    assert.equal(activityKind("platform.user.create"), "account");
    assert.equal(activityKind("otro"), "other");
    assert.match(formatOwnerWhen("2026-11-12T17:22:00.000Z"), /12/);
    assert.match(formatOwnerWhen("2026-11-12T17:22:00.000Z"), /nov/i);
    assert.equal(formatOwnerWhen("no-fecha"), "");
  });
});
