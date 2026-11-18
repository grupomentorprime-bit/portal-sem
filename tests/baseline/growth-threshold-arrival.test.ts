import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  THRESHOLD_ARRIVAL_KEY,
  THRESHOLD_ARRIVAL_WINDOW_MS,
  consumeThresholdArrival,
  markThresholdArrival,
  shouldPlayArrival,
  type ThresholdArrivalStorage,
} from "../../src/lib/identity/threshold-arrival";

function memoryStorage(): ThresholdArrivalStorage & { dump(): Map<string, string> } {
  const data = new Map<string, string>();
  return {
    dump: () => data,
    get: (key) => data.get(key) ?? null,
    set: (key, value) => {
      data.set(key, value);
    },
    remove: (key) => {
      data.delete(key);
    },
  };
}

describe("señal de llegada del umbral", () => {
  it("reproduce dentro de 15 s y no en el límite", () => {
    assert.equal(THRESHOLD_ARRIVAL_WINDOW_MS, 15_000);
    const now = 1_700_000_000_000;
    assert.equal(shouldPlayArrival(now - 14_999, now), true);
    assert.equal(shouldPlayArrival(now, now), true);
    assert.equal(shouldPlayArrival(now - 15_000, now), false);
    assert.equal(shouldPlayArrival(now + 1, now), false);
    assert.equal(shouldPlayArrival(Number.NaN, now), false);
  });

  it("guarda solo el timestamp y la segunda lectura no reproduce", () => {
    const storage = memoryStorage();
    const now = 1_700_000_000_000;
    markThresholdArrival(storage, now);
    assert.equal(storage.dump().get(THRESHOLD_ARRIVAL_KEY), String(now));
    assert.equal(storage.dump().size, 1);
    assert.equal(consumeThresholdArrival(storage, now + 1000), true);
    assert.equal(storage.dump().has(THRESHOLD_ARRIVAL_KEY), false);
    assert.equal(consumeThresholdArrival(storage, now + 1000), false);
  });

  it("borra una señal vieja o inválida sin reproducir", () => {
    const storage = memoryStorage();
    const now = 1_700_000_000_000;
    storage.set(THRESHOLD_ARRIVAL_KEY, "no-es-numero");
    assert.equal(consumeThresholdArrival(storage, now), false);
    assert.equal(storage.dump().has(THRESHOLD_ARRIVAL_KEY), false);

    storage.set(THRESHOLD_ARRIVAL_KEY, String(now - 15_000));
    assert.equal(consumeThresholdArrival(storage, now), false);
    assert.equal(storage.dump().has(THRESHOLD_ARRIVAL_KEY), false);
  });
});
