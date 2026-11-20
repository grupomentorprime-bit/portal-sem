### Task 5: Alimentación pagada por el líder

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx` (bloque `viewStep === "alimentacion"`)

**Interfaces:**
- Consumes: `progress.foodLock`

- [ ] **Step 1: Reemplazar el cobro cuando el líder ya pagó**

Cuando `progress.foodLock === "leader"`, no renderizar el formulario de pago, la exención ni el abono (`canPay && operate && registration.chargeAmountClp != null`). En su lugar:

```tsx
<div className="rounded-md border border-border bg-background-soft/40 px-3 py-3" role="status">
  <p className="text-base font-extrabold">Pagado por el líder</p>
  <p className="text-sm text-muted">
    Imputado {formatClp(registration.allocatedPaidClp)}
  </p>
</div>
```

Dejar visibles la etiqueta `contributionLabel` y el historial. Con `foodLock === "exempt"` o `"paid"`, la UI de alimentación queda como está hoy (exento puede restaurar; pagado individual no ofrece otro cobro si el saldo ya es 0).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx`.

---

