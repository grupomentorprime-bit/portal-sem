import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  AprendeHoyAdmissionAdapter,
  getAdmissionAdapter,
  LocalAdmissionAdapter,
} from "../../src/core/admission/admission-adapter";

const ENV_KEYS = ["ADMISSION_ADAPTER", "APRENDEHOY_API_URL", "APRENDEHOY_API_KEY"] as const;
const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (key in saved) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
      delete saved[key];
    }
  }
});

function setEnv(key: (typeof ENV_KEYS)[number], value: string | undefined) {
  if (!(key in saved)) saved[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("OT-GROWTH-TEST-001 — handoff admisión / Aprende Hoy", () => {
  it("por defecto usa LocalAdmissionAdapter (no llama Aprende Hoy)", () => {
    setEnv("ADMISSION_ADAPTER", undefined);
    const adapter = getAdmissionAdapter();
    assert.ok(adapter instanceof LocalAdmissionAdapter);
    assert.equal(adapter.name, "local");
  });

  it("ADMISSION_ADAPTER=aprendehoy selecciona AprendeHoyAdmissionAdapter", () => {
    setEnv("ADMISSION_ADAPTER", "aprendehoy");
    const adapter = getAdmissionAdapter();
    assert.ok(adapter instanceof AprendeHoyAdmissionAdapter);
    assert.equal(adapter.name, "aprendehoy");
  });

  it("AprendeHoyAdmissionAdapter falla sin APRENDEHOY_API_URL (handoff diferido)", async () => {
    setEnv("ADMISSION_ADAPTER", "aprendehoy");
    setEnv("APRENDEHOY_API_URL", undefined);
    const adapter = new AprendeHoyAdmissionAdapter();
    const result = await adapter.handoff({
      interesadoId: "int-1",
      tenant: "seminario-ipn",
      portalStatus: "interesado",
      source: "portal-sem",
      aprendeHoyTarget: "lead",
      submittedAt: new Date().toISOString(),
      applicant: {
        firstName: "Ana",
        lastName: "Pérez",
        email: "ana@example.com",
        phone: "+56912345678",
        church: "Iglesia",
        city: "Talca",
        programId: "prog-1",
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /APRENDEHOY_API_URL/);
  });

  it("LocalAdmissionAdapter entrega ok con externalId local", async () => {
    const adapter = new LocalAdmissionAdapter();
    const result = await adapter.handoff({
      interesadoId: "int-local",
      tenant: "seminario-ipn",
      portalStatus: "interesado",
      source: "portal-sem",
      aprendeHoyTarget: "lead",
      submittedAt: new Date().toISOString(),
      applicant: {
        firstName: "Luis",
        lastName: "Rojas",
        email: "luis@example.com",
        phone: "+56987654321",
        church: "Iglesia",
        city: "Santiago",
        programId: "prog-1",
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.externalId, "local-lead-int-local");
  });
});
