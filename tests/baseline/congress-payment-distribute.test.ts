import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { distributeProportional } from "../../src/core/congress/payment-distribute";

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
