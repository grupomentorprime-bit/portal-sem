import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { foldCongressPersonName } from "../../src/core/congress/brother-name";
import {
  congressPersonNameContained,
  planRegistrationNameDedupes,
  preferFreshestRegistration,
} from "../../src/core/congress/registration-dedupe";

function row(
  id: string,
  name: string,
  updatedAt: string,
  extras: {
    createdAt?: string;
    submissionId?: string | null;
    entryNumber?: number;
    zoneId?: string;
    churchName?: string;
  } = {}
) {
  return {
    _id: id,
    zoneId: extras.zoneId ?? "zona-7",
    churchName: extras.churchName ?? "IPN ÑUBLE ALTO",
    identity: {
      fullName: name,
      rut: null,
      email: null,
      phone: null,
      status: "provisional" as const,
    },
    updatedAt,
    createdAt: extras.createdAt ?? updatedAt,
    submissionId: extras.submissionId ?? null,
    entryNumber: extras.entryNumber ?? null,
  };
}

describe("dedupe por nombre", () => {
  it("pliega títulos y acentos", () => {
    assert.equal(foldCongressPersonName("Pastor Hernán Sepúlveda"), "hernan sepulveda");
    assert.equal(foldCongressPersonName("hernan sepulveda"), "hernan sepulveda");
    assert.equal(foldCongressPersonName("Hno Luis Leiva"), "luis leiva");
  });

  it("detecta nombre corto contenido en el largo", () => {
    assert.equal(
      congressPersonNameContained("Hno Luis Pérez", "Luis Benjamín Pérez Saavedra"),
      true
    );
    assert.equal(
      congressPersonNameContained("Hno Luis Pérez", "Hno Juan Pérez"),
      false
    );
  });

  it("prefiere formulario y nombre más completo", () => {
    const short = row("a", "Hno Luis Pérez", "2026-11-18T12:00:00.000Z");
    const full = row("b", "Luis Benjamín Pérez Saavedra", "2026-11-18T10:00:00.000Z", {
      submissionId: "sub-1",
    });
    assert.equal(preferFreshestRegistration(short, full)._id, "b");
  });

  it("planifica keep/drop para duplicados exactos y contenidos", () => {
    const plans = planRegistrationNameDedupes([
      row("old", "Pastor Hernán Sepúlveda", "2026-11-18T10:00:00.000Z", {
        entryNumber: 177,
      }),
      row("new", "hernan sepulveda", "2026-11-18T18:00:00.000Z", {
        submissionId: "sub-1",
        entryNumber: 188,
      }),
      row("luis-short", "Hno Luis Pérez", "2026-11-18T11:00:00.000Z"),
      row("luis-full", "Luis Benjamín Pérez Saavedra", "2026-11-18T12:00:00.000Z", {
        submissionId: "sub-2",
      }),
      row("solo", "Hno Marco", "2026-11-18T11:00:00.000Z"),
    ]);
    const byKeep = new Map(plans.map((p) => [p.keep._id, p]));
    assert.equal(byKeep.get("new")?.drop[0]?._id, "old");
    assert.equal(byKeep.get("luis-full")?.drop[0]?._id, "luis-short");
  });
});
