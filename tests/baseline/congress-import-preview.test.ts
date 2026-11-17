import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCongressImportPreview,
  looksLikePersonName,
  parseZoneSheetGrid,
} from "../../src/core/congress/import-preview";

describe("congress import preview", () => {
  it("reconoce nombres con Hno/Pastor y rechaza Hno solo", () => {
    assert.equal(looksLikePersonName("Hno David Orellana"), true);
    assert.equal(looksLikePersonName("Pastor Iván González"), true);
    assert.equal(looksLikePersonName("Hno"), false);
    assert.equal(looksLikePersonName("4 ALOJAMIENTOS"), false);
  });

  it("asocia la nota de alojamiento a la iglesia activa", () => {
    const { lodgingRequests } = parseZoneSheetGrid("zona-3", "ZONA 3", [
      ["IGLESIAS", "HERMANOS", "DIA ASISTIR"],
      ["ROCA SANTO DOMINGO", "Hno Cristian Soto", "SÁBADO Y DOMINGO"],
      ["4 ALOJAMIENTOS", "Hno Antonio Moreno", "SÁBADO Y DOMINGO"],
    ]);
    assert.equal(lodgingRequests[0]?.churchName, "ROCA SANTO DOMINGO");
    assert.equal(lodgingRequests[0]?.requestedBeds, 4);
  });

  it("parsea bloques IGLESIAS|HERMANOS|DIA y deja gaps sin ficha", () => {
    const { peopleRows, lodgingRequests } = parseZoneSheetGrid("zona-6", "ZONA 6", [
      ["IGLESIAS", "HERMANOS", "DIA ASISTIR"],
      ["", "", ""],
      ["LOS CRISTALES", "Hno", ""],
      ["2 alojamientos", "", "Sábado"],
      ["", "", ""],
      ["CONSTITUCION", "Hno Gilberto González", "SÁBADO Y DOMINGO"],
      ["3 alojamientos", "Hno Manuel Jara", "SÁBADO Y DOMINGO"],
    ]);

    const preview = buildCongressImportPreview({
      peopleRows,
      declaredZones: [{ zoneId: "zona-6", registered: 4 }],
      lodgingRequests,
    });

    assert.ok(preview.namedPeople.some((p) => p.fullName.includes("Gilberto")));
    assert.ok(preview.namedPeople.every((p) => looksLikePersonName(p.fullName)));
    assert.ok(preview.quantityGaps.length >= 1);
    assert.equal(preview.autoMergeSuggestions.length, 0);
    assert.ok(lodgingRequests.some((r) => r.requestedBeds === 2));
  });

  it("no crea fichas vacías desde filas sin nombre", () => {
    const preview = buildCongressImportPreview({
      peopleRows: [
        {
          zoneId: "zona-8",
          zoneLabel: "Zona 8",
          churchName: "Nacimiento",
          fullName: "",
          expectedDayLabel: "Domingo",
          sheetRow: 1,
        },
        {
          zoneId: "zona-8",
          zoneLabel: "Zona 8",
          churchName: "Nacimiento",
          fullName: "Hno",
          expectedDayLabel: null,
          sheetRow: 2,
        },
      ],
    });
    assert.equal(preview.namedPeople.length, 0);
    assert.equal(preview.quantityGaps.length, 2);
    assert.deepEqual(preview.autoMergeSuggestions, []);
  });
});
