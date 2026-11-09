import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sortVentasQueueByPriority } from "../../src/lib/growth/ventas-board";

describe("cola ventas por prioridad comercial", () => {
  it("ordena overdue antes que unfollowed y current", () => {
    const sorted = sortVentasQueueByPriority([
      { id: "c", priorityRank: 3, priorityKey: null, updatedAt: "2026-11-01T00:00:00.000Z" },
      { id: "a", priorityRank: 0, priorityKey: 1, updatedAt: "2026-11-01T00:00:00.000Z" },
      { id: "b", priorityRank: 1, priorityKey: 2, updatedAt: "2026-11-01T00:00:00.000Z" },
    ] as any);

    assert.deepEqual(sorted.map((item) => item.id), ["a", "b", "c"]);
  });
});
