import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { kanbanColumnWidth } from "../../src/lib/growth/kanban-column-width";

function fits(lane: number, columns: number, width: number): boolean {
  return columns * width + (columns - 1) * 10 <= lane;
}

describe("ancho de columna del Kanban", () => {
  it("mete cinco columnas enteras en el ancho donde antes se cortaba la quinta", () => {
    const lane = 1304;
    const width = kanbanColumnWidth(lane);
    assert.ok(width);
    assert.ok(width >= 248 && width <= 320);
    assert.equal(fits(lane, 5, width), true);
    assert.equal(fits(lane, 5, width) && lane - (5 * width + 40) < width, true);
  });

  it("no deja una columna partida cuando caben cuatro", () => {
    const lane = 1144;
    const width = kanbanColumnWidth(lane);
    assert.equal(width, 278);
    assert.equal(fits(lane, 4, width), true);
  });

  it("no estira una columna por encima de 320 px", () => {
    const width = kanbanColumnWidth(900);
    assert.ok(width);
    assert.ok(width <= 320);
    assert.equal(fits(900, 3, width), true);
  });
});
