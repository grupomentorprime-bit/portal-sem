import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatClpInput,
  parseClpInput,
} from "../../src/components/admin/congress/labels";

describe("congress CLP input helpers", () => {
  it("parseClpInput acepta pesos con puntos y símbolo", () => {
    assert.equal(parseClpInput("$17.000"), 17000);
    assert.equal(parseClpInput("17.000"), 17000);
    assert.equal(parseClpInput("5000"), 5000);
    assert.equal(parseClpInput(""), 0);
    assert.equal(parseClpInput("$"), 0);
  });

  it("formatClpInput muestra pesos es-CL con $ y puntos", () => {
    const formatted = formatClpInput(17000);
    assert.match(formatted, /\$/);
    assert.match(formatted, /17\.000/);
    assert.equal(formatClpInput(0), "");
    assert.equal(formatClpInput(null), "");
  });
});
