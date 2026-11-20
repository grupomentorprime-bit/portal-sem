import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  distributeProportional,
  distributeSplitLegs,
} from "../../src/core/congress/payment-distribute";

describe("distributeProportional", () => {
  it("reparte en partes iguales cuando los saldos son iguales", () => {
    const rows = [
      { registrationId: "a", balanceClp: 17000 },
      { registrationId: "b", balanceClp: 17000 },
      { registrationId: "c", balanceClp: 17000 },
      { registrationId: "d", balanceClp: 17000 },
      { registrationId: "e", balanceClp: 17000 },
    ];
    const out = distributeProportional(rows, 42500);
    const sum = out.reduce((s, r) => s + r.amountClp, 0);
    assert.equal(sum, 42500);
    assert.equal(out.length, 5);
    assert.deepEqual(
      out.map((r) => r.amountClp).sort((a, b) => a - b),
      [8500, 8500, 8500, 8500, 8500]
    );
  });

  it("reparte residuo por mayor saldo restante y desempate por id", () => {
    const rows = [
      { registrationId: "b", balanceClp: 100 },
      { registrationId: "a", balanceClp: 100 },
    ];
    const out = distributeProportional(rows, 101);
    assert.equal(out.reduce((s, r) => s + r.amountClp, 0), 101);
    const byId = Object.fromEntries(out.map((r) => [r.registrationId, r.amountClp]));
    assert.equal(byId.a, 51);
    assert.equal(byId.b, 50);
  });

  it("ignora saldo 0 y retorna vacío si monto <= 0", () => {
    assert.deepEqual(
      distributeProportional([{ registrationId: "a", balanceClp: 0 }], 100),
      []
    );
    assert.deepEqual(
      distributeProportional([{ registrationId: "a", balanceClp: 100 }], 0),
      []
    );
  });

  it("lanza si el monto supera la suma de saldos", () => {
    assert.throws(
      () =>
        distributeProportional([{ registrationId: "a", balanceClp: 100 }], 101),
      /amount_exceeds_balances/
    );
  });

  it("el efectivo y la transferencia juntos no superan el saldo de cada ficha", () => {
    const rows = [
      { registrationId: "a", balanceClp: 10000 },
      { registrationId: "b", balanceClp: 7000 },
    ];
    const { cash, transfer } = distributeSplitLegs(rows, 10000, 7000);
    const byId = new Map<string, number>();
    for (const row of [...cash, ...transfer]) {
      byId.set(row.registrationId, (byId.get(row.registrationId) ?? 0) + row.amountClp);
    }
    assert.equal(
      cash.reduce((sum, row) => sum + row.amountClp, 0),
      10000
    );
    assert.equal(
      transfer.reduce((sum, row) => sum + row.amountClp, 0),
      7000
    );
    assert.equal(byId.get("a"), 10000);
    assert.equal(byId.get("b"), 7000);
  });

  it("reparte proporcional con saldos desiguales", () => {
    const rows = [
      { registrationId: "x", balanceClp: 10000 },
      { registrationId: "y", balanceClp: 5000 },
    ];
    const out = distributeProportional(rows, 3000);
    const byId = Object.fromEntries(out.map((r) => [r.registrationId, r.amountClp]));
    assert.equal(byId.x, 2000);
    assert.equal(byId.y, 1000);
  });
});
