### Task 7: Verificación final

**Files:** none new (solo corridas)

- [ ] **Step 1: Suite focalizada**

Run:

```bash
npx tsx --test tests/baseline/sem-admision-funnel.test.ts tests/baseline/sem-admision-ventas-vista.test.ts tests/baseline/growth-ventas-board.test.ts tests/baseline/conversion-engine-fase-2.test.ts
```

Expected: PASS

- [ ] **Step 2: Baseline amplio si el entorno lo permite**

Run: `npm run test:baseline`  
Expected: PASS (o solo fallos preexistentes no relacionados; no introducir nuevos)

- [ ] **Step 3: Checklist manual SEM**

1. (Dev/staging) `npm run migrate -- 030-sem-admision-funnel` con autorización.
2. Embudos SEM: default **Admisión**, 6 etapas, inicial Interés.
3. `/admin/ventas` abre en **Cola**; Kanban muestra 6 columnas; Lista sigue filtrando.
4. Oportunidad legacy `open` aparece en Interés; una intermedia vieja en Contactado.
5. ADL (u otro tenant) sin cambio de copy ni etapas.

- [ ] **Step 4: Commit** solo si quedó algún ajuste de verificación; si no, no crear commit vacío.

---

## Self-review (plan vs spec)

| Spec | Task |
| --- | --- |
| Embudo 6 etapas + rename default Admisión | 1–2 |
| Migración SEM remap open/otras → interes/contactado | 3 |
| Cola default + switcher Cola·Kanban·Lista | 5 |
| Orden por atención / próxima acción | 4 |
| Copy SEM página Ventas | 6 |
| Sin segundo CRM / sin nav global / sin otros tenants | Constraints + Task 6/3 |
| Done when + tests | 7 |

Sin placeholders TBD. Tipos alineados: `GrowthVentasVista`, `mapLegacyStatusToSemAdmision`, `applySemAdmisionDefaultFunnel`, `030-sem-admision-funnel`.
