import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { freshFunnelStages } from "../../src/core/growth/funnel-stages";
import { presentOpportunityStageTrack } from "../../src/lib/growth/opportunity-stage-track";
import type { GrowthFunnelStage } from "../../src/core/growth/funnel-types";

function stages(): GrowthFunnelStage[] {
  const base = freshFunnelStages();
  const open = base.find((stage) => stage.key === "open")!;
  return [
    open,
    {
      key: "contact",
      label: "Contacto",
      position: 1,
      active: true,
      isInitial: false,
      isResult: false,
    },
    {
      key: "proposal",
      label: "Propuesta",
      position: 2,
      active: true,
      isInitial: false,
      isResult: false,
    },
    {
      key: "paused",
      label: "Pausada",
      position: 3,
      active: false,
      isInitial: false,
      isResult: false,
    },
    ...base.filter((stage) => stage.isResult),
  ];
}

describe("ficha de oportunidad — recorrido real", () => {
  it("no marca como recorrida una etapa que el historial no nombra", () => {
    const track = presentOpportunityStageTrack({
      stages: stages(),
      status: "proposal",
      activities: [
        { kind: "opportunity_opened", payload: { status: "open" } },
        {
          kind: "opportunity_transitioned",
          payload: { fromState: "open", toState: "proposal" },
        },
      ],
    });
    const byKey = Object.fromEntries(track.steps.map((step) => [step.key, step.mark]));
    assert.equal(byKey.open, "visited");
    assert.equal(byKey.contact, "pending");
    assert.equal(byKey.proposal, "current");
    assert.equal(byKey.paused, "pending");
    assert.equal(track.steps.find((step) => step.key === "paused")?.caption, "Inactiva");
    assert.equal(track.resultLabel, null);
    assert.equal(track.notes.length, 0);
  });

  it("sin historial solo muestra la etapa actual", () => {
    const track = presentOpportunityStageTrack({
      stages: stages(),
      status: "contact",
      activities: [],
    });
    assert.deepEqual(
      track.steps.map((step) => step.mark),
      ["pending", "current", "pending", "pending"]
    );
    assert.match(track.notes[0] ?? "", /No se marcan etapas anteriores/);
  });

  it("un cierre no completa las etapas que no se recorrieron", () => {
    const track = presentOpportunityStageTrack({
      stages: stages(),
      status: "won",
      activities: [
        { kind: "opportunity_opened", payload: { status: "open" } },
        {
          kind: "opportunity_transitioned",
          payload: { fromState: "open", toState: "won" },
        },
      ],
    });
    assert.equal(track.resultLabel, "Ganada");
    assert.equal(track.steps.filter((step) => step.mark === "current").length, 0);
    assert.equal(track.steps.find((step) => step.key === "open")?.mark, "visited");
    assert.equal(track.steps.find((step) => step.key === "proposal")?.mark, "pending");
  });

  it("un movimiento sin etapas no se reparte en la barra", () => {
    const track = presentOpportunityStageTrack({
      stages: stages(),
      status: "open",
      activities: [
        { kind: "opportunity_opened", payload: { status: "open" } },
        { kind: "opportunity_transitioned", payload: {} },
      ],
    });
    assert.equal(track.steps.filter((step) => step.mark === "visited").length, 0);
    assert.match(track.notes.join(" "), /no se marcan/i);
  });

  it("la lectura de la ficha sigue filtrando por Espacio y no toca el tablero", () => {
    const read = readFileSync(
      resolve(process.cwd(), "src/lib/growth/ventas-read.ts"),
      "utf8"
    );
    const list = readFileSync(
      resolve(process.cwd(), "src/components/admin/growth/VentasListClient.tsx"),
      "utf8"
    );
    assert.match(read, /presentOpportunityStageTrack/);
    assert.match(read, /tenantId, oportunidadId/);
    assert.match(read, /opportunity_transitioned/);
    assert.match(list, /function KanbanBoard/);
  });
});
