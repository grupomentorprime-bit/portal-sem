# Congreso Nacional de Varones 2026 — Panel operativo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Panel operativo independiente para administrar inscritos, asistencia (sáb/dom), aportes ($17.000), pagos/abonos e alojamiento del Congreso Nacional de Varones 2026 (Quilicura, 21–22 nov), sin depender de Excel durante el evento.

**Architecture:** Módulo `congress` aislado del SEM/Growth. Una inscripción (`congress_registrations`) enlaza origen formulario / importación revisada / puerta. Asistencia por día, cargo fijo y solicitud de cama cuelgan de la inscripción. Pagos se imputan al cargo (nunca se suman solos). Hogares y cupos por noche viven aparte; las notas del Excel son demanda, no camas. Formulario público intacto; no se proyecta a Growth.

**Tech Stack:** TypeScript, Next.js App Router, MongoDB, `xlsx`, `node:test` vía `tsx --test`, identidad/auditoría existentes.

**Spec / auditoría:** decisiones funcionales aprobadas 2026-11-17; canvas de diagnóstico previo.

## Global Constraints

- No modificar el formulario público `ipn-asistencia-congreso-varones-2026` ni su respuesta existente.
- No reutilizar check-in / jornada de Asuntos Estudiantiles.
- No crear oportunidades Growth ni proyectar `attendance_confirmation` a personas comerciales.
- Datos separados por `tenantId` + `eventId` (`ipn-congreso-varones-2026`).
- Aporte fijo `17000` CLP por participante identificado; sin cargo si no hay persona.
- Asistencia sábado/domingo independiente de la inscripción.
- Import Excel solo en revisión previa hasta confirmación explícita del operador.
- No crear fichas vacías ni fusionar nombres parecidos automáticamente.
- Noches de alojamiento configurables: `2026-11-20` (vie) y `2026-11-21` (sáb).
- Correcciones financieras sensibles requieren `congress.finance.correct` + auditoría.
- No commits salvo pedido explícito del usuario.

## File structure

- Create: `src/core/congress/constants.ts`
- Create: `src/core/congress/types.ts`
- Create: `src/core/congress/charges.ts` — cargo fijo / elegibilidad
- Create: `src/core/congress/payments.ts` — imputación, saldo, anti-doble
- Create: `src/core/congress/attendance.ts` — marcas sáb/dom
- Create: `src/core/congress/duplicates.ts` — claves RUT / provisional
- Create: `src/core/congress/lodging.ts` — cupos por noche
- Create: `src/core/congress/import-preview.ts` — parseo Excel → propuesta
- Create: `src/lib/congress/repository.ts`
- Create: `src/lib/congress/sync-form.ts` — enlace a submissions sin copiar
- Create: `src/lib/congress/access.ts`
- Create: `src/lib/congress/audit.ts`
- Create: `src/app/api/congress/**`
- Create: `src/app/admin/portal/congreso-varones/**`
- Create: `src/components/admin/congress/**`
- Create: `src/core/migrations/032-congress-varones-ops.ts`
- Create: `tests/baseline/congress-*.test.ts`
- Modify: `src/core/identity/permissions/catalog.ts` — módulo `congress`
- Modify: `src/core/identity/roles/codes.ts` — `congress_operator`
- Modify: `src/core/identity/permissions/role-templates.ts`
- Modify: `src/lib/admin/nav-domains.ts`, `nav-access.ts`, `institutional.ts`
- Modify: `src/core/migrations/registry.ts`
- Modify: `src/app/admin/layout.tsx` — shell acotado operador congreso

---

### Task 1: Dominio puro — cargo, pagos, asistencia, duplicados, cupos

**Files:**
- Create: `src/core/congress/constants.ts`, `types.ts`, `charges.ts`, `payments.ts`, `attendance.ts`, `duplicates.ts`, `lodging.ts`
- Create: `tests/baseline/congress-domain.test.ts`

**Interfaces:**
- Produces:
  - `CONGRESS_EVENT_ID`, `CONGRESS_FORM_ID`, `CONGRESS_CONTRIBUTION_CLP = 17000`
  - `CONGRESS_NIGHTS = ["2026-11-20","2026-11-21"]`
  - `eligibleForCharge(reg): boolean`
  - `buildChargeForRegistration(reg): CongressCharge | null`
  - `allocatePayment(input): { ok, payment, updatedBalances } | { ok:false, error }`
  - `setAttendanceDay(current, day, present): AttendanceDays`
  - `registrationDuplicateKey(reg): string | null`
  - `canAssignBed(home, night, occupied): boolean`

- [ ] **Step 1: Write failing tests** in `tests/baseline/congress-domain.test.ts` covering: cargo 17000 solo con persona; abono grupal no deja dos saldos en 0 si no alcanza; mismo peso no se imputa dos veces; asistencia sáb ≠ dom; cupo noche no se excede; sin RUT → clave provisional distinta.

- [ ] **Step 2:** `npx tsx --test tests/baseline/congress-domain.test.ts` → FAIL

- [ ] **Step 3:** Implementar módulos puros mínimos

- [ ] **Step 4:** Tests PASS

---

### Task 2: Import preview Excel (sin commit)

**Files:**
- Create: `src/core/congress/import-preview.ts`
- Create: `tests/baseline/congress-import-preview.test.ts`
- Fixture: filas sintéticas (no depender del xlsx real en CI); script opcional local contra Downloads

**Interfaces:**
- `previewCongressWorkbook(buffer): CongressImportPreview`
  - `namedPeople: 183` esperado con archivo real
  - `quantityGaps: 6` (filas sin nombre)
  - `churchLodgingRequests[]` (demanda, no asignación)
  - `autoMergeSuggestions: []` siempre vacío (nunca auto-merge)

- [ ] Tests con workbook sintético mínimo (1 zona con nombres + 1 gap + nota alojamiento)
- [ ] Implementar parser de hojas ZONA N + ALOJAMIENTOS
- [ ] No escribir Mongo en esta etapa

---

### Task 3: Permisos, rol operador, migración índices

**Files:**
- Modify catalog / role codes / templates / institutional labels
- Create migration `032-congress-varones-ops` (índices unique parciales por tenant+event+rut; colecciones)
- Nav item `/admin/portal/congreso-varones`
- `nav-access`: shell acotado para `congress_operator` (solo congreso + help/profile; sin AE, Growth, admin global)

---

### Task 4: Repositorio + sync formulario + APIs

**Files:**
- `src/lib/congress/repository.ts` — CRUD registros, pagos, hogares, audit log
- `src/lib/congress/sync-form.ts` — upsert inscripción `source=form` por `submissionId` (no duplicar respuesta)
- APIs:
  - `GET/POST /api/congress/registrations`
  - `PATCH /api/congress/registrations/[id]/attendance`
  - `POST /api/congress/registrations/door`
  - `POST /api/congress/payments`
  - `GET /api/congress/summary`
  - `POST /api/congress/import/preview` (solo preview)
  - `GET /api/congress/audit`
  - lodging homes/assignments

Reglas API: permisos, tenant del session, concurrencia de imputación (versión/saldo), auditoría `writeAudit` + `congress_audit`.

---

### Task 5: Panel operativo UI

**Route:** `/admin/portal/congreso-varones`

Tabs / secciones en una experiencia rápida:
1. Resumen
2. Inscritos (zona/iglesia, búsqueda)
3. Asistencia sáb/dom
4. Aportes y pagos
5. Alojamiento
6. Reportes/export
7. Historial
8. Importación (revisión; commit deshabilitado hasta verificación)

Reutilizar estilos admin existentes; priorizar búsqueda/filtros y acciones en lugar.

---

### Task 6: Pruebas + recorrido navegador

- Tests baseline dominio + import + payments concurrency (puro)
- Smoke: panel carga con sesión admin (browser)
- Checklist manual: no tocar submission real; no import commit

---

## Decisiones cerradas (aprobadas)

1. Cargo $17.000 fijo por participante, asista 1 o 2 días; no condicionado a alojamiento.
2. Abonos grupales: pagador + comprobante + monto + imputación exacta; saldo no imputado queda identificado.
3. Noches: viernes 20 y sábado 21 configurables.
4. «N alojamientos» = solicitud de iglesia.
5. Sin fichas vacías / sin auto-merge de nombres.
6. Puerta: RUT validado si hay; sin RUT → provisional + revisión.
7. Operador ve todas las zonas; sin AE / Growth / admin global.
