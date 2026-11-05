import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAdminBreadcrumbs } from "../../src/lib/admin/breadcrumb-from-path";
import { isNavActive } from "../../src/lib/admin/institutional";
import { getAllNavTreeItems } from "../../src/lib/admin/nav-domains";
import type { GrowthFunnel, GrowthFunnelStage } from "../../src/core/growth/funnel-types";
import {
  growthVentasBoardLanes,
  growthVentasStatusOptions,
} from "../../src/lib/growth/ventas-board";
import type { GrowthVentasQueueItemView } from "../../src/lib/growth/ventas-view";

function funnel(partial: Partial<GrowthFunnel> & Pick<GrowthFunnel, "key" | "tenantId">): GrowthFunnel {
  return {
    _id: partial.key,
    name: partial.name ?? partial.key,
    status: partial.status ?? "active",
    isDefault: partial.isDefault ?? false,
    workflowDefinitionKey: `growth.opportunity.${partial.key}`,
    createdAt: "2026-10-17T00:00:00.000Z",
    updatedAt: "2026-10-17T00:00:00.000Z",
    ...partial,
  };
}

function stage(
  key: string,
  label: string,
  position: number,
  extra: Partial<GrowthFunnelStage> = {}
): GrowthFunnelStage {
  return {
    key,
    label,
    position,
    active: true,
    isInitial: position === 0,
    isResult: false,
    ...extra,
  };
}

function item(
  partial: Partial<GrowthVentasQueueItemView> & Pick<GrowthVentasQueueItemView, "id" | "funnelKey" | "status">
): GrowthVentasQueueItemView {
  return {
    personaId: "p",
    personaDisplayName: partial.id,
    originLabel: "Manual",
    typeLabel: "Consulta",
    typeKey: "inquiry",
    statusLabel: partial.status,
    funnelName: partial.funnelKey,
    stageLabel: partial.stageLabel ?? partial.status,
    availableTransitions: [],
    nextActionLabel: "",
    hasNextAction: false,
    lastActivityLabel: "",
    openedAt: "2026-10-17T00:00:00.000Z",
    updatedAt: "2026-10-17T00:00:00.000Z",
    priorityBand: null,
    priorityRank: 3,
    priorityKey: null,
    ...partial,
  };
}

describe("tablero de ventas por embudo", () => {
  const tenant = "espacio-a";
  const other = "espacio-b";
  const funnels = [
    funnel({ tenantId: tenant, key: "default", name: "Ventas", isDefault: true }),
    funnel({ tenantId: tenant, key: "admision", name: "Admisión" }),
    funnel({ tenantId: other, key: "default", name: "Otro espacio", isDefault: true }),
  ];
  const stages = new Map<string, GrowthFunnelStage[]>([
    [
      "default",
      [
        stage("open", "Abierta", 0, { isInitial: true }),
        stage("active", "En seguimiento", 1, { isInitial: false, active: false }),
        stage("won", "Ganada", 0, { isResult: true, isInitial: false }),
      ],
    ],
    [
      "admision",
      [
        stage("open", "Recibida", 0, { isInitial: true }),
        stage("entrevista", "Entrevista", 1, { isInitial: false }),
      ],
    ],
  ]);

  it("no mezcla columnas ni oportunidades de otro embudo o Espacio", () => {
    const lanes = growthVentasBoardLanes(tenant, funnels, stages, undefined, [
      item({ id: "a", funnelKey: "default", status: "active", stageLabel: "En seguimiento" }),
      item({ id: "b", funnelKey: "admision", status: "entrevista", stageLabel: "Entrevista" }),
      item({ id: "c", funnelKey: "default", status: "won", stageLabel: "Ganada" }),
    ]);
    assert.deepEqual(
      lanes.map((lane) => lane.funnelKey),
      ["default", "admision"]
    );
    const ventas = lanes[0]!;
    const admision = lanes[1]!;
    assert.deepEqual(
      ventas.columns.map((column) => column.key),
      ["open", "active"]
    );
    assert.equal(ventas.columns.find((column) => column.key === "active")?.active, false);
    assert.equal(ventas.columns.some((column) => column.key === "won"), false);
    assert.equal(ventas.columns.some((column) => column.key === "entrevista"), false);
    assert.deepEqual(
      admision.columns.map((column) => column.key),
      ["open", "entrevista"]
    );
    assert.equal(admision.columns[0]?.label, "Recibida");
  });

  it("el filtro de estado usa la etiqueta del embudo y conserva los resultados", () => {
    const options = growthVentasStatusOptions(tenant, funnels, stages, undefined);
    assert.equal(options.find((option) => option.value === "open")?.label, "Abierta");
    assert.equal(options.find((option) => option.value === "entrevista")?.label, "Entrevista");
    assert.deepEqual(
      options.filter((option) => ["won", "lost", "archived", "handed_off"].includes(option.value)).map((option) => option.label),
      ["Ganada", "Perdida", "Archivada", "Traspasada"]
    );
    const onlyAdmission = growthVentasStatusOptions(tenant, funnels, stages, "admision");
    assert.equal(onlyAdmission.some((option) => option.value === "active"), false);
    assert.equal(onlyAdmission.find((option) => option.value === "open")?.label, "Recibida");
  });

  it("Embudos no deja activo el ítem Oportunidades", () => {
    const ventas = getAllNavTreeItems().find((item) => item.id === "nav-ventas");
    const embudos = getAllNavTreeItems().find((item) => item.id === "nav-embudos");
    assert.ok(ventas);
    assert.ok(embudos);
    assert.equal(isNavActive("/admin/ventas", ventas), true);
    assert.equal(isNavActive("/admin/ventas/opp-1", ventas), true);
    assert.equal(isNavActive("/admin/ventas/embudos", ventas), false);
    assert.equal(isNavActive("/admin/ventas/mi-trabajo", ventas), false);
    assert.equal(isNavActive("/admin/ventas/embudos", embudos), true);
    assert.deepEqual(
      resolveAdminBreadcrumbs("/admin/ventas/embudos").map((item) => item.label),
      ["Inicio", "Embudos"]
    );
    assert.equal(
      resolveAdminBreadcrumbs("/admin/ventas/opp-1").at(-1)?.label,
      "Oportunidad"
    );
  });
});
