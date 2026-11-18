import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCongressImportPreview,
  parseZoneSheetGrid,
} from "../../src/core/congress/import-preview";
import { planCongressImportCommit } from "../../src/core/congress/import-commit";

describe("congress import commit churches", () => {
  it("parseZoneSheetGrid lista iglesias aunque no haya hermanos", () => {
    const parsed = parseZoneSheetGrid("zona-4", "ZONA 4", [
      ["IGLESIAS", "HERMANOS", "DIA ASISTIR"],
      [],
      ["GRANEROS", null, null],
      ["RANCAGUA IRENE FREI", null, null],
    ]);
    const names = parsed.churches.map((c) => c.churchName).sort();
    assert.deepEqual(names, ["GRANEROS", "RANCAGUA IRENE FREI"]);
  });

  it("plan incluye churchesToUpsert y toCreate sin lodging writes", () => {
    const preview = buildCongressImportPreview({
      peopleRows: [
        {
          zoneId: "zona-1",
          zoneLabel: "Z1",
          churchName: "Quilicura",
          fullName: "Hno David Orellana",
          expectedDayLabel: "SÁBADO Y DOMINGO",
          sheetRow: 3,
        },
      ],
      churches: [{ zoneId: "zona-4", churchName: "GRANEROS" }],
      lodgingRequests: [
        {
          zoneId: "zona-7",
          churchName: "HUAMBALI",
          requestedBeds: 10,
          note: "10 alojamientos",
        },
      ],
    });
    const plan = planCongressImportCommit({
      preview,
      existing: [],
      batchId: "batch-1",
    });
    assert.equal(plan.toCreate.length, 1);
    assert.ok(plan.churchesToUpsert.some((c) => c.churchName === "Quilicura"));
    assert.ok(plan.churchesToUpsert.some((c) => c.churchName === "GRANEROS"));
    assert.equal(
      "lodgingToCreate" in plan
        ? ((plan as { lodgingToCreate?: unknown[] }).lodgingToCreate?.length ?? 0)
        : 0,
      0
    );
  });
});
