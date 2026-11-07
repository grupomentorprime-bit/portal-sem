import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldShowConvocatoriaSubmitButton } from "../../src/lib/experience/forms/already-registered-confirmation";

describe("shouldShowConvocatoriaSubmitButton", () => {
  it("oculta enviar cuando el alumno del listado aún no tiene confirmada su situación", () => {
    assert.equal(
      shouldShowConvocatoriaSubmitButton({
        registrationMode: "roster",
        studentId: "rut-103672937",
        lookup: "idle",
      }),
      false
    );
    assert.equal(
      shouldShowConvocatoriaSubmitButton({
        registrationMode: "roster",
        studentId: "rut-103672937",
        lookup: "pending",
      }),
      false
    );
  });

  it("oculta enviar cuando la respuesta ya está registrada", () => {
    assert.equal(
      shouldShowConvocatoriaSubmitButton({
        registrationMode: "roster",
        studentId: "rut-103672937",
        lookup: "registered",
      }),
      false
    );
  });

  it("muestra enviar cuando el alumno del listado todavía no responde", () => {
    assert.equal(
      shouldShowConvocatoriaSubmitButton({
        registrationMode: "roster",
        studentId: "rut-103672937",
        lookup: "open",
      }),
      true
    );
  });

  it("muestra enviar antes de elegir a alguien del listado", () => {
    assert.equal(
      shouldShowConvocatoriaSubmitButton({
        registrationMode: "",
        studentId: "",
        lookup: "idle",
      }),
      true
    );
  });
});
