# Pago grupal Zona → Iglesia Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En pago grupal, filtrar iglesias por zona obligatoria para búsqueda más rápida.

**Architecture:** Estado local `groupZone` en `CongressOpsPanel`; opciones de iglesia derivadas de `churchesByZone` + registros; candidatos filtrados por `zoneId` y `churchName`. Sin cambios de API.

**Tech Stack:** React client component, `Select` UI existente, `CONGRESS_ZONES` / `formatZoneLabel`.

## Global Constraints

- Zona obligatoria antes de iglesia (opción A del spec).
- Reutilizar datos ya cargados (`zoneOptions`, `churchesByZone`, `registrations`).
- No cambiar el payload del POST de pago grupal.

---

### Task 1: UI + filtro en `CongressOpsPanel`

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx`

- [x] Step 1: Añadir estado `groupZone`.
- [x] Step 2: `useMemo` de iglesias de la zona y de `groupCandidates` con `zoneId` + `churchName`.
- [x] Step 3: Insertar Select Zona encima de Iglesia; deshabilitar Iglesia sin zona; limpiar al cambiar zona.
- [ ] Step 4: Verificar en UI (dev server) flujo zona → iglesia → personas.
