import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const layout = readFileSync("src/app/(site)/layout.tsx", "utf8");

describe("site layout gate", () => {
  it("decide la página pública y muestra por comenzar", () => {
    assert.match(layout, /decidePublicSite/);
    assert.match(layout, /ComingSoonPage/);
    assert.match(layout, /comingSoonModel/);
    assert.doesNotMatch(layout, /institution\.status/);
  });
});
