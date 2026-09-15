# OT-GROWTH-PERSONAS-IMPLEMENT-003 — Implementación funcional Personas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PERSONAS-IMPLEMENT-003 |
| Tipo | Implementación funcional (endurecimiento CORE-007) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-12 |
| Entrada | [OT-GROWTH-PERSONAS-CONTRACT-002](./OT-GROWTH-PERSONAS-CONTRACT-002.md) · [OT-GROWTH-PERSONAS-AUDIT-001](./OT-GROWTH-PERSONAS-AUDIT-001.md) |
| Estado | **CERRADA · APTO** |
| Alcance | A+B+C+D del contrato: permisos, filtro origen, humanización, conversaciones read-only, crear vía `upsertGrowthPersona`, CTAs fail-safe |
| Fuera de alcance | Diseño visual final (AGENTE 1) · merge/archive · cursor pagination · índices nuevos · segundo CRM/inbox/timeline · `persona.nextAction` · abrir OT UX |

**Restricciones cumplidas:** sin reabrir producto; sin `insertOne` admin; sin nuevos kinds; multi-tenant en lecturas/escrituras; sin índices preventivos; sin rutas Personas nuevas.

---

## Gate final

**APTO**

Personas V1 queda operativa como endurecimiento de CORE-007 sobre `growth_personas` + proyecciones existentes. Bloques **A+B+C+D** funcionales. Esta OT **no** cierra Personas V1 de producto: sigue pendiente la pasada visual del AGENTE 1.

---

## 1. Qué se encontró antes de tocar

| Hallazgo | Evidencia |
| --- | --- |
| Listado/ficha `/admin/personas*` ya existían (CORE-007) | `page.tsx`, `PersonasListClient`, `PersonaDetailClient` |
| Sin permisos `growth.people.*`; nav usaba `cms.pages.*` / forms / `settings.team` | `nav-domains.ts` |
| Sin filtro de origen; solo tipo/estado de Oportunidad | `personas-read.ts` |
| Humanizer mostraba «Sin origen claro / Whatsapp» para WhatsApp inbound | `humanize-origin-display.ts` + origen `unknown`+`whatsapp` |
| Ficha sin proyección de conversaciones | `PersonaDetailClient` |
| Sin crear Persona admin / sin API | — |
| Motor único de identidad ya existente | `upsertGrowthPersona` |
| CTAs cruzados no condicionados por permisos de Ventas/Mensajes | ficha |

---

## 2. Archivos creados / modificados

### Creado

| Archivo | Rol |
| --- | --- |
| `src/app/api/growth/personas/route.ts` | `POST` Crear Persona (`growth.people.manage`) |
| `src/lib/growth/personas-create.ts` | Wrapper admin → `upsertGrowthPersona` |
| `src/lib/growth/personas-origin-filter.ts` | Criterio Mongo filtro origen V1 (puro) |
| `tests/baseline/growth-personas-003.test.ts` | Casos A–AF |
| `docs/AI/auditorias/OT-GROWTH-PERSONAS-IMPLEMENT-003.md` | Esta acta |
| `docs/AI/auditorias/OT-GROWTH-PERSONAS-IMPLEMENT-003-evidence/` | Evidencia tests |

### Modificado

| Archivo | Cambio |
| --- | --- |
| `src/core/identity/permissions/registry.ts` | `growth.people.view` / `manage` |
| `src/core/identity/permissions/catalog.ts` | Catálogo Growth People |
| `src/core/identity/permissions/role-templates.ts` | INSTITUTION_ADMIN / SUPPORT / ADMISSIONS |
| `src/core/identity/roles/defaults.ts` | Mismos roles + SUPER_ADMIN |
| `src/lib/admin/nav-domains.ts` | Nav Personas → `growth.people.*` |
| `src/app/admin/personas/page.tsx` | Guard + filtro origen + `canManage` |
| `src/app/admin/personas/[id]/page.tsx` | Guard + CTAs fail-safe flags |
| `src/lib/growth/personas-read.ts` | Filtro origen + conversaciones read-only |
| `src/lib/growth/persona-view.ts` | `conversations` en detalle |
| `src/lib/growth/humanize-origin-display.ts` | Prioridad canal humano (WhatsApp) |
| `src/lib/growth/labels.ts` | Copy crear / origen / conversaciones / CTAs |
| `src/lib/growth/index.ts` | Reexports |
| `src/components/admin/growth/PersonasListClient.tsx` | Filtro origen + modal Crear |
| `src/components/admin/growth/PersonaDetailClient.tsx` | Conversaciones + CTAs condicionados |

### No tocado (motores congelados)

Core `upsertGrowthPersona` · enums `GrowthOriginKind` · índices Mongo · Ventas write · Mensajes composer · Actividad schema · Campañas / Analítica / Automatizaciones · Aprende Hoy · merge/archive.

---

## 3. Permisos

| Código | Roles por defecto |
| --- | --- |
| `growth.people.view` | SUPER_ADMIN, INSTITUTION_ADMIN, SUPPORT, ADMISSIONS |
| `growth.people.manage` | Mismos (manage implica view en plantillas) |

- Nav y pages: `growth.people.view` **o** `manage`.
- Crear: solo `manage`.
- Roles no comerciales: sin People por defecto.
- Retirada dependencia Personas de `cms.pages.*` / `experience.forms.*` / `settings.team` / `identity.*`.

---

## 4. Listado / filtros

Read-model existente `listGrowthPersonaViews` extendido (no duplicado).

Filtro `?origin=` (un token a la vez + filtros Opp existentes):

| Token UI | Criterio |
| --- | --- |
| (vacío) | Todos |
| `whatsapp` | `origin.channel = whatsapp` |
| `form` | `origin.kind = form` |
| `admission` | `origin.kind = admission` |
| `manual` | `origin.kind = manual` |
| `event` | `origin.kind = event` |
| `portal-web` | `origin.channel = portal-admision` |
| `unclear` | `kind = unknown` y channel **∉** `{whatsapp, portal-admision}` |

Siempre `tenantId` del Espacio activo. Sin filtrar por campaign/formId/sourceCollection.

**Paginación V1:** `limit` 1–200 (default 100). Sin cursor. Si se alcanza el límite, UI muestra nota: no afirma ser el total completo.

---

## 5. Humanización

`humanizeOriginDisplayLabel`:

- `Sin origen claro · whatsapp` → **WhatsApp** (no antepone «Sin origen claro»).
- `Sin origen claro · portal-admision` → **Portal web**.
- Persistido `Persona.origin` y enums **sin cambios**.

---

## 6. Conversaciones

Proyección READ-ONLY en ficha: `listPersonaConversationViews(tenantId, personaId)`.

Muestra: canal humanizado, estado útil, `lastMessageAt`/hora, preview corto.

CTA «Abrir en Mensajes» → `/admin/mensajes?c=` **solo** si el usuario puede abrir Mensajes (`growth.sales.view|read|operate`).

Sin composer, sin inbox nuevo, sin segunda colección.

---

## 7. Crear Persona

`POST /api/growth/personas` → `createGrowthPersonaAdmin` → **`upsertGrowthPersona`**.

| Campo | Regla |
| --- | --- |
| Nombre | Obligatorio (capa admin) |
| Email / Teléfono | Al menos uno normalizable (regla Core) |
| Origen | `kind: "manual"`, `sourceCollection: "admin_personas"` |
| Tenant | Espacio activo de sesión |
| Actor | `actorUserId` en `sourceId` |

UI: modal «Crear persona» en listado (solo `manage`). Sin ruta `/admin/personas/nueva`.

---

## 8. Dedupe

| Resultado Core | UX |
| --- | --- |
| `created` | «Persona creada.» → abrir ficha |
| `matched` | «Esta persona ya estaba registrada.» → abrir existente |
| `identity_conflict` | «Encontramos datos que podrían pertenecer a personas distintas.» — sin merge, sin IDs |
| `missing_identity` | «Necesitamos un correo o un teléfono válido.» |

---

## 9. Acceso cruzado

| Capacidad | Permiso |
| --- | --- |
| Resumen Opp / conversaciones / actividad en ficha | `growth.people.view` |
| CTA Abrir en Ventas | sales view/read/operate |
| CTA Abrir en Mensajes | igual que Mensajes |
| CTA Ver actividad (feed global) | sales read/operate |

Nunca CTA que termine previsiblemente en 403.

---

## 10. Multi-tenant

Toda lectura/escritura usa `tenantId` del Espacio activo.

Validado en tests: create/dedupe SEM ≠ ADL; ficha de otro Espacio → misma UI que inexistente.

---

## 11. Privacidad

UI no expone: `tenantId`, normalizados, `sourceCollection`/`sourceId`, `identityUserId`, hashes, payload `identity_conflict`, Mongo IDs como contenido.

---

## 12. Estados

Cubiertos funcionalmente: vacío verdadero (+ CTA crear si manage), sin coincidencias, sin Opp, sin conversaciones, sin actividad, sin próxima acción (`GROWTH_NO_NEXT_ACTION_LABEL`), no encontrada (otro Espacio indistinguible), error crear humano.

---

## 13. Pruebas

| Suite | Resultado |
| --- | --- |
| `growth-personas-003.test.ts` (A–AF) | PASS |
| `growth-personas-ui.test.ts` / `growth-personas.test.ts` | PASS |
| `growth-messaging-004`, `growth-activity-001`, `growth-sales-001`, `growth-sales-001a`, `growth-os-admin-shell-002a`, `growth-os-admin-master` | PASS |

---

## 14. Typecheck / build

`tsc --noEmit`: **sin errores en archivos de esta OT**.

Errores globales preexistentes (baseline ajeno, no corregidos):

- `actividad-view.ts` — `ActivityFeedSourceProps` / `MessageFeedSourceProps`
- `growth-campaigns-003.test.ts` — `createdAt` en fixture
- `platform-host-isolation.test.ts` — tipado `ObjectId`

---

## 15. Evidencia

Carpeta: `docs/AI/auditorias/OT-GROWTH-PERSONAS-IMPLEMENT-003-evidence/`

- `RESULT.json` — veredicto y matriz de pruebas
- `test-personas-003.txt` — salida focalizada

Sin datos productivos inventados; fixtures memory store + aserciones de fuente.

---

## 16. Cambios deliberadamente NO realizados

- Merge / archive / restore / `mergedInto`
- Tags, scoring, listas, segmentador, custom fields, importador
- Mini inbox / segundo timeline / segundo CRM
- `persona.nextAction`
- Cursor pagination
- Índices nuevos
- Rutas `/admin/contactos|leads|personas/nueva`
- Cambios a permisos Ventas/Mensajes/Actividad
- Rediseño visual general (AGENTE 1)

---

## 17. Riesgos / pendientes reales

| Ítem | Nota |
| --- | --- |
| Pasada visual AGENTE 1 | Listado, ficha, modal crear, empty states |
| Roles ya sincronizados en BD | Plantillas actualizadas en código; tenants existentes pueden requerir `sync:tenant-roles` para heredar People |
| Volumen >100 Personas | Limit note visible; cursor queda fuera de V1 |
| Filtro origen sin índice | Aceptable por contrato hasta evidencia medible |

---

## 18. Veredicto

**APTO**

A+B+C+D del contrato quedan funcionales. Personas V1 **no** se declara cerrada de producto hasta validación/refinamiento visual (AGENTE 1). **No** se abre automáticamente la OT UX.
