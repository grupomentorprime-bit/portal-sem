### Task 3: Verificación manual (navegador)

**Files:** ninguna (solo checklist)

- [ ] **Step 1: Arrancar o usar el panel**

Abrir `/admin/portal/congreso-varones` → pestaña **Aportes y pagos** → **Pago grupal**.

- [ ] **Step 2: Casos de la spec**

1. Zona/iglesia con varios pendientes: marcar 3, guardar → un ingreso; esos 3 muestran **Pagado** y checkbox disabled.
2. Segundo ingreso con los que faltan → OK; monto `N × $17.000 = $…` en negrita.
3. Pagar uno desde ficha individual → en grupal aparece **Pagado**, no seleccionable.
4. Confirmar que la nota de efectivo/transferencia sigue visible.
5. Confirmar que no hay campo de monto editable por persona.

- [ ] **Step 3: Re-run unit tests**

Run: `npm run test:baseline -- tests/baseline/congress-reception-labels.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit vacío no requerido** — si hubo ajustes menores de copy/UI tras la prueba, commitearlos:

```bash
git add -p
git commit -m "fix(congreso): ajustes UI pago grupal tras verificación."
```

Si no hubo cambios, no crear commit vacío.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Solo monto completo $17.000 | Task 2 (preview/amount) |
| Varios ingresos grupales en el tiempo | Ya soportado; UI no bloquea segundos POSTs (Task 2+3) |
| Pagado visible + disabled + etiqueta | Task 2 |
| Individual o grupal → mismo tratamiento | `paid` vía `deriveContributionStatus` (Task 1+2) |
| Efectivo + transferencia = dos registros | Nota UI existente; Task 3 confirma |
| Sin cambio API | Ninguna task toca API |
| `partial` / verification / no_charge no seleccionables | Task 1 predicado + Task 2 |
| Monto `N × unit = total` negrita | Ya en panel; Task 2 usa `groupSelectedActive` |
