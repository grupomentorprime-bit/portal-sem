### Task 6: Alojamiento en dos respuestas

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx` (bloque `viewStep === "alojamiento"`)

- [ ] **Step 1: Botones antes del selector**

Si `operate` y `(registration.lodgingNeed ?? "unknown") === "unknown"`, encima del `Select` "Necesidad":

```tsx
<div className="flex flex-wrap gap-2">
  <Button
    type="button"
    disabled={busy}
    onClick={() =>
      void onPatchRegistration(registration._id, { lodgingNeed: "none" })
    }
  >
    No requiere
  </Button>
  <Button
    type="button"
    variant="outline"
    disabled={busy}
    onClick={() =>
      void onPatchRegistration(registration._id, { lodgingNeed: "requested" })
    }
  >
    Necesita cama
  </Button>
</div>
```

El `Select` y el formulario de hogar existentes se mantienen. `Necesita cama` deja `lodgingNeed` en `requested`, y el formulario de asignación que ya exige `!== "none"` aparece solo.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx`.

---

