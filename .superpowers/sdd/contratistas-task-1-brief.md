### Task 1: Test editorial Contratistas (RED)

**Files:** `tests/baseline/cumple-pages.test.ts`

- [ ] Añadir `"contratistas-terceros"` al Set editorial.
- [ ] Añadir test:

```ts
it("Contratistas y terceros incluye el mismo patrón editorial que Ley Karin", () => {
  const c = getMateria("contratistas-terceros");
  assert.equal(c?.titleName, "Contratistas y terceros");
  assert.deepEqual(c?.mark, ["TERCEROS"]);
  assert.equal(c?.markTone, "hot");
  assert.ok(c?.concepts);
  assert.equal(c?.concepts?.items.length, 3);
  assert.ok(c?.concepts?.items.some((item) => /empresa principal/i.test(item.title)));
  assert.ok(c?.concepts?.items.some((item) => /faena/i.test(item.title)));
  assert.ok(c?.concepts?.items.some((item) => /documentos|control/i.test(item.title)));
  assert.deepEqual(
    c?.baton?.map((item) => item.label),
    ["Empresa principal", "Faena", "Control"],
  );
  assert.ok(c?.heroAside);
  assert.equal(c?.heroAside?.heading, "Lo esencial");
  assert.match(c?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(c?.heroAside?.vigencia ?? "", /20\.123/);
  assert.equal(c?.heroAside?.duties.length, 3);
  assert.match(c?.heroAside?.source.url ?? "", /254080/);
  assert.ok(c?.checklist);
  assert.ok((c?.checklist?.items.length ?? 0) >= 3);
  assert.ok(c?.implicaPoints);
  assert.equal(c?.implicaPoints?.items.length, 3);
  assert.ok(c?.processSteps);
  assert.equal(c?.processSteps?.items.length, 4);
  assert.ok(c?.sources.some((s) => /254080/.test(s.url)));
  assert.ok(c?.sources.some((s) => /28650/.test(s.url)));
});
```

- [ ] Run tests → FAIL on new test. No commit.

---
