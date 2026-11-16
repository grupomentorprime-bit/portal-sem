import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dayNoticeKey,
  desktopDayLines,
  growthDayLine,
  visibleDayNotices,
} from "../../src/lib/desktop/day";

describe("el día del escritorio", () => {
  it("Growth cerrado no dice nada", () => {
    assert.equal(
      growthDayLine({
        opens: false,
        matter: { personaLabel: "Ana", band: "overdue", href: "/admin/ventas/ana" },
      }),
      null
    );
  });

  it("sin asunto, la mesa dice que nada pide atención", () => {
    assert.deepEqual(growthDayLine({ opens: true, matter: null }), {
      appId: "growth-os",
      text: "Nada pide atención ahora.",
      href: "/admin/ventas",
    });
  });

  it("el primer asunto abre la ficha de esa persona", () => {
    assert.equal(
      growthDayLine({
        opens: true,
        matter: { personaLabel: " Ana ", band: "unfollowed", href: "/admin/ventas/ana" },
      })?.text,
      "Ana está sin seguimiento."
    );
    assert.equal(
      growthDayLine({
        opens: true,
        matter: { personaLabel: "", band: "stale", href: "/admin/ventas/x" },
      })?.text,
      "Persona está estancada."
    );
    assert.equal(
      growthDayLine({
        opens: true,
        matter: { personaLabel: "Ana", band: "overdue", href: "/admin/ventas/ana" },
      })?.href,
      "/admin/ventas/ana"
    );
  });

  it("deja como máximo tres líneas y una sola por aplicación", () => {
    const growth = growthDayLine({ opens: true, matter: null });
    assert.equal(desktopDayLines([null, growth, growth]).length, 1);
    assert.equal(
      desktopDayLines([
        growth,
        { appId: "cumple", text: "Una obligación vence.", href: "https://cumple.example" },
        { appId: "aprende-hoy", text: "Hoy hay clase.", href: "https://aprende.example" },
        { appId: "rrhh", text: "Un contrato vence.", href: "/rrhh" },
      ]).length,
      3
    );
  });

  it("cerrar oculta el aviso en esta visita; al actualizar, si sigue sin resolver, vuelve", () => {
    const maria = growthDayLine({
      opens: true,
      matter: { personaLabel: "María González", band: "overdue", href: "/admin/ventas/maria" },
    });
    assert.ok(maria);
    assert.deepEqual(visibleDayNotices([maria], [dayNoticeKey(maria)]), []);
    assert.deepEqual(visibleDayNotices([maria], []), [maria]);
  });
});
