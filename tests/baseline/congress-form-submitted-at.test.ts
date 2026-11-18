import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formSubmissionDisplay,
  submissionIdKey,
  withFormSubmittedAt,
} from "../../src/core/congress/form-engagement";
import type { CongressRegistration } from "../../src/core/congress/types";

function base(
  partial: Partial<CongressRegistration> &
    Pick<CongressRegistration, "source">
): Pick<CongressRegistration, "source" | "submissionId" | "formSubmittedAt"> {
  return {
    source: partial.source,
    submissionId: partial.submissionId ?? null,
    formSubmittedAt: partial.formSubmittedAt ?? null,
  };
}

describe("formSubmissionDisplay", () => {
  it("Formulario cuando source=form y hay hora", () => {
    assert.deepEqual(
      formSubmissionDisplay(
        base({ source: "form", formSubmittedAt: "2026-11-10T18:00:00.000Z" })
      ),
      { label: "Formulario", at: "2026-11-10T18:00:00.000Z" }
    );
  });

  it("Actualización cuando hay hora y source no es form", () => {
    assert.deepEqual(
      formSubmissionDisplay(
        base({
          source: "import",
          submissionId: "sub1",
          formSubmittedAt: "2026-11-11T12:00:00.000Z",
        })
      ),
      { label: "Actualización", at: "2026-11-11T12:00:00.000Z" }
    );
    assert.deepEqual(
      formSubmissionDisplay(
        base({ source: "door", formSubmittedAt: "2026-11-11T12:00:00.000Z" })
      ),
      { label: "Actualización", at: "2026-11-11T12:00:00.000Z" }
    );
  });

  it("sin etiqueta si no hay hora", () => {
    assert.deepEqual(formSubmissionDisplay(base({ source: "import" })), {
      label: null,
      at: null,
    });
    assert.deepEqual(
      formSubmissionDisplay(
        base({ source: "form", formSubmittedAt: null })
      ),
      { label: null, at: null }
    );
  });
});

describe("withFormSubmittedAt", () => {
  it("adjunta createdAt del envío por submissionId", () => {
    const regs = [
      {
        _id: "a",
        source: "form" as const,
        submissionId: "sub-a",
      },
      {
        _id: "b",
        source: "import" as const,
        submissionId: null,
      },
      {
        _id: "c",
        source: "import" as const,
        submissionId: "missing",
      },
    ] as CongressRegistration[];
    const map = new Map([["sub-a", "2026-11-10T18:00:00.000Z"]]);
    const out = withFormSubmittedAt(regs, map);
    assert.equal(out[0].formSubmittedAt, "2026-11-10T18:00:00.000Z");
    assert.equal(out[1].formSubmittedAt, null);
    assert.equal(out[2].formSubmittedAt, null);
  });

  it("acepta submissionId no-string (ObjectId-like) sin lanzar", () => {
    const hex = "507f1f77bcf86cd799439011";
    const objectIdLike = {
      toHexString() {
        return hex;
      },
      toString() {
        return hex;
      },
    };
    const onlyToString = {
      toString() {
        return "507f1f77bcf86cd799439012";
      },
    };
    const regs = [
      { _id: "a", source: "form", submissionId: objectIdLike },
      { _id: "b", source: "import", submissionId: onlyToString },
      { _id: "c", source: "import", submissionId: `  ${hex}  ` },
      { _id: "d", source: "import", submissionId: {} },
      { _id: "e", source: "import", submissionId: 42 },
    ] as unknown as CongressRegistration[];
    const map = new Map([
      [hex, "2026-11-10T18:00:00.000Z"],
      ["507f1f77bcf86cd799439012", "2026-11-11T09:00:00.000Z"],
    ]);
    const out = withFormSubmittedAt(regs, map);
    assert.equal(out[0].formSubmittedAt, "2026-11-10T18:00:00.000Z");
    assert.equal(out[1].formSubmittedAt, "2026-11-11T09:00:00.000Z");
    assert.equal(out[2].formSubmittedAt, "2026-11-10T18:00:00.000Z");
    assert.equal(out[3].formSubmittedAt, null);
    assert.equal(out[4].formSubmittedAt, null);
  });
});

describe("submissionIdKey", () => {
  it("normaliza strings, objetos y descarta inválidos", () => {
    assert.equal(submissionIdKey(" abc "), "abc");
    assert.equal(submissionIdKey(""), null);
    assert.equal(submissionIdKey("   "), null);
    assert.equal(submissionIdKey(null), null);
    assert.equal(submissionIdKey(undefined), null);
    assert.equal(submissionIdKey({}), null);
    assert.equal(submissionIdKey({ toString: () => "xyz" }), "xyz");
    assert.equal(submissionIdKey({ toHexString: () => "ff" }), "ff");
  });
});