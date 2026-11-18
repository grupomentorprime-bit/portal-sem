import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRESENCE_TTL_MS,
  onlineOrganizations,
  presenceIsFresh,
  staffIsOnline,
  type PresenceBeat,
} from "../../src/lib/desktop/presence";

const now = Date.parse("2026-11-18T20:00:00.000Z");

function beat(partial: Partial<PresenceBeat> & Pick<PresenceBeat, "userId" | "kind">): PresenceBeat {
  return {
    tenantId: null,
    company: "",
    displayName: partial.userId,
    seenAt: new Date(now).toISOString(),
    ...partial,
  };
}

describe("presencia del escritorio", () => {
  it("un latido reciente está fresco y uno viejo no", () => {
    assert.equal(presenceIsFresh(new Date(now - 10_000).toISOString(), now), true);
    assert.equal(presenceIsFresh(new Date(now - PRESENCE_TTL_MS - 1).toISOString(), now), false);
    assert.equal(presenceIsFresh("no-es-fecha", now), false);
  });

  it("el equipo está en línea solo con un latido de staff vigente", () => {
    const beats = [
      beat({ userId: "op", kind: "staff", seenAt: new Date(now - 20_000).toISOString() }),
      beat({ userId: "cli", kind: "client", tenantId: "sem", company: "Seminario", seenAt: new Date(now).toISOString() }),
    ];
    assert.equal(staffIsOnline(beats, now), true);
    assert.equal(staffIsOnline([beats[1]], now), false);
    assert.equal(
      staffIsOnline(
        [beat({ userId: "op", kind: "staff", seenAt: new Date(now - PRESENCE_TTL_MS - 1).toISOString() })],
        now
      ),
      false
    );
  });

  it("agrupa a los clientes en línea por empresa y deja fuera al equipo", () => {
    const rows = onlineOrganizations(
      [
        beat({ userId: "op", kind: "staff" }),
        beat({
          userId: "a",
          kind: "client",
          tenantId: "sem",
          company: "Seminario",
          displayName: "Ana",
        }),
        beat({
          userId: "b",
          kind: "client",
          tenantId: "sem",
          company: "Seminario",
          displayName: "Ana",
        }),
        beat({
          userId: "c",
          kind: "client",
          tenantId: "adl",
          company: "ADL",
          displayName: "Luis",
          seenAt: new Date(now - PRESENCE_TTL_MS - 5).toISOString(),
        }),
      ],
      now
    );
    assert.deepEqual(rows, [{ tenantId: "sem", company: "Seminario", names: ["Ana"] }]);
  });
});
