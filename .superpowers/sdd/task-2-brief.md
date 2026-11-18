### Task 2: UI lista grupal — deshabilitar y etiquetar

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (bloque ~527–547 y ~975–1002)

**Interfaces:**
- Consumes: `isGroupPaymentSelectable`, `deriveContributionStatus`, `contributionStatusLabel` (o `contributionLabel`)
- Produces: checkboxes disabled cuando no seleccionable; monto/preview solo sobre IDs seleccionables

- [ ] **Step 1: Ampliar imports**

En `CongressOpsPanel.tsx`:

1. Desde `@/core/congress/finance-status` importar `isGroupPaymentSelectable` y `deriveContributionStatus`.
2. Desde `@/components/admin/congress/labels` añadir `contributionStatusLabel` al import existente (`formatClp`, `formatZoneLabel`, …).

- [ ] **Step 2: Filtrar selección y monto**

Tras `groupCandidates`, asegurar que `groupSelected` no contenga no-seleccionables al calcular monto/preview. Reemplazar el cálculo actual por:

```tsx
  const groupSelectableIds = useMemo(() => {
    const set = new Set(
      groupCandidates.filter(isGroupPaymentSelectable).map((r) => r._id)
    );
    return set;
  }, [groupCandidates]);

  const groupSelectedActive = useMemo(
    () => groupSelected.filter((id) => groupSelectableIds.has(id)),
    [groupSelected, groupSelectableIds]
  );

  const groupAmount = groupSelectedActive.length * CONGRESS_CONTRIBUTION_CLP;

  const groupPreview = useMemo(() => {
    if (!groupAmount || groupSelectedActive.length === 0) return [];
    return groupSelectedActive.map((id) => ({
      registrationId: id,
      amountClp: CONGRESS_CONTRIBUTION_CLP,
    }));
  }, [groupAmount, groupSelectedActive]);
```

En el display de monto total, usar `groupSelectedActive.length` (no `groupSelected.length`) para el texto `N × …`.

- [ ] **Step 3: Render de filas con disabled + etiqueta**

Reemplazar el `map` de `groupCandidates` por:

```tsx
                {groupCandidates.map((r) => {
                  const selectable = isGroupPaymentSelectable(r);
                  const checked = selectable && groupSelected.includes(r._id);
                  const roles = registrationRoleBadges(r);
                  const status = deriveContributionStatus(r);
                  return (
                    <label
                      key={r._id}
                      className={`flex items-center gap-2 text-sm ${
                        selectable ? "" : "text-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!selectable}
                        onChange={() => {
                          if (!selectable) return;
                          setGroupSelected((prev) =>
                            checked
                              ? prev.filter((id) => id !== r._id)
                              : [...prev, r._id]
                          );
                        }}
                      />
                      <span>
                        {registrationDisplayName(r)}
                        {roles.length ? (
                          <span className="text-xs text-muted">
                            {" "}
                            · {roles.join(" · ")}
                          </span>
                        ) : null}
                        {!selectable ? (
                          <span className="text-xs text-muted">
                            {" "}
                            · {contributionStatusLabel(status, r)}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
```

Mantener la nota existente de efectivo + transferencia sin cambios.

- [ ] **Step 4: Sanity check TypeScript / lint del archivo tocado**

Run: `npx tsc --noEmit -p tsconfig.json`  
(o el check que use el repo si `tsc` es pesado: al menos abrir el panel y confirmar que no hay errores de import).

Expected: sin errores nuevos en `CongressOpsPanel.tsx` / `finance-status.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/congress/CongressOpsPanel.tsx
git commit -m "feat(congreso): bloquea en pago grupal a quienes ya estánaron."
```

---

