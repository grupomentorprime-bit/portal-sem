import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";
import { filterVentasColaItems, sortVentasQueueByPriority } from "../../src/lib/growth/ventas-board";
import { growthVentasPageCopy } from "../../src/lib/growth/labels";
import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";

describe("cola ventas por prioridad comercial", () => {
  it("ordena overdue antes que unfollowed y current", () => {
    const sorted = sortVentasQueueByPriority([
      { id: "c", priorityRank: 3, priorityKey: null, updatedAt: "2026-11-01T00:00:00.000Z" },
      { id: "a", priorityRank: 0, priorityKey: 1, updatedAt: "2026-11-01T00:00:00.000Z" },
      { id: "b", priorityRank: 1, priorityKey: 2, updatedAt: "2026-11-01T00:00:00.000Z" },
    ] as any);

    assert.deepEqual(sorted.map((item) => item.id), ["a", "b", "c"]);
  });

  it("cola filtra solo oportunidades abiertas", () => {
    const visible = filterVentasColaItems([
      { id: "a", status: "interes" },
      { id: "b", status: "contactado" },
      { id: "c", status: "won" },
      { id: "d", status: "archived" },
    ] as any);

    assert.deepEqual(visible.map((item) => item.id), ["a", "b"]);
  });

  it("parsea la vista de ventas con cola como default", async () => {
    const modulePath = resolve(process.cwd(), "src/lib/growth/ventas-vista.ts");
    assert.equal(existsSync(modulePath), true);

    const { parseGrowthVentasVista } = (await import(pathToFileURL(modulePath).href)) as {
      parseGrowthVentasVista: (raw: string | undefined | null) => "cola" | "kanban" | "lista";
    };

    assert.equal(parseGrowthVentasVista(undefined), "cola");
    assert.equal(parseGrowthVentasVista(""), "cola");
    assert.equal(parseGrowthVentasVista("kanban"), "kanban");
    assert.equal(parseGrowthVentasVista("lista"), "lista");
    assert.equal(parseGrowthVentasVista("COLA"), "cola");
  });

  it("expone cola como vista predeterminada y en el switcher", () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), "src/app/admin/ventas/page.tsx"),
      "utf8"
    );
    const listSource = readFileSync(
      resolve(process.cwd(), "src/components/admin/growth/VentasListClient.tsx"),
      "utf8"
    );

    assert.match(pageSource, /parseGrowthVentasVista\(params\.vista\)/);
    assert.match(listSource, /aria-pressed=\{vista === "cola"\}/);
    assert.match(listSource, /pushFilters\(\{ vista: "cola" \}\)/);
    assert.match(listSource, /vista === "cola" \? filterVentasColaItems\(items\) : items/);
    assert.match(listSource, /Cola/);
  });

  it("usa copy SEM en la página de ventas y evita 'Sin oportunidades' en kanban", () => {
    assert.equal(growthVentasPageCopy(SEM_TENANT_ID).title, "Admisión");
    assert.equal(
      growthVentasPageCopy(SEM_TENANT_ID).columnEmptyLabel,
      "Sin postulantes en esta etapa"
    );
    assert.equal(growthVentasPageCopy(ADL_TENANT_ID).title, "Ventas");
  });
});
