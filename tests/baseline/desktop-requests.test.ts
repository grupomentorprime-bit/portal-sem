import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryAppRequestStore, recordAppRequest } from "../../src/lib/desktop/requests";

describe("solicitudes del escritorio", () => {
  it("la segunda abierta no inserta, y contratar cierra la abierta", async () => {
    const store = createMemoryAppRequestStore();
    const first = await recordAppRequest(store, {
      tenantId: "seminario-ipn",
      appId: "cumple",
      requestedBy: "user-1",
      contracted: ["growth-os"],
      now: "2026-11-11T12:00:00.000Z",
    });
    const second = await recordAppRequest(store, {
      tenantId: "seminario-ipn",
      appId: "cumple",
      requestedBy: "user-2",
      contracted: ["growth-os"],
      now: "2026-11-11T12:05:00.000Z",
    });
    assert.deepEqual(first, { ok: true, already: false });
    assert.deepEqual(second, { ok: true, already: true });
    assert.equal((await store.listOpen("seminario-ipn")).length, 1);

    await store.fulfillOpen("seminario-ipn", "cumple");
    assert.equal((await store.listOpen("seminario-ipn")).length, 0);
  });

  it("rechaza un id desconocido y una app ya contratada", async () => {
    const store = createMemoryAppRequestStore();
    assert.deepEqual(
      await recordAppRequest(store, {
        tenantId: "seminario-ipn",
        appId: "no",
        requestedBy: "user-1",
        contracted: [],
      }),
      { ok: false, reason: "unknown" }
    );
    assert.deepEqual(
      await recordAppRequest(store, {
        tenantId: "seminario-ipn",
        appId: "growth-os",
        requestedBy: "user-1",
        contracted: ["growth-os"],
      }),
      { ok: false, reason: "contracted" }
    );
  });
});
