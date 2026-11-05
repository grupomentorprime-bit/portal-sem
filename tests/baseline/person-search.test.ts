import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { rosterStudentMatchesQuery } from "../../src/lib/experience/forms/roster-import";
import {
  collectPersonSearchSuggestions,
  matchesPersonSearch,
} from "../../src/lib/experience/forms/person-search";
import type { ConvocatoriaRosterStudent } from "../../src/types/convocatoria-roster";

const student: ConvocatoriaRosterStudent = {
  id: "rut-12345678k",
  fullName: "María José González Muñoz",
  generation: "G-2024",
  rut: "12.345.678-K",
  phone: "+56 9 8765 4321",
  email: "maria.gonzalez@sem.cl",
};

describe("búsqueda de personas en convocatoria", () => {
  it("encuentra por nombre sin tilde y por RUT con puntos, guión, espacios o K", () => {
    for (const query of [
      "Maria Jose",
      "Muñoz",
      "Munoz",
      "12.345.678-K",
      "12345678-K",
      "12345678k",
      "12 345 678 K",
      "12345678 K",
    ]) {
      assert.equal(rosterStudentMatchesQuery(student, query), true, query);
    }
    assert.equal(rosterStudentMatchesQuery(student, "Gonzáles"), false);
    assert.equal(rosterStudentMatchesQuery(student, "MariaJose"), true);
    assert.equal(
      rosterStudentMatchesQuery(
        { ...student, fullName: "María De La Cruz Soto" },
        "Delacruz"
      ),
      true
    );
  });

  it("sugiere a la persona cuando el nombre o el RUT van con un error", () => {
    const people = [
      student,
      {
        id: "otro",
        fullName: "Pedro Pérez Soto",
        generation: "G-2024",
        rut: "11.111.111-1",
      },
    ];
    const fieldsOf = (person: (typeof people)[number]) => [person.fullName, person.rut];

    const byTypo = collectPersonSearchSuggestions("Gonzales", people, fieldsOf);
    assert.deepEqual(
      byTypo.items.map((person) => person.id),
      ["rut-12345678k"]
    );

    const withRightGivenName = collectPersonSearchSuggestions("Maria Gonzales", people, fieldsOf);
    assert.deepEqual(
      withRightGivenName.items.map((person) => person.id),
      ["rut-12345678k"]
    );

    const otherSurname = collectPersonSearchSuggestions("Gonzales Perez", people, fieldsOf);
    assert.equal(otherSurname.items.length, 0);

    const exact = collectPersonSearchSuggestions("González", people, fieldsOf);
    assert.equal(exact.items.length, 0);

    assert.equal(matchesPersonSearch("12.345.678-9", fieldsOf(student)), true);
    const rutTypo = collectPersonSearchSuggestions("12.345.679-K", people, fieldsOf);
    assert.deepEqual(
      rutTypo.items.map((person) => person.id),
      ["rut-12345678k"]
    );
    assert.equal(matchesPersonSearch("12.345.679-K", fieldsOf(student)), false);
  });

  it("usa la misma regla dentro, en la búsqueda de participantes", () => {
    const fields = [student.fullName, student.rut, student.phone, student.email];
    assert.equal(matchesPersonSearch("Muñoz", fields), true);
    assert.equal(matchesPersonSearch("12345678 K", fields), true);
    assert.equal(matchesPersonSearch("maria.gonzalez@sem.cl", fields), true);
    assert.equal(matchesPersonSearch("Gonzáles", fields), false);
  });

  it("el panel de jornada y la tabla de respuestas buscan con esa regla", () => {
    const jornada = readFileSync(
      "src/components/admin/student-affairs/StudentAffairsOperationsPanel.tsx",
      "utf8"
    );
    const table = readFileSync(
      "src/components/admin/forms/ExperienceFormSubmissionsTable.tsx",
      "utf8"
    );
    const rosterPanel = readFileSync(
      "src/components/admin/forms/ConvocatoriaRosterPanel.tsx",
      "utf8"
    );
    const publicForm = readFileSync(
      "src/components/portal/experience/forms/ConvocatoriaParticipantFields.tsx",
      "utf8"
    );
    const route = readFileSync(
      "src/app/api/experience/forms/convocatorias/[slug]/roster/search/route.ts",
      "utf8"
    );
    assert.match(jornada, /collectPersonSearchSuggestions/);
    assert.match(table, /collectPersonSearchSuggestions/);
    assert.match(rosterPanel, /collectPersonSearchSuggestions/);
    assert.match(publicForm, /Sugerencias/);
    assert.match(route, /suggestions/);
    assert.match(table, /data\.rut/);
  });
});
