### Task 1: Test editorial Protección de datos (falla primero)

**Files:**
- Modify: `tests/baseline/cumple-pages.test.ts`

- [ ] **Step 1: Ampliar set editorial y añadir test**

En el test SST (guard de no-editoriales), cambiar el Set a:

```ts
const editorial = new Set([
  "ley-karin",
  "seguridad-salud-trabajo",
  "laboral-rrhh",
  "proteccion-datos",
]);
```

Añadir test nuevo (tras el de Laboral):

```ts
it("Protección de datos incluye el mismo patrón editorial que Ley Karin", () => {
  const datos = getMateria("proteccion-datos");
  assert.equal(datos?.titleName, "Protección de datos");
  assert.deepEqual(datos?.mark, ["DATOS"]);
  assert.equal(datos?.markTone, "ink");
  assert.ok(datos?.concepts);
  assert.equal(datos?.concepts?.items.length, 3);
  assert.ok(datos?.concepts?.items.some((item) => /datos personales/i.test(item.title)));
  assert.ok(datos?.concepts?.items.some((item) => /tratamiento/i.test(item.title)));
  assert.ok(datos?.concepts?.items.some((item) => /evidencia/i.test(item.title)));
  assert.deepEqual(
    datos?.baton?.map((item) => item.label),
    ["Datos", "Tratamiento", "Evidencia"],
  );
  assert.ok(datos?.heroAside);
  assert.equal(datos?.heroAside?.heading, "Lo esencial");
  assert.match(datos?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(datos?.heroAside?.vigencia ?? "", /19\.628/);
  assert.equal(datos?.heroAside?.duties.length, 3);
  assert.match(datos?.heroAside?.source.url ?? "", /141599/);
  assert.ok(datos?.checklist);
  assert.ok((datos?.checklist?.items.length ?? 0) >= 3);
  assert.ok(datos?.implicaPoints);
  assert.equal(datos?.implicaPoints?.items.length, 3);
  assert.ok(datos?.processSteps);
  assert.equal(datos?.processSteps?.items.length, 4);
  assert.ok(
    datos?.sources.some((s) => /141599/.test(s.url)),
    "debe citar Ley 19.628 en Ley Chile",
  );
});
```

- [ ] **Step 2: Correr tests — esperar FAIL en el nuevo test**

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

- [ ] **Step 3: No commit**

---
