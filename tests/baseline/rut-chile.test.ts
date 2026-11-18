import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatChileRutDisplay,
  formatChileRutInput,
  isValidChileRut,
  normalizeChileRut,
} from "../../src/lib/experience/forms/rut-chile";

describe("RUT chileno", () => {
  it("acepta un RUT válido con puntos y guión", () => {
    assert.equal(isValidChileRut("12.345.678-5"), true);
    assert.equal(normalizeChileRut("123456785"), "12.345.678-5");
  });

  it("acepta el dígito verificador K", () => {
    assert.equal(isValidChileRut("1.000.005-K"), true);
    assert.equal(formatChileRutDisplay("1000005k"), "1.000.005-K");
  });

  it("conserva el primer dígito mientras se escribe", () => {
    assert.equal(formatChileRutInput("1"), "1");
    assert.equal(formatChileRutInput("12"), "1-2");
    assert.equal(formatChileRutInput("123456785"), "12.345.678-5");
  });

  it("rechaza un RUT con dígito verificador incorrecto", () => {
    assert.equal(isValidChileRut("12.345.678-9"), false);
    assert.equal(normalizeChileRut("12.345.678-9"), null);
  });
});
