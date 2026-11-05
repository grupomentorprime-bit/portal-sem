import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dueInputValue,
  formatRecordedWhen,
  formatStageWhen,
  isCalendarDueOverdue,
  santiagoDay,
} from "../../src/core/growth/commercial-dates";
import { growthPriorityBand } from "../../src/core/growth/priority";

describe("fechas comerciales de la ficha", () => {
  it("un día de calendario no se corre al día anterior", () => {
    const shown = formatStageWhen("2026-10-20T00:00:00.000Z");
    assert.match(shown, /(^|\D)20(\D|$)/);
    assert.doesNotMatch(shown, /(^|\D)19(\D|$)/);
    assert.equal(dueInputValue("2026-10-20"), "2026-10-20");
    assert.equal(dueInputValue("2026-10-20T00:00:00.000Z"), "2026-10-20");
  });

  it("vence al terminar ese día en Santiago, no a la medianoche UTC", () => {
    const stillToday = new Date("2026-10-22T02:30:00.000Z");
    assert.equal(santiagoDay(stillToday), "2026-10-21");
    assert.equal(isCalendarDueOverdue("2026-10-21", stillToday), false);
    assert.equal(isCalendarDueOverdue("2026-10-21T00:00:00.000Z", stillToday), false);
    assert.equal(isCalendarDueOverdue("2026-10-20", stillToday), true);

    const afternoon = new Date("2026-10-21T15:00:00.000Z");
    const open = {
      status: "open",
      openedAt: "2026-10-21T12:00:00.000Z",
      updatedAt: "2026-10-21T12:00:00.000Z",
      lastActivityAt: "2026-10-21T12:00:00.000Z",
    };
    assert.equal(
      growthPriorityBand(
        {
          ...open,
          nextAction: {
            summary: "Llamar",
            kind: "contact",
            setAt: "2026-10-21T12:00:00.000Z",
            dueAt: "2026-10-21",
          },
        },
        afternoon,
        7
      ),
      "current"
    );
    assert.equal(
      growthPriorityBand(
        {
          ...open,
          nextAction: {
            summary: "Llamar",
            kind: "contact",
            setAt: "2026-10-20T12:00:00.000Z",
            dueAt: "2026-10-20",
          },
        },
        afternoon,
        7
      ),
      "overdue"
    );
  });

  it("el relativo y la fecha absoluta usan el mismo día", () => {
    const iso = "2026-10-21T15:00:00.000Z";
    const now = new Date("2026-10-21T18:00:00.000Z");
    assert.match(formatRecordedWhen(iso, now), /^Hoy · .*21/);
    assert.match(
      formatRecordedWhen(iso, new Date("2026-10-22T18:00:00.000Z")),
      /^Ayer · .*21/
    );
  });
});
