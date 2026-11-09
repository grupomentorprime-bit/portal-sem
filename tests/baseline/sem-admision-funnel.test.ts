import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SEM_ADMISION_FUNNEL_NAME,
  isSemAdmisionStages,
  mapLegacyStatusToSemAdmision,
  semAdmisionIntermediateStages,
  semAdmisionStages,
} from "../../src/core/growth/sem-admision-funnel";
import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
import { ensureGrowthFunnelsForTenant, applySemAdmisionDefaultFunnel } from "../../src/core/growth/funnels";
import { platformDefaultStages } from "../../src/core/growth/funnel-stages";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { stagesFromDefinition } from "../../src/core/growth/funnel-stages";

describe("sem admision funnel", () => {
  it("define seis etapas con interes inicial y resultados de plataforma", () => {
    const stages = semAdmisionStages();
    const intermediates = stages.filter((s) => !s.isResult);
    assert.equal(SEM_ADMISION_FUNNEL_NAME, "Admisión");
    assert.deepEqual(
      intermediates.map((s) => s.key),
      ["interes", "contactado", "orientacion", "postulacion", "en-revision", "listo-matricular"]
    );
    assert.equal(intermediates.find((s) => s.isInitial)?.key, "interes");
    assert.ok(stages.some((s) => s.key === "won" && s.isResult));
    assert.equal(isSemAdmisionStages(stages), true);
    assert.equal(isSemAdmisionStages(platformDefaultStages()), false);
  });

  it("returns false for intermediates without result stages", () => {
    assert.equal(isSemAdmisionStages(semAdmisionIntermediateStages()), false);
  });

  it("remapea open→interes, otras intermedias→contactado, y no toca resultados ni etapas SEM", () => {
    assert.equal(mapLegacyStatusToSemAdmision("open"), "interes");
    assert.equal(mapLegacyStatusToSemAdmision("in_follow_up"), "contactado");
    assert.equal(mapLegacyStatusToSemAdmision("en-seguimiento"), "contactado");
    assert.equal(mapLegacyStatusToSemAdmision("won"), null);
    assert.equal(mapLegacyStatusToSemAdmision("interes"), null);
    assert.equal(mapLegacyStatusToSemAdmision("orientacion"), null);
  });

  it("applySemAdmisionDefaultFunnel renombra default y deja etapas SEM; segunda pasada no cambia", async () => {
    const directory = createMemoryFunnelDirectory();
    await ensureGrowthFunnelsForTenant(directory, SEM_TENANT_ID, "2026-11-09T00:00:00.000Z");
    const first = await applySemAdmisionDefaultFunnel(
      directory,
      SEM_TENANT_ID,
      "2026-11-09T01:00:00.000Z"
    );
    assert.equal(first.changed, true);
    assert.equal(first.funnel.name, "Admisión");
    assert.equal(isSemAdmisionStages(first.stages), true);

    const second = await applySemAdmisionDefaultFunnel(
      directory,
      SEM_TENANT_ID,
      "2026-11-09T02:00:00.000Z"
    );
    assert.equal(second.changed, false);
    const def = await directory.getDefinition(SEM_TENANT_ID, first.funnel.workflowDefinitionKey);
    assert.equal(isSemAdmisionStages(stagesFromDefinition(def)), true);
  });
});
