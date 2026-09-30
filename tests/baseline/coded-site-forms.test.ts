import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { syncCodedSiteForms } from "../../src/sites/sync-forms";
import { submitCodedSiteForm } from "../../src/sites/submit-coded-form";
import type { CodedSiteFormDeclaration } from "../../src/sites/types";
import type {
  ExperienceFormCreate,
  ExperienceFormDefinition,
  ExperienceFormUpdate,
} from "../../src/types/experience-forms";

function definition(partial: ExperienceFormCreate): ExperienceFormDefinition {
  return { ...partial, createdAt: "2026-09-28T00:00:00.000Z", updatedAt: "2026-09-28T00:00:00.000Z" };
}

const contacto: CodedSiteFormDeclaration = {
  _id: "contacto",
  name: "Contacto",
  successMessage: "Listo",
  errorMessage: "Error",
  destination: "contact",
  fields: [
    { id: "email", type: "email", name: "email", label: "Correo", validation: { required: true } },
    { id: "nombre", type: "text", name: "name", label: "Nombre" },
  ],
};

describe("syncCodedSiteForms", () => {
  it("el código reescribe campos y archiva el que desaparece, sin tocar respuestas", async () => {
    const stored = [
      definition({
        _id: "contacto",
        tenant: "fixture",
        name: "Viejo",
        successMessage: "Viejo",
        errorMessage: "Viejo",
        destination: "contact",
        postSubmit: { type: "message", message: "Viejo" },
        fields: [],
        active: true,
        visible: true,
        managedBy: "coded-site",
      }),
      definition({
        _id: "baja",
        tenant: "fixture",
        name: "Baja",
        successMessage: "Baja",
        errorMessage: "Baja",
        destination: "contact",
        postSubmit: { type: "message", message: "Baja" },
        fields: [],
        active: true,
        visible: true,
        managedBy: "coded-site",
      }),
      definition({
        _id: "manual",
        tenant: "fixture",
        name: "Manual",
        successMessage: "Manual",
        errorMessage: "Manual",
        destination: "subscription",
        postSubmit: { type: "message", message: "Manual" },
        fields: [],
        active: true,
        visible: true,
      }),
    ];
    const updates: Array<{ id: string; update: ExperienceFormUpdate }> = [];
    const result = await syncCodedSiteForms("fixture", [contacto], {
      list: async () => stored,
      create: async (data) => definition(data),
      update: async (_tenant, id, update) => {
        updates.push({ id, update });
        return stored.find((form) => form._id === id) ?? null;
      },
    });

    assert.deepEqual(result.upserted, ["contacto"]);
    assert.deepEqual(result.archived, ["baja"]);
    const contactoUpdate = updates.find((item) => item.id === "contacto");
    assert.equal(contactoUpdate?.update.name, "Contacto");
    assert.equal(contactoUpdate?.update.fields?.[0]?.name, "email");
    assert.equal(updates.find((item) => item.id === "baja")?.update.archived, true);
    assert.equal(updates.some((item) => item.id === "manual"), false);
    assert.equal(JSON.stringify(updates).includes("submission"), false);
  });

  it("no reescribe un formulario que ya coincide con el código", async () => {
    const stored = definition({
      _id: "contacto",
      tenant: "fixture",
      name: contacto.name,
      successMessage: contacto.successMessage,
      errorMessage: contacto.errorMessage,
      destination: contacto.destination,
      postSubmit: { type: "message", message: contacto.successMessage },
      fields: contacto.fields,
      active: true,
      visible: false,
      private: true,
      archived: false,
      managedBy: "coded-site",
    });
    let updates = 0;
    const result = await syncCodedSiteForms("fixture", [contacto], {
      list: async () => [stored],
      create: async (data) => definition(data),
      update: async () => {
        updates += 1;
        return stored;
      },
    });
    assert.deepEqual(result.upserted, []);
    assert.deepEqual(result.archived, []);
    assert.equal(updates, 0);
  });
});

describe("submitCodedSiteForm", () => {
  it("un campo inválido no guarda", async () => {
    let saved = 0;
    const form = definition({
      _id: "contacto",
      tenant: "fixture",
      name: "Contacto",
      successMessage: "Listo",
      errorMessage: "Error",
      destination: "contact",
      postSubmit: { type: "message", message: "Listo" },
      fields: contacto.fields,
      active: true,
      visible: false,
      managedBy: "coded-site",
    });
    const result = await submitCodedSiteForm({
      form,
      data: { name: "Ana" },
      store: {
        save: async () => {
          saved += 1;
          return { id: "s1" };
        },
      },
      submit: async () => {
        saved += 1;
        return { ok: true, submissionId: "s1" };
      },
    });
    assert.equal(result.ok, false);
    assert.equal(saved, 0);
  });

  it("con correo entrega el envío al motor existente", async () => {
    const form = definition({
      _id: "contacto",
      tenant: "fixture",
      name: "Contacto",
      successMessage: "Listo",
      errorMessage: "Error",
      destination: "contact",
      postSubmit: { type: "message", message: "Listo" },
      fields: [{ id: "email", type: "email", name: "email", label: "Correo" }],
      active: true,
      visible: false,
      managedBy: "coded-site",
    });
    let received: { destination: string; email: unknown } | null = null;
    const result = await submitCodedSiteForm({
      form,
      data: { email: "ana@sem.cl" },
      store: { save: async () => ({ id: "s1" }) },
      submit: async ({ form: submitted, data }) => {
        received = { destination: submitted.destination, email: data.email };
        return { ok: true, submissionId: "s1", message: submitted.successMessage };
      },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(received, { destination: "contact", email: "ana@sem.cl" });
  });

  it("sin correo ni teléfono igual entrega el envío", async () => {
    const form = definition({
      _id: "nota",
      tenant: "fixture",
      name: "Nota",
      successMessage: "Listo",
      errorMessage: "Error",
      destination: "information_request",
      postSubmit: { type: "message", message: "Listo" },
      fields: [{ id: "nota", type: "text", name: "note", label: "Nota" }],
      active: true,
      visible: false,
      managedBy: "coded-site",
    });
    let called = false;
    const result = await submitCodedSiteForm({
      form,
      data: { note: "Hola" },
      store: { save: async () => ({ id: "s2" }) },
      submit: async () => {
        called = true;
        return { ok: true, submissionId: "s2" };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(called, true);
  });
});
