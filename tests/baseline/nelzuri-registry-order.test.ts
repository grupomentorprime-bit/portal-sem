import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { listManifests } from "../../src/nelzuri";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

describe("registro de capacidades sin orden de importación", () => {
  it("publica Admisión, Asuntos y Congreso antes de cargar reglas o efectos", () => {
    assert.deepEqual(
      listManifests()
        .filter((item) => item.class === "specialized")
        .map((item) => item.id),
      ["admision", "asuntos-estudiantiles", "congreso"]
    );
  });

  it("el instalador de cliente no arrastra el informe, y el de servidor sí lo entrega", async () => {
    const installer = readFileSync(
      resolve(process.cwd(), "src/lib/desktop/register-specialized.ts"),
      "utf8"
    );
    assert.equal(installer.includes("form-effect"), false);
    assert.equal(installer.includes("informe"), false);
    const before = listManifests().map((item) => item.id);
    const installed = await import("../../src/lib/desktop/register-specialized");
    installed.ensureSpecializedCapabilities();
    await import("../../src/lib/desktop/register-form-effects");
    const { resolveFormEffect, listManifests: listed } = await import("../../src/nelzuri");
    assert.deepEqual(
      listed().map((item) => item.id),
      before
    );
    assert.equal(
      resolveFormEffect({ _id: "ipn-asistencia-congreso-varones-2026" }, "ipn-chile").status,
      "one"
    );
    assert.equal(
      resolveFormEffect({ _id: "cumple-diagnostico" }, "cumple").status,
      "one"
    );
  });
});
