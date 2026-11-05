import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findExcludedStudentByIdentity,
  reconcileExcludedStudents,
} from "../../src/lib/experience/forms/roster-exclusion";
import type { ConvocatoriaExcludedStudent } from "../../src/types/convocatoria-roster";

const excluded: ConvocatoriaExcludedStudent[] = [
  {
    id: "stu-1",
    fullName: "María Elizabeth Catalina Avello Riquelme",
    generation: "G-2026",
    reason: "Deserción definitiva",
    excludedAt: "2026-11-05T00:00:00.000Z",
  },
  {
    id: "stu-2",
    fullName: "Neftalí Adrian Leyton Lemus",
    generation: "G-2026",
    rut: "12.345.678-9",
    reason: "No continuará",
    excludedAt: "2026-11-05T00:00:00.000Z",
  },
];

describe("exclusión de desertores en convocatoria", () => {
  it("detecta exclusión por nombre o RUT", () => {
    assert.equal(
      findExcludedStudentByIdentity(excluded, {
        fullName: "María Elizabeth Catalina Avello Riquelme",
      })?.id,
      "stu-1"
    );
    assert.equal(
      findExcludedStudentByIdentity(excluded, {
        fullName: "Neftali",
        rut: "12345678-9",
      })?.id,
      "stu-2"
    );
  });

  it("al reincorporar a la nómina, sale de la exclusión", () => {
    const next = reconcileExcludedStudents(
      [
        {
          id: "stu-1",
          fullName: "María Elizabeth Catalina Avello Riquelme",
          generation: "G-2026",
        },
      ],
      excluded
    );
    assert.equal(next.length, 1);
    assert.equal(next[0]?.id, "stu-2");
  });
});
