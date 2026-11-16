import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACCOUNT_PHONE_CHILE_INVALID,
  ACCOUNT_PHONE_INVALID,
  normalizeAccountPhone,
} from "../../src/lib/identity/account-phone";

describe("teléfono de la cuenta", () => {
  it("normaliza un móvil chileno sin código a +56", () => {
    assert.deepEqual(normalizeAccountPhone("998874221"), {
      ok: true,
      phone: "+56 9 9887 4221",
    });
  });

  it("acepta +56 con espacios, guiones y prefijo 00", () => {
    assert.deepEqual(normalizeAccountPhone("+56 9 9887 4221"), {
      ok: true,
      phone: "+56 9 9887 4221",
    });
    assert.deepEqual(normalizeAccountPhone("56 9 9887-4221"), {
      ok: true,
      phone: "+56 9 9887 4221",
    });
    assert.deepEqual(normalizeAccountPhone("0056 9 9887 4221"), {
      ok: true,
      phone: "+56 9 9887 4221",
    });
  });

  it("acepta números de otros países", () => {
    const argentina = normalizeAccountPhone("+54 9 11 5555 1234");
    const peru = normalizeAccountPhone("+51 987 654 321");
    const eeuu = normalizeAccountPhone("+1 202 555 0123");
    const espana = normalizeAccountPhone("+34 612 345 678");
    assert.equal(argentina.ok, true);
    assert.equal(peru.ok, true);
    assert.equal(eeuu.ok, true);
    assert.equal(espana.ok, true);
    if (argentina.ok) {
      assert.equal(argentina.phone, "+54 911 5555 1234");
      assert.ok((argentina.phone.split(" ").at(-1)?.length ?? 0) >= 3);
    }
    if (peru.ok) assert.equal(peru.phone, "+51 987 654 321");
    if (eeuu.ok) assert.equal(eeuu.phone, "+1 202 555 0123");
    if (espana.ok) assert.match(espana.phone, /^\+34 /);
  });

  it("avisa si el número no sirve y deja el campo vacío como válido", () => {
    assert.deepEqual(normalizeAccountPhone("   "), { ok: true, phone: "" });
    assert.deepEqual(normalizeAccountPhone("123"), {
      ok: false,
      error: ACCOUNT_PHONE_INVALID,
    });
    assert.deepEqual(normalizeAccountPhone("hola"), {
      ok: false,
      error: ACCOUNT_PHONE_INVALID,
    });
    assert.deepEqual(normalizeAccountPhone("+56 9"), {
      ok: false,
      error: ACCOUNT_PHONE_CHILE_INVALID,
    });
  });
});
