import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { alreadyRegisteredConfirmationMessage } from "../../src/lib/experience/forms/already-registered-confirmation";

describe("confirmación cuando el alumno ya se registró", () => {
  it("dice que confirmó asistencia", () => {
    const message = alreadyRegisteredConfirmationMessage("yes");
    assert.match(message, /Confirmaste que asistirás/);
    assert.match(message, /ya quedó registrada/);
  });

  it("dice que avisó que no asistirá", () => {
    const message = alreadyRegisteredConfirmationMessage("no");
    assert.match(message, /no podrás asistir/);
    assert.match(message, /ya quedó registrada/);
  });

  it("confirma el registro aunque no sepamos la respuesta", () => {
    const message = alreadyRegisteredConfirmationMessage(null);
    assert.match(message, /ya quedó registrada/);
    assert.doesNotMatch(message, /Confirmaste que asistirás/);
  });
});
