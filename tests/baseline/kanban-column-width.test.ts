import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { kanbanColumnWidth } from "../../src/lib/growth/kanban-column-width";

function fits(lane: number, columns: number, width: number): boolean {
  return columns * width + (columns - 1) * 10 <= lane;
}

describe("ancho de columna del Kanban", () => {
  it("mete cinco columnas enteras en el ancho donde antes se cortaba la quinta", () => {
    const lane = 1304;
    const width = kanbanColumnWidth(lane, 5);
    assert.ok(width);
    assert.ok(width >= 248 && width <= 320);
    assert.equal(fits(lane, 5, width), true);
    assert.equal(fits(lane, 5, width) && lane - (5 * width + 40) < width, true);
  });

  it("no deja una columna partida cuando caben cuatro", () => {
    const lane = 1144;
    const width = kanbanColumnWidth(lane, 4);
    assert.equal(width, 278);
    assert.equal(fits(lane, 4, width), true);
  });

  it("tres columnas que caben no pasan de 320 px", () => {
    const width = kanbanColumnWidth(900, 3);
    assert.ok(width);
    assert.ok(width <= 320);
    assert.equal(fits(900, 3, width), true);
  });

  it("dos etapas crecen y llenan la fila", () => {
    const lane = 1000;
    const width = kanbanColumnWidth(lane, 2);
    assert.equal(width, 495);
    assert.equal(fits(lane, 2, width), true);
    assert.ok(width > 320);
  });

  it("en una pantalla ancha dos etapas siguen hasta el borde", () => {
    const lane = 1600;
    const width = kanbanColumnWidth(lane, 2);
    assert.equal(width, 795);
    assert.equal(fits(lane, 2, width), true);
    assert.ok(lane - (2 * width + 10) < 2);
  });

  it("muchas etapas no se aplastan: se desplazan en columnas legibles", () => {
    const width = kanbanColumnWidth(900, 8);
    assert.ok(width);
    assert.ok(width >= 248 && width <= 320);
  });
});
