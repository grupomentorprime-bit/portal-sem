# OT-GROWTH-SMOKE-CLEANUP-001 — Limpieza controlada de residuos de pruebas

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SMOKE-CLEANUP-001 |
| Tipo | Operatividad / higiene de datos |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | Fallo preexistente `saas-adl-tenant` (`experience_forms` ADL ≠ 0); fixture `adl-smoke-info-request` (CAPTURE-SMOKE-001 / MESSAGING-005) |
| Estado | **CERRADA · APTO** |
| Alcance | Residuos confirmados de smoke/capture en Mongo (tenant `adl`) |
| Fuera de alcance | Datos productivos reales · config SEM/ADL · usuarios · pagos · cursos · foundation · domains · Keycloak · secretos · Meta · WhatsApp real · DNS · Dokploy · Cloudflare |

**Restricciones cumplidas:** no se borró por nombre genérico; cada registro tuvo `tenantId`/`tenant`, colección, timestamps, marcador de origen y confirmación de prueba; backup previo; sin tocar T001 ni usuarios.

---

## Gate final

**APTO**

El fixture `adl-smoke-info-request` y el resto de residuos confirmados de smoke/capture en `adl` fueron respaldados y eliminados. `saas-adl-tenant` pasa **10/10**. Baselines SEM (`experience_forms` = 7, `growth_personas` = 1) sin cambio. No se abrió otra OT.

---

## 1. Registros encontrados

**DB:** `SeminarioIPN` · **Tenant afectado:** `adl` (T002) · **needsReview:** 0

| Colección | Cantidad | Evidencia típica |
| --- | --- | --- |
| `experience_forms` | 1 | `_id=adl-smoke-info-request`, name «Solicitud de información (smoke captación)» |
| `experience_form_submissions` | 3 | `formId=adl-smoke-info-request`, emails `smoke.*.@example.com` |
| `growth_personas` | 5 | `smoke.form/admit/auto.*@example.com` + `origin.sourceId=capture-messaging-004a` |
| `growth_oportunidades` | 4 | ligadas a personas smoke / ids `capture-messaging-*` |
| `growth_actividades` | 14 | `personaId` → personas smoke |
| `growth_conversaciones` | 2 | ids `conv-capture-messaging-004a-*` |
| `growth_mensajes` | 5 | ids `msg-capture-messaging-004a-*` |
| `growth_whatsapp_connections` | 1 | `captureTag=capture-messaging-005`, `phoneNumberId=capture-pn-adl-incomplete` |
| `identity_sessions` | 6 | `_id` `sess-capture-smoke-*` / `sess-capture-messaging-*` |
| `portal_interesados` | 1 | `programId=smoke-program-capture-001` |
| `core_events` | 14 | `payload.formId` / email smoke |
| `core_scheduled_events` | 3 | payload ligado a smoke |
| **Total** | **59** | todos `confirmedTest=true` |

Artefacto: [`inventory-before.json`](./OT-GROWTH-SMOKE-CLEANUP-001/inventory-before.json)

### Caso conocido (detalle)

| Campo | Valor |
| --- | --- |
| `_id` | `adl-smoke-info-request` |
| `tenant` | `adl` |
| `createdAt` / `updatedAt` | `2026-09-07T18:17:21.959Z` |
| Origen | `scripts/smoke-growth-capture-001.ts` (`FORM_ID`, `ensureSmokeForm`) |
| Destino | `information_request` · `active/visible=true` |
| Impacto | hacía fallar `assert.equal(formsAdl, 0)` en `saas-adl-tenant` |

---

## 2. Evidencia de que eran de prueba

1. **Script fuente explícito:** `smoke-growth-capture-001.ts` crea el form con name «(smoke captación)» y emails `smoke.form.|admit.|auto.${stamp}@example.com`.
2. **Capture tags:** `capture-messaging-005` / `004a` / `004` en `captureTag`, `origin.sourceId`, `phoneNumberId=capture-pn-*`, ids `persona-/conv-/msg-capture-messaging-*`.
3. **Sesiones efímeras:** prefijos `sess-capture-smoke-` / `sess-capture-messaging-` (scripts de captura Playwright; no son sesiones de usuario productivo).
4. **WhatsApp:** número ficticio `+56 9 2222 0000`, `phoneNumberId=capture-pn-adl-incomplete`, `captureTag` — no es conexión Meta real.
5. **Admisión smoke:** `programId=smoke-program-capture-001`, nombre `Smoke Admision…`.
6. **Documentación OT:** [`docs/validation/OT-GROWTH-CAPTURE-SMOKE-001/README.md`](../../validation/OT-GROWTH-CAPTURE-SMOKE-001/README.md) declara el form como dato de prueba del Espacio.

**No eliminado:** usuarios (`identity_users`), membresías, roles, foundation ADL/SEM, forms SEM (7), persona SEM (1), persona ADL restante no-smoke (1), automatizaciones reales, config real.

---

## 3. Backup generado

| Archivo | Contenido |
| --- | --- |
| [`backup-before-delete-2026-09-11T21-14-55-498Z.json`](./OT-GROWTH-SMOKE-CLEANUP-001/backup-before-delete-2026-09-11T21-14-55-498Z.json) | 41 docs (ids string resueltos en primer pase) |
| [`backup-remate-2026-09-11T21-16-16-089Z.json`](./OT-GROWTH-SMOKE-CLEANUP-001/backup-remate-2026-09-11T21-16-16-089Z.json) | 18 docs restantes (`ObjectId`: submissions, interesado, `core_events`) |
| **Total respaldado** | **59/59** |

Nota técnica: el primer `deleteMany` falló en colecciones con `_id` ObjectId tras serializar el inventario a JSON; se remató con resolución string|ObjectId y backup adicional. El script principal quedó corregido para ese caso.

---

## 4. Registros eliminados

| Colección | Eliminados |
| --- | --- |
| `experience_forms` | 1 |
| `experience_form_submissions` | 3 |
| `growth_personas` | 5 |
| `growth_oportunidades` | 4 |
| `growth_actividades` | 14 |
| `growth_conversaciones` | 2 |
| `growth_mensajes` | 5 |
| `growth_whatsapp_connections` | 1 |
| `identity_sessions` | 6 |
| `portal_interesados` | 1 |
| `core_events` | 14 |
| `core_scheduled_events` | 3 |
| **Total** | **59** |

Reportes: [`deletion-report.json`](./OT-GROWTH-SMOKE-CLEANUP-001/deletion-report.json), [`deletion-remate-report.json`](./OT-GROWTH-SMOKE-CLEANUP-001/deletion-remate-report.json).

---

## 5. Referencias revisadas

| Relación | Resultado |
| --- | --- |
| `experience_forms` ← `adl-smoke-info-request` | Ausente tras delete |
| Submissions `formId` smoke | 0 |
| Personas `smoke.*` / `origin.sourceId` capture | 0 |
| Opps/acts huérfanas de personas borradas | 0 |
| Convs/msgs `capture-messaging-*` | 0 |
| WA `captureTag=capture-messaging-005` | 0 |
| Sesiones `sess-capture-*` | 0 |
| `portal_interesados` smoke-program | 0 |
| `core_events` / `core_scheduled_events` payload smoke | 0 |
| Usuarios / membresías referenciados por sesiones | **intactos** (solo se borraron sesiones) |
| Forms / personas SEM | **sin cambio** |

Post-check: [`inventory-after.json`](./OT-GROWTH-SMOKE-CLEANUP-001/inventory-after.json)

---

## 6. Pruebas antes / después

### Antes

| Suite | Resultado |
| --- | --- |
| `tests/baseline/saas-adl-tenant.test.ts` | **9/10** — FAIL `aislamiento… experience_forms` → `1 !== 0` |

### Después

| Suite | Resultado |
| --- | --- |
| `saas-adl-tenant` | **10/10 pass** (incluye aislamiento forms ADL = 0) |
| `saas-sem-content` + foundation helpers | **10/10 pass** |
| Baselines SEM `experience_forms` / `growth_personas` | 7 / 1 (igual que antes) |
| Baseline ADL `experience_forms` | 1 → **0** |
| Baseline ADL `growth_personas` | 6 → **1** (queda la no-smoke) |
| WA connections ADL | 1 (capture) → **0** |

---

## 7. Resultado final

| Pregunta | Respuesta |
| --- | --- |
| ¿Fixture `adl-smoke-info-request` eliminado? | **Sí** |
| ¿Residuos capture-messaging confirmados eliminados? | **Sí** |
| ¿Backup completo? | **Sí** (59 docs en 2 archivos) |
| ¿Datos reales / SEM / usuarios tocados? | **No** |
| ¿Regresión ADL afectada verde? | **Sí** (10/10) |
| ¿SEM / Growth OS baselines estables? | **Sí** |
| ¿Abrir otra OT automáticamente? | **No.** |

Herramienta operativa (reutilizable): `scripts/ot-growth-smoke-cleanup-001.ts` (`inventory [outfile]` \| `delete`).

---

## Validaciones (checklist OT)

| Momento | Criterio | Estado |
| --- | --- | --- |
| Antes | Listar exactamente qué se elimina + cantidad + tenant + evidencia | **OK** |
| Después | Fixture ausente | **OK** |
| Después | Sin referencias huérfanas de lo borrado | **OK** |
| Después | Regresiones ADL afectadas | **OK** |
| Después | SEM / Growth OS sin cambio de baseline | **OK** |

---

## Acta / veredicto

Limpieza controlada completada sobre **59** residuos confirmados de smoke/capture en tenant **`adl`**. El fallo preexistente de aislamiento ADL por `experience_forms` residual queda resuelto. Alcance respetado; sin tocar infra externa ni datos productivos SEM.

**GATE: APTO**
