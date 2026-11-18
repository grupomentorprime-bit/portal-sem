import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateFormSubmission } from "../../src/core/experience/forms/validation";
import {
  alreadyEnrolledMessage,
  enrolleeIdentity,
  isMissingFieldMessage,
  missingFieldMessage,
} from "../../src/lib/experience/forms/already-enrolled";
import type { ExperienceFormDefinition } from "../../src/types/experience-forms";

function congressForm(): ExperienceFormDefinition {
  const now = new Date().toISOString();
  return {
    _id: "ipn-asistencia-congreso-varones-2026",
    tenant: "ipn-chile",
    name: "Confirmación de asistencia — 3° Congreso de Varones",
    description: "Confirma tu asistencia.",
    successMessage: "Gracias.",
    errorMessage: "No se pudo registrar.",
    destination: "attendance_confirmation",
    postSubmit: { type: "message", message: "Gracias." },
    active: true,
    visible: true,
    createdAt: now,
    updatedAt: now,
    fields: [
      {
        id: "zona",
        type: "select",
        name: "zona",
        label: "Zona",
        validation: { required: true },
        options: [{ label: "Zona 7", value: "zona-7" }],
      },
      {
        id: "iglesia",
        type: "text",
        name: "iglesia",
        label: "Iglesia",
        validation: { required: true },
      },
      {
        id: "fullName",
        type: "text",
        name: "fullName",
        label: "Nombre completo",
        validation: { required: true },
      },
      {
        id: "rut",
        type: "rut",
        name: "rut",
        label: "RUT",
        validation: { required: true },
      },
      {
        id: "phone",
        type: "phone",
        name: "phone",
        label: "Teléfono",
        validation: { required: true },
      },
      {
        id: "email",
        type: "email",
        name: "email",
        label: "Correo",
        validation: { required: false },
      },
    ],
  };
}

describe("inscripción del congreso de varones", () => {
  it("reconoce el RUT y el correo de quien ya está inscrito", () => {
    const identity = enrolleeIdentity({
      rut: "15676490-6",
      email: "MsepulvedaBustos@gmail.com",
    });
    assert.equal(identity.rut, "15.676.490-6");
    assert.equal(identity.email, "msepulvedabustos@gmail.com");
  });

  it("no usa un RUT inválido ni un correo vacío para buscar la inscripción", () => {
    const identity = enrolleeIdentity({ rut: "12.345.678-0", email: "   " });
    assert.equal(identity.rut, null);
    assert.equal(identity.email, null);
  });

  it("el aviso de ya inscrito nombra el dato que coincidió", () => {
    assert.match(alreadyEnrolledMessage("rut"), /Ya estás inscrito/);
    assert.match(alreadyEnrolledMessage("rut"), /RUT/);
    assert.match(alreadyEnrolledMessage("email"), /correo/);
  });

  it("si faltan datos, nombra cada uno", () => {
    const errors = validateFormSubmission(congressForm(), {});
    assert.equal(errors.zona, missingFieldMessage("Zona"));
    assert.equal(errors.iglesia, missingFieldMessage("Iglesia"));
    assert.equal(errors.fullName, missingFieldMessage("Nombre completo"));
    assert.equal(errors.rut, missingFieldMessage("RUT"));
    assert.equal(errors.phone, missingFieldMessage("Teléfono"));
    assert.equal(errors.email, undefined);
    assert.equal(isMissingFieldMessage(errors.zona), true);
  });
});
