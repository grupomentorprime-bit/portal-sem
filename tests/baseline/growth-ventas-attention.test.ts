import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  countVentasAttention,
  matchesVentasBand,
} from "../../src/lib/growth/ventas-attention";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("indicadores de la cola de ventas", () => {
  const overdue = { priorityBand: "overdue" as const, ownerUserId: "ana" };
  const overdueOpen = { priorityBand: "overdue" as const };
  const unfollowed = { priorityBand: "unfollowed" as const, ownerUserId: "ana" };
  const closed = { priorityBand: null, ownerUserId: undefined };

  it("cuenta la vencida visible y no una cerrada", () => {
    const counts = countVentasAttention([overdue, overdueOpen, unfollowed, closed]);
    assert.equal(counts.overdue, 2);
    assert.equal(counts.unfollowed, 1);
    assert.equal(counts.stale, 0);
    assert.equal(counts.unassigned, 1);
  });

  it("la banda no altera el conteo: solo oculta filas", () => {
    const items = [overdue, unfollowed];
    const counts = countVentasAttention(items);
    const visible = items.filter((item) => matchesVentasBand(item, "unfollowed"));
    assert.equal(counts.overdue, 1);
    assert.deepEqual(visible, [unfollowed]);
    assert.equal(matchesVentasBand(overdueOpen, "unassigned"), true);
    assert.equal(matchesVentasBand(closed, "unassigned"), false);
    assert.equal(matchesVentasBand(closed, "overdue"), false);
  });

  it("la página usa el conteo de la cola y no el panel personal", () => {
    const page = readSrc("src/app/admin/ventas/page.tsx");
    const read = readSrc("src/lib/growth/ventas-read.ts");
    assert.match(page, /attention=\{board\.attention\}/);
    assert.doesNotMatch(page, /readCommercialPanel/);
    assert.match(read, /countVentasAttention\(items\)/);
    assert.match(read, /matchesVentasBand/);
  });
});
