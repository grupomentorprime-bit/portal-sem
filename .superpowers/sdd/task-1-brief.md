### Task 1: Dominio — reclamable + búsqueda (directa + fuzzy)

**Files:**
- Create: `src/core/congress/claim.ts`
- Create: `tests/baseline/congress-nomina-claim.test.ts`

**Interfaces:**
- Produces:
  - `isCongressRegistrationClaimable(reg): boolean`
  - `toPublicCongressRosterHit(reg): { registrationId; fullName; churchName; zoneId }`
  - `searchClaimableCongressRegistrations(regs, query, limit?): { matches; suggestions; hasMore; suggestionsHasMore }`

- [ ] **Step 1: Test fallido — claimable y búsqueda**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCongressRegistrationClaimable,
  searchClaimableCongressRegistrations,
} from "../../src/core/congress/claim";
import type { CongressRegistration } from "../../src/core/congress/types";

function stub(
  partial: Partial<CongressRegistration> & { _id: string; fullName: string }
): CongressRegistration {
  const { fullName, identity, ...rest } = partial;
  return {
    tenantId: "t1",
    eventId: "ipn-congreso-varones-2026",
    source: "import",
    submissionId: null,
    importRowId: null,
    zoneId: "zona-1",
    churchName: "Quilicura",
    expectedDays: { saturday: true, sunday: true },
    lodgingNeed: "unknown",
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: 17000,
    allocatedPaidClp: 0,
    needsReview: true,
    version: 1,
    createdAt: "2026-11-17T00:00:00.000Z",
    updatedAt: "2026-11-17T00:00:00.000Z",
    ...rest,
    _id: partial._id,
    identity: {
      fullName,
      rut: identity?.rut ?? null,
      email: identity?.email ?? null,
      phone: identity?.phone ?? null,
      status: identity?.status ?? "provisional",
    },
  };
}

describe("congress nomina claim search", () => {
  it("solo stubs import sin submissionId son reclamables", () => {
    assert.equal(
      isCongressRegistrationClaimable(
        stub({ _id: "a", fullName: "Hno David Orellana", source: "import", submissionId: null })
      ),
      true
    );
    assert.equal(
      isCongressRegistrationClaimable(
        stub({
          _id: "b",
          fullName: "Hno David Orellana",
          source: "import",
          submissionId: "sub1",
        })
      ),
      false
    );
    assert.equal(
      isCongressRegistrationClaimable(
        stub({ _id: "c", fullName: "Nuevo", source: "form", submissionId: null })
      ),
      false
    );
  });

  it("match directo ignora tildes y sugiere con typo", () => {
    const regs = [
      stub({ _id: "1", fullName: "Hno Patricio Ravello", churchName: "Quilicura", zoneId: "zona-1" }),
      stub({ _id: "2", fullName: "Hno Pedro González", churchName: "Quilicura", zoneId: "zona-1" }),
    ];
    const accent = searchClaimableCongressRegistrations(regs, "patricio ravello");
    assert.equal(accent.matches.length, 1);
    assert.equal(accent.matches[0]._id, "1");

    const typo = searchClaimableCongressRegistrations(regs, "patricio ravelo");
    const hitIds = [...typo.matches, ...typo.suggestions].map((r) => r._id);
    assert.ok(hitIds.includes("1"));
  });
});
```

- [ ] **Step 2: Correr test (debe fallar)**

Run: `npx tsx --test tests/baseline/congress-nomina-claim.test.ts`  
Expected: FAIL (módulo / exports ausentes)

- [ ] **Step 3: Implementar `claim.ts`**

```ts
import {
  collectPersonSearchSuggestions,
  matchesPersonSearch,
} from "@/lib/experience/forms/person-search";
import type { CongressRegistration } from "@/core/congress/types";

export function isCongressRegistrationClaimable(reg: CongressRegistration): boolean {
  return reg.source === "import" && !reg.submissionId;
}

export function toPublicCongressRosterHit(reg: CongressRegistration) {
  return {
    registrationId: reg._id,
    fullName: reg.identity.fullName,
    churchName: reg.churchName,
    zoneId: reg.zoneId,
  };
}

export function searchClaimableCongressRegistrations(
  registrations: CongressRegistration[],
  query: string,
  limit = 40
) {
  const claimable = registrations.filter(isCongressRegistrationClaimable);
  const fields = (r: CongressRegistration) => [r.identity.fullName, r.churchName];
  const matches = claimable.filter((r) => matchesPersonSearch(query, fields(r)));
  const matchIds = new Set(matches.map((r) => r._id));
  const suggestions = collectPersonSearchSuggestions(
    query,
    claimable.filter((r) => !matchIds.has(r._id)),
    fields,
    8
  );
  return {
    matches: matches.slice(0, limit),
    suggestions: suggestions.items,
    hasMore: matches.length > limit,
    suggestionsHasMore: suggestions.hasMore,
  };
}
```

- [ ] **Step 4: Correr test (debe pasar)**

Run: `npx tsx --test tests/baseline/congress-nomina-claim.test.ts`  
Expected: PASS

- [ ] **Step 5: Sin git commit** — marcar task hecha.

---

