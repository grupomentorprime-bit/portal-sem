import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { formatSubmissionAnswer } from "../../src/lib/admin/forms-center";

describe("respuestas: zona e iglesia", () => {
  it("muestra la etiqueta de la zona y el texto de la iglesia", () => {
    assert.equal(
      formatSubmissionAnswer("zona-7", {
        options: [
          { label: "Zona 7", value: "zona-7" },
          { label: "Zona 8", value: "zona-8" },
        ],
      }),
      "Zona 7"
    );
    assert.equal(formatSubmissionAnswer("IPN Ñuble alto", null), "IPN Ñuble alto");
    assert.equal(formatSubmissionAnswer("  ", null), "—");
  });

  it("el listado de respuestas incluye las columnas de zona e iglesia", () => {
    const table = readFileSync(
      "src/components/admin/forms/ExperienceFormSubmissionsTable.tsx",
      "utf8"
    );
    const panel = readFileSync("src/components/admin/forms/FormSubmissionsPanel.tsx", "utf8");
    const detail = readFileSync("src/components/admin/forms/FormDetailClient.tsx", "utf8");
    assert.match(table, /header: zonaField\?\.label \|\| "Zona"/);
    assert.match(table, /header: iglesiaField\?\.label \|\| "Iglesia"/);
    assert.match(panel, /fields=\{fields\}/);
    assert.match(detail, /fields=\{form\.fields\}/);
  });
});
