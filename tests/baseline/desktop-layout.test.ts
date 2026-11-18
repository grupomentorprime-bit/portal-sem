import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DESK_ICON_GAP,
  DESK_ICON_HEIGHT,
  DESK_ICON_WIDTH,
  completeDeskIcons,
  defaultDeskIcons,
  deskIconPixels,
  deskIconsForDock,
  deskPoint,
  layoutAfterDrop,
  moveDeskIcon,
  parseDesktopLayout,
  pointOnDock,
  regulateAfterDrop,
  regulateDeskIcons,
} from "../../src/lib/desktop/layout";

describe("iconos del escritorio", () => {
  it("sin preferencia quedan en la misma fila, con el mismo alto", () => {
    assert.equal(parseDesktopLayout(undefined), null);
    assert.deepEqual(
      deskIconsForDock(null, ["growth-os", "ajustes"]).map((icon) => icon.appId),
      ["growth-os", "ajustes"]
    );
    assert.deepEqual(defaultDeskIcons(["growth-os", "cumple"]), [
      { appId: "growth-os", x: 8, y: 16 },
      { appId: "cumple", x: 18, y: 16 },
    ]);
  });

  it("una mesa guardada se regula sin inventar iconos ni bajar al de al lado", () => {
    const saved = parseDesktopLayout([
      { appId: "growth-os", x: 20, y: 30 },
      { appId: "clientes", x: 40, y: 40 },
    ]);
    assert.deepEqual(deskIconsForDock(saved, ["clientes", "ajustes"]), [
      { appId: "clientes", x: 38, y: 40 },
    ]);
    const migrated = parseDesktopLayout([
      { appId: "atencion", x: 8, y: 16 },
      { appId: "clientes", x: 18, y: 16 },
    ]);
    assert.equal(migrated?.[0]?.appId, "mensajes");
    assert.deepEqual(
      completeDeskIcons(migrated, ["mensajes", "envivo", "clientes", "ajustes"]).map((icon) => icon.appId),
      ["mensajes", "clientes", "envivo", "ajustes"]
    );
    assert.deepEqual(
      regulateDeskIcons([
        { appId: "growth-os", x: 8, y: 16 },
        { appId: "cumple", x: 18, y: 24 },
      ]),
      [
        { appId: "growth-os", x: 8, y: 16 },
        { appId: "cumple", x: 18, y: 28 },
      ]
    );
    assert.deepEqual(
      regulateDeskIcons([
        { appId: "growth-os", x: 8, y: 16 },
        { appId: "cumple", x: 9, y: 40 },
      ]),
      [
        { appId: "growth-os", x: 8, y: 16 },
        { appId: "cumple", x: 8, y: 40 },
      ]
    );
  });

  it("el aire entre iconos es el mismo en horizontal y en vertical", () => {
    const desk = { width: 1440, height: 1080 };
    const left = deskIconPixels({ appId: "growth-os", x: 8, y: 16 }, desk);
    const beside = deskIconPixels({ appId: "cumple", x: 18, y: 16 }, desk);
    const below = deskIconPixels({ appId: "rrhh", x: 8, y: 28 }, desk);
    assert.equal(beside.top, left.top);
    assert.equal(below.left, left.left);
    assert.equal(beside.left - left.left - DESK_ICON_WIDTH, below.top - left.top - DESK_ICON_HEIGHT);
    assert.equal(beside.left - left.left - DESK_ICON_WIDTH, DESK_ICON_GAP);
  });

  it("soltar al lado de otro lo deja en esa línea y no mueve al que ya estaba", () => {
    assert.deepEqual(
      regulateAfterDrop({
        icons: [{ appId: "growth-os", x: 8, y: 16 }],
        appId: "cumple",
        x: 20,
        y: 18,
      }),
      [
        { appId: "growth-os", x: 8, y: 16 },
        { appId: "cumple", x: 18, y: 16 },
      ]
    );
  });

  it("soltar encima de otro no lo reemplaza y cae en el libre que tiene debajo", () => {
    const pitchX = DESK_ICON_WIDTH + DESK_ICON_GAP;
    const pitchY = DESK_ICON_HEIGHT + DESK_ICON_GAP;
    assert.deepEqual(
      moveDeskIcon({
        icons: [
          { appId: "growth-os", x: 8, y: 16 },
          { appId: "ajustes", x: 18, y: 16 },
          { appId: "rrhh", x: 8, y: 28 },
        ],
        appId: "ajustes",
        col: 0,
        row: 1,
        at: { x: 78, y: 108 + 2 * pitchY + 32, pitchX, pitchY },
      }),
      [
        { appId: "growth-os", x: 8, y: 16 },
        { appId: "rrhh", x: 8, y: 28 },
        { appId: "ajustes", x: 8, y: 40 },
      ]
    );
    assert.deepEqual(
      moveDeskIcon({
        icons: [
          { appId: "growth-os", x: 8, y: 16 },
          { appId: "ajustes", x: 18, y: 16 },
        ],
        appId: "ajustes",
        col: 0,
        row: 0,
      }),
      [
        { appId: "growth-os", x: 8, y: 16 },
        { appId: "ajustes", x: 18, y: 16 },
      ]
    );
  });

  it("rechaza una lista rota y conserva lo de la otra mesa al soltar", () => {
    assert.equal(parseDesktopLayout([{ appId: "no-existe", x: 10, y: 10 }]), null);
    assert.deepEqual(
      layoutAfterDrop({
        saved: [{ appId: "clientes", x: 40, y: 40 }],
        dock: ["growth-os", "ajustes"],
        visible: [{ appId: "growth-os", x: 22, y: 33 }],
      }),
      [
        { appId: "clientes", x: 40, y: 40 },
        { appId: "growth-os", x: 22, y: 33 },
      ]
    );
  });

  it("soltar sobre el dock no es un punto de la mesa", () => {
    assert.equal(
      pointOnDock({ clientX: 10, clientY: 10, left: 0, top: 0, right: 20, bottom: 20 }),
      true
    );
    assert.deepEqual(
      deskPoint({ clientX: 0, clientY: 0, left: 0, top: 0, width: 100, height: 100 }),
      { x: 4, y: 14 }
    );
  });
});
