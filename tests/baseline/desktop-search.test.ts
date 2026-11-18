import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { desktopSearch } from "../../src/lib/desktop/search";

const spaces = [
  { tenantId: "sem", name: "Seminario Eclesiástico Mayor" },
  { tenantId: "adl", name: "Academia ADL" },
];

describe("buscador del escritorio", () => {
  it("sin texto muestra las aplicaciones de esa mesa y ninguna organización", () => {
    assert.deepEqual(
      desktopSearch({ query: "", owner: false, spaces }).map((hit) => hit.title),
      ["Growth OS", "Cumple", "Aprende Hoy", "RR.HH.", "Mensajes", "Chat en vivo"]
    );
    assert.deepEqual(
      desktopSearch({ query: "   ", owner: true, spaces }).map((hit) => hit.id),
      ["mensajes", "envivo", "clientes", "ajustes"]
    );
  });

  it("Ajustes se busca, y no aparece en el catálogo vacío del cliente", () => {
    assert.deepEqual(
      desktopSearch({ query: "ajustes", owner: true, spaces }).map((hit) => hit.id),
      ["ajustes"]
    );
    assert.deepEqual(
      desktopSearch({ query: "ajustes", owner: false, spaces }).map((hit) => hit.id),
      ["ajustes"]
    );
    assert.deepEqual(
      desktopSearch({ query: "ajustes", owner: false, spaces, companySettings: false }).map(
        (hit) => hit.id
      ),
      []
    );
    assert.equal(desktopSearch({ query: "", owner: false, spaces }).some((hit) => hit.id === "ajustes"), false);
  });

  it("encuentra una aplicación por nombre o por su frase, sin distinguir mayúsculas ni tildes", () => {
    const byName = desktopSearch({ query: "cumple", owner: false, spaces });
    assert.equal(byName[0]?.kind, "app");
    assert.equal(byName[0]?.id, "cumple");

    const byPhrase = desktopSearch({ query: "vida academica", owner: false, spaces });
    assert.deepEqual(
      byPhrase.map((hit) => hit.id),
      ["aprende-hoy"]
    );
  });

  it("con texto también encuentra organizaciones", () => {
    const found = desktopSearch({ query: "eclesiastico", owner: true, spaces });
    assert.deepEqual(
      found.map((hit) => hit.id),
      ["sem"]
    );
    assert.equal(found[0]?.detail, "Cliente");

    const member = desktopSearch({ query: "ADL", owner: false, spaces });
    assert.equal(member[0]?.id, "adl");
    assert.equal(member[0]?.detail, "Espacio");
  });

  it("un nombre que no existe no devuelve filas", () => {
    assert.deepEqual(desktopSearch({ query: "zzz", owner: false, spaces }), []);
  });
});
