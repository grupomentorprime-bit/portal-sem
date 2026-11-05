import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildChileEventStartIso,
  formatConvocatoriaHorarioLabel,
} from "../../src/lib/experience/forms/convocatoria-event-datetime";

describe("horario de la jornada en Chile", () => {
  it("las 9:00 siguen siendo las 9:00 aunque noviembre tenga horario de verano", () => {
    const label = formatConvocatoriaHorarioLabel("09:00", false);
    assert.match(label, /Desde las 9:00/);
    assert.match(label, /a\.\s*m\./);
    assert.doesNotMatch(label, /10/);
    assert.equal(buildChileEventStartIso("2026-11-07", "09:00"), "2026-11-07T09:00:00-03:00");
  });

  it("en julio conserva el offset de invierno", () => {
    assert.equal(buildChileEventStartIso("2026-07-04", "09:00"), "2026-07-04T09:00:00-04:00");
  });
});
