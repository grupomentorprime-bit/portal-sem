### Task 1: Test editorial Laboral (falla primero)

**Files:**
- Modify: `tests/baseline/cumple-pages.test.ts`
- Test: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `getMateria`, `materias` from `src/sites/cumple/pages/materias.ts`
- Produces: assertion contract for laboral editorial fields

- [ ] **Step 1: Actualizar el set editorial en el test de SST y añadir test de laboral**

En el test `"SST / DS 44 incluye el mismo patrón editorial que Ley Karin"`, cambiar:

```ts
const editorial = new Set(["ley-karin", "seguridad-salud-trabajo"]);
```

por:

```ts
const editorial = new Set(["ley-karin", "seguridad-salud-trabajo", "laboral-rrhh"]);
```

Añadir un test nuevo inmediatamente después:

```ts
it("Laboral y RR.HH. incluye el mismo patrón editorial que Ley Karin", () => {
  const lab = getMateria("laboral-rrhh");
  assert.equal(lab?.titleName, "Laboral y RR.HH.");
  assert.deepEqual(lab?.mark, ["RR.HH."]);
  assert.equal(lab?.markTone, "hot");
  assert.ok(lab?.concepts);
  assert.equal(lab?.concepts?.items.length, 3);
  assert.ok(lab?.concepts?.items.some((item) => /reglamento/i.test(item.title)));
  assert.ok(lab?.concepts?.items.some((item) => /jornada/i.test(item.title)));
  assert.ok(lab?.concepts?.items.some((item) => /evidencia/i.test(item.title)));
  assert.deepEqual(
    lab?.baton?.map((item) => item.label),
    ["Reglamento", "Jornada", "Evidencia"],
  );
  assert.ok(lab?.heroAside);
  assert.equal(lab?.heroAside?.heading, "Lo esencial");
  assert.match(lab?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(lab?.heroAside?.vigencia ?? "", /Código del Trabajo|21\.561/i);
  assert.equal(lab?.heroAside?.duties.length, 3);
  assert.match(lab?.heroAside?.source.url ?? "", /207436/);
  assert.ok(lab?.checklist);
  assert.ok((lab?.checklist?.items.length ?? 0) >= 3);
  assert.ok(lab?.implicaPoints);
  assert.equal(lab?.implicaPoints?.items.length, 3);
  assert.ok(lab?.processSteps);
  assert.equal(lab?.processSteps?.items.length, 4);
  assert.ok(
    lab?.sources.some((s) => /207436/.test(s.url)),
    "debe citar Código del Trabajo en Ley Chile",
  );
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run:

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

Expected: FAIL en `"Laboral y RR.HH. incluye el mismo patrón editorial..."` (falta `concepts` / `baton` / etc.).

- [ ] **Step 3: Commit del test (opcional si el usuario pide commits; si no, dejar staged mentalmente y seguir)**

Solo si el usuario pidió commit explícito:

```bash
git add tests/baseline/cumple-pages.test.ts
git commit -m "$(cat <<'EOF'
test: require editorial pattern for Laboral y RR.HH.

EOF
)"
```

---
