### Task 1: Test editorial Inclusión (RED)

**Files:** `tests/baseline/cumple-pages.test.ts`

- [ ] **Step 1:** Añadir `"inclusion-laboral"` al Set editorial. Añadir test:

```ts
it("Inclusión laboral incluye el mismo patrón editorial que Ley Karin", () => {
  const inc = getMateria("inclusion-laboral");
  assert.equal(inc?.titleName, "Inclusión laboral");
  assert.deepEqual(inc?.mark, ["INCLUSIÓN"]);
  assert.equal(inc?.markTone, "sand");
  assert.ok(inc?.concepts);
  assert.equal(inc?.concepts?.items.length, 3);
  assert.ok(inc?.concepts?.items.some((item) => /umbral/i.test(item.title)));
  assert.ok(inc?.concepts?.items.some((item) => /cuota/i.test(item.title)));
  assert.ok(inc?.concepts?.items.some((item) => /evidencia/i.test(item.title)));
  assert.deepEqual(
    inc?.baton?.map((item) => item.label),
    ["Umbral", "Cuota", "Evidencia"],
  );
  assert.ok(inc?.heroAside);
  assert.equal(inc?.heroAside?.heading, "Lo esencial");
  assert.match(inc?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(inc?.heroAside?.vigencia ?? "", /21\.015/);
  assert.equal(inc?.heroAside?.duties.length, 3);
  assert.match(inc?.heroAside?.source.url ?? "", /1103997/);
  assert.ok(inc?.checklist);
  assert.ok((inc?.checklist?.items.length ?? 0) >= 3);
  assert.ok(inc?.implicaPoints);
  assert.equal(inc?.implicaPoints?.items.length, 3);
  assert.ok(inc?.processSteps);
  assert.equal(inc?.processSteps?.items.length, 4);
  assert.ok(inc?.sources.some((s) => /1103997/.test(s.url)));
});
```

- [ ] **Step 2:** `npx tsx --test tests/baseline/cumple-pages.test.ts` → FAIL en el nuevo test.
- [ ] **Step 3:** No commit.

---
