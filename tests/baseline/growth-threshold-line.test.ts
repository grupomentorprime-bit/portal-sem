import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  THRESHOLD_BREATH_MS,
  crossingMayResolveAccess,
  crossingNeedsPanel,
  crossingThresholdLine,
  publicThresholdLine,
  redirectPath,
  thresholdBreathMs,
} from "../../src/lib/identity/threshold-line";

describe("frase pública del umbral", () => {
  it("sin conteo pide entrar al Espacio", () => {
    assert.equal(publicThresholdLine(null), "Entra a tu Espacio.");
  });

  it("cero dice que el Espacio está al día", () => {
    assert.equal(publicThresholdLine(0), "Este Espacio está al día.");
  });

  it("una oportunidad queda en singular", () => {
    assert.equal(publicThresholdLine(1), "Hay 1 oportunidad esperando.");
  });

  it("varias usan el formato es", () => {
    const formatted = new Intl.NumberFormat("es").format(1200);
    assert.equal(
      publicThresholdLine(1200),
      `Hay ${formatted} oportunidades esperando.`
    );
  });
});

describe("gates del panel", () => {
  it("solo resuelve acceso en /admin con tenant", () => {
    assert.equal(crossingMayResolveAccess("/admin", true), true);
    assert.equal(crossingMayResolveAccess("/admin", false), false);
    assert.equal(crossingMayResolveAccess("/admin/ventas", true), false);
    assert.equal(crossingMayResolveAccess("/platform", true), false);
  });

  it("el panel exige permiso y no ser asuntos estudiantiles", () => {
    const base = { hasTenant: true, studentAffairs: false, canSales: true };
    assert.equal(crossingNeedsPanel("/admin", base), true);
    assert.equal(crossingNeedsPanel("/admin", { ...base, canSales: false }), false);
    assert.equal(
      crossingNeedsPanel("/admin", { ...base, studentAffairs: true }),
      false
    );
    assert.equal(crossingNeedsPanel("/admin", { ...base, hasTenant: false }), false);
  });
});

describe("frase de cruce", () => {
  const row = {
    personaLabel: "Ana Ruiz",
    band: "overdue",
    bandLabel: "Vencida",
  };

  it("separa el path de la query", () => {
    assert.equal(redirectPath("/admin?empty=1"), "/admin");
  });

  it("quita el fragmento del path", () => {
    assert.equal(redirectPath("/admin#x"), "/admin");
  });

  it("quita query y fragmento del path", () => {
    assert.equal(redirectPath("/admin?preset=1#x"), "/admin");
  });

  it("plataforma, sin Espacio y otro path no anuncian llegada", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/platform/spaces/adl",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a la plataforma.", announceArrival: false }
    );
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin/sin-espacio",
        hasTenant: false,
        studentAffairs: false,
        canSales: false,
      }),
      { line: "Todavía no tienes un Espacio.", announceArrival: false }
    );
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin/ventas",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a tu trabajo.", announceArrival: false }
    );
  });

  it("el escritorio no lee el panel", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/escritorio?from=login",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a tu escritorio.", announceArrival: false }
    );
    assert.equal(
      crossingNeedsPanel("/escritorio", { hasTenant: true, studentAffairs: false, canSales: true }),
      false
    );
  });

  it("asuntos estudiantiles gana al permiso de ventas", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: true,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a tu trabajo.", announceArrival: false }
    );
  });

  it("sin permiso no lee una fila aunque se la pasen", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: false,
        attentionRows: [row],
      }),
      { line: "Entras a tu Espacio.", announceArrival: false }
    );
  });

  it("sin filas anuncia el vacío", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin?preset=last_30d",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [],
      }),
      { line: "Nada pide atención ahora.", announceArrival: true }
    );
  });

  it("formatea las tres bandas, una desconocida y un nombre vacío", () => {
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }).line,
      "Ana Ruiz está vencida."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "Ana Ruiz", band: "unfollowed", bandLabel: "Sin seguimiento" }],
      }).line,
      "Ana Ruiz está sin seguimiento."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "Ana Ruiz", band: "stale", bandLabel: "Estancada" }],
      }).line,
      "Ana Ruiz está estancada."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "Ana Ruiz", band: "current", bandLabel: "Al día" }],
      }).line,
      "Ana Ruiz · Al día."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "  ", band: "overdue", bandLabel: "Vencida" }],
      }).line,
      "Persona está vencida."
    );
  });

  it("sin filas entregadas no anuncia llegada", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
      }),
      { line: "Entras a tu Espacio.", announceArrival: false }
    );
  });
});

describe("respiro", () => {
  it("espera 700 ms solo cuando la frase cambia y hay movimiento", () => {
    assert.equal(THRESHOLD_BREATH_MS, 700);
    assert.equal(
      thresholdBreathMs({
        nextLine: "Ana Ruiz está vencida.",
        currentLine: "Entra a tu Espacio.",
        reduceMotion: false,
      }),
      700
    );
    assert.equal(
      thresholdBreathMs({
        nextLine: "Entra a tu Espacio.",
        currentLine: "Entra a tu Espacio.",
        reduceMotion: false,
      }),
      0
    );
    assert.equal(
      thresholdBreathMs({
        nextLine: undefined,
        currentLine: "Entra a tu Espacio.",
        reduceMotion: false,
      }),
      0
    );
    assert.equal(
      thresholdBreathMs({
        nextLine: "Ana Ruiz está vencida.",
        currentLine: "Entra a tu Espacio.",
        reduceMotion: true,
      }),
      0
    );
  });
});
