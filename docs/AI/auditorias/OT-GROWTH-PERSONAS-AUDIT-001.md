# OT-GROWTH-PERSONAS-AUDIT-001 — Auditoría funcional y técnica — Personas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PERSONAS-AUDIT-001 |
| Tipo | Auditoría / diagnóstico (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-12 |
| Entrada | Menú Growth OS «Personas»; [ADR-010](../../architecture/ADR-010.md); [OT-GROWTH-CORE-007](../../validation/OT-GROWTH-CORE-007/README.md); [OT-GROWTH-CORE-CLOSE-001](../../validation/OT-GROWTH-CORE-CLOSE-001/README.md) |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Estado REAL de Personas antes de diseñar/implementar Personas V1 |
| Fuera de alcance | Implementación · rediseño · modificación de datos · rutas nuevas · segundo CRM · segundo motor de identidad · merge · CDP · marketing masivo |

**Restricciones cumplidas:** solo lectura y diagnóstico; sin código de producto; sin crear modelos paralelos (`crm_contacts`, `contacts`, `customers`, leads); multi-tenant documentado; sin abrir OT de implementación automáticamente.

---

## Gate final

**APTO CON AJUSTES · recomendación B**

Personas **ya existe** como superficie comercial real sobre `growth_personas` (listado + ficha en `/admin/personas`), con SSOT, upsert/dedupe, Oportunidades, Actividad y «qué hacer ahora» derivados de Oportunidad. No hace falta un segundo CRM ni un segundo motor de identidad.

La pregunta principal:

> ¿Qué existe hoy y qué falta para que Personas sea el lugar simple donde puedo encontrar y entender a las personas que se relacionan con mi negocio?

**Respuesta:** el núcleo ya responde esa pregunta. Faltan **extensiones pequeñas y acotadas** (permisos Growth propios, conversaciones en ficha sin segundo inbox, creación manual segura si el producto la exige, filtros de origen/estado Persona, refinamiento de humanización WhatsApp, paginación real). No hay brecha estructural que bloquee V1.

| Opción | Veredicto |
| --- | --- |
| **A** | Casi: listado/ficha/motores ya están |
| **B** | **Elegida** — extensión pequeña sobre lo existente |
| **C** | No — no hay hueco estructural de identidad ni de modelo |

---

## 1. Estado actual

### 1.1 Qué hay hoy

| Pieza | Estado |
| --- | --- |
| Colección SSOT | `growth_personas` (ADR-010 / CORE-002) |
| Identity resolution | `upsertGrowthPersona` — email/teléfono normalizados, tenant-scoped |
| Superficie UI | `/admin/personas` + `/admin/personas/[id]` (CORE-007 · **APTO VISUAL**) |
| Lectura | `personas-read.ts` + proyección `persona-view.ts` |
| Captación | Ingest formularios / admisión → Persona + Oportunidad + Actividad |
| WhatsApp inbound | `receiveWhatsAppCloudWebhook` → upsert Persona por teléfono + conversación |
| Distinto de | `identity_users`, `content_people` (`/admin/content/people` = Autoridades editoriales) |

### 1.2 Qué NO es Personas hoy

- No es CMS / Identity / `content_people`.
- No es pipeline de Ventas (Ventas opera Oportunidades).
- No es inbox (Mensajes es dueño de conversaciones).
- No es expediente académico (Aprende Hoy).

### 1.3 Conclusión de estado

Personas V1 **no parte de cero**. Es una superficie Growth ya cableada; la auditoría sirve para congelar qué reutilizar y qué no inventar.

---

## 2. Navegación

| Aspecto | Valor real |
| --- | --- |
| Ítem nav Growth OS | «Personas» · zona primer nivel (`nav-domains.ts`) |
| `href` | `/admin/personas` |
| Rutas App Router | `src/app/admin/personas/page.tsx`, `src/app/admin/personas/[id]/page.tsx` |
| Componentes | `PersonasListClient`, `PersonaDetailClient` |
| Auth página | Solo sesión + `tenantId` (login); **sin** `requirePermission` Growth en la page |
| Permisos del ítem nav | `cms.pages.read` **o** `experience.forms.read` **o** `experience.forms.manage` **o** `settings.team` |
| Dependencia Identity/CMS | **Solo en permisos de menú** (legado de cuando Personas se abrió con permisos CMS). Los datos son 100% `growth_*` |

**Veredicto navegación:** apunta a una **superficie comercial real** de Growth Core, no a legacy técnico. El desajuste está en **permisos del menú**, no en el destino.

Separación clara: Institución → «Autoridades» → `/admin/content/people` (`content_people`).

---

## 3. SSOT Persona (`growth_personas`)

Contrato real (`GrowthPersona` en `src/core/growth/types.ts`):

| Campo | Rol | Clasificación UI |
| --- | --- | --- |
| `_id` | Id documento | **C** técnico (usar en rutas; no como dato humano) |
| `tenantId` | Espacio | **C** — nunca mostrar |
| `status` | `active` \| `merged` \| `archived` | **B** interno / filtro; label humano si se filtra |
| `displayName` | Nombre visible | **A** |
| `firstName` / `lastName` | Partes opcionales | **A** (ficha) |
| `email` / `phone` | Primarios display | **A** · **D** sensibles (PII) |
| `emailNormalized` / `phoneNormalized` | Claves de dedupe | **C** · **D** — no UI |
| `emails[]` / `phones[]` | Alias (`value`, `normalized`, `firstSeenAt`, `lastSeenAt`) | **B/C** — no UI V1 |
| `origin` | Primer origen (inmutable) | **A** vía humanizer; campos crudos **C** |
| `origin.sourceCollection` / `sourceId` | Trazabilidad | **C** — no UI |
| `origin.formId` / `formDestination` / `campaign` / `referrer` | Metadata de origen | **B** — útiles para filtros; no crudos |
| `identityUserId` | Vínculo opcional a cuenta | **C** — no UI comercial |
| `createdAt` / `updatedAt` | Timestamps ISO | **A/B** (actividad reciente vía `updatedAt`) |

**No existen** en el modelo: tags, score, segmentIds, custom fields, `mergedIntoId`, CRM stage, lead status.

**Índices reales** (`ensureGrowthPersonaIndexes`):

| Índice | Propósito |
| --- | --- |
| `tenantId + emailNormalized` unique sparse | Dedupe email |
| `tenantId + phoneNormalized` unique sparse | Dedupe teléfono |
| `tenantId + updatedAt` desc | Listado reciente |
| `tenantId + createdAt` desc | Analítica / captación |

---

## 4. Estados

Tipo: `GrowthPersonaStatus = "active" | "merged" | "archived"` (ADR-010 § Persona).

| Estado | Significado (contrato) | Cómo se crea hoy | Quién lo cambia | Superficies |
| --- | --- | --- | --- | --- |
| `active` | Persona operativa | Único status en `upsertGrowthPersona` al insertar | Alta / match | Todas |
| `merged` | Reservado — «V1 no implementa merge» (ADR-010) | **Ningún writer de producción** | Nadie | Listados excluyen `status ≠ merged` |
| `archived` | Reservado en tipo; analítica lo excluye | **Ningún writer de producción** encontrado | Nadie | Analytics `$nin`; listado Personas **no** lo excluye hoy |

**Confirmaciones pedidas:**

| Pregunta | Evidencia |
| --- | --- |
| ¿`merged` conserva referencia a sobreviviente? | **No.** No hay campo `mergedInto` / `survivorId`. Merge fuera de V1 (ADR-010 §4.2). |
| ¿`archived` es reversible? | Sin operación de archivo → N/A. Si se implementara, habría que definirla; **no existe hoy**. |
| ¿Quién cambia estados? | Solo creación a `active`. Conflicto de identidad **no** cambia status: registra Actividad `identity_conflict`. |

**No crear estados nuevos.**

---

## 5. Identity resolution

Motor único: `upsertGrowthPersona` (+ `updateGrowthPersonaContact` para cambio posterior).

### 5.1 Reglas reales

1. Exige `tenantId` y **al menos** email o teléfono normalizable.
2. Normaliza email (`normalizeEmail`) y teléfono (Chile cuando aplica; si no, dígitos).
3. `findByEmail` / `findByPhone` **solo sobre primarios** (`emailNormalized` / `phoneNormalized`), no sobre alias arrays.
4. Match por email **o** teléfono → misma Persona (`outcome: "matched"`); completa canal faltante; `origin` **no se sobrescribe**.
5. Email y teléfono apuntan a Personas distintas → `identity_conflict` (Actividad + ids); **no fusiona**.
6. Display name / first / last: solo rellenan si el actual está vacío.

### 5.2 WhatsApp luego formulario (mismo teléfono / email)

| Escenario | Resultado |
| --- | --- |
| WA crea Persona por teléfono (`kind: unknown`, `channel: whatsapp`) | Persona A `active`, origin = primer toque WA |
| Luego formulario con el **mismo teléfono** (y/o email que se completa) | **Reutiliza** Persona A; origin **inmutable** (sigue WA); oportunidad nueva según ingest |
| Formulario primero (email), luego WA mismo email+teléfono sin conflicto | Match; completa teléfono; origin del formulario |
| Email → Persona A, teléfono → Persona B, llega contacto con ambos | **Puede no reutilizar**; conflicto; fuente se conserva; resolución manual **fuera de V1** |

**Dónde se resuelve:** Core (`upsert-persona.ts`), llamado desde ingest de captación y webhook WhatsApp. **No implementar segundo motor.**

---

## 6. Orígenes

`GrowthOriginKind` real: `admission` | `form` | `event` | `manual` | `unknown`.

| Campo origin | Uso |
| --- | --- |
| `kind` | Familia de primer toque |
| `channel` | Canal / destino (ej. `whatsapp`, `portal-admision`, destination de form) |
| `formId` / `formDestination` | Forms |
| `campaign` / `referrer` | Tracking opcional (forms / campañas) |
| `sourceCollection` / `sourceId` / `capturedAt` | Trazabilidad |

**Persona.origin = PRIMER ORIGEN** (inmutable). Oportunidad tiene **su propio** `origin` (toque de esa intención).

### 6.1 Humanizadores existentes

| Función | Qué hace |
| --- | --- |
| `growthOriginKindLabel` | Admisión / Formulario / Evento / Registro manual / Sin origen claro |
| `growthOriginArrivalLabel` | `kind` + ` · ` + channel crudo |
| `humanizeOriginDisplayLabel` | Presentación: Portal web, Contacto, destinos de forms; evita `origin.*` crudo en UI |

WhatsApp inbound persiste `kind: "unknown"` + `channel: "whatsapp"` → UI típica: **«Sin origen claro / WhatsApp»** (tras humanize). No hay kind `whatsapp`; el canal es el portador del significado.

Valores humanos deseados (WhatsApp, Formulario, Admisión, Registro manual, Sitio web, Evento, Sin origen claro) **ya están parcialmente cubiertos** por kind + humanize de channel. Refinar el caso WhatsApp es ajuste de presentación, no de modelo.

---

## 7. Relación con Oportunidades

| Aspecto | Real |
| --- | --- |
| FK | `growth_oportunidades.personaId` + `tenantId` |
| Cardinalidad | **1 Persona → 0..N Oportunidades** |
| Reuso | Misma Persona + `typeKey` + asunto + status no final → reutiliza |
| Estados Opp | `open` \| `active` \| `won` \| `lost` \| `handed_off` \| `archived` |
| `typeKey` | Defaults: `inquiry`, `registration`, `conversion` (+ config Espacio) |
| `nextAction` | **En la Oportunidad**, 0..1 vigente |
| `subject*` | Asunto (program/form/event/…) |
| `origin` | Origen de **esa** oportunidad (≠ primer origen Persona) |

**Persona ≠ Oportunidad.** La ficha actual lista oportunidades; no convierte Personas en pipeline. Ventas es la cola operativa.

Índice útil: `tenantId + personaId + status`.

---

## 8. Relación con Mensajes

| Colección | Vínculo |
| --- | --- |
| `growth_conversaciones` | `tenantId`, `personaId`, `channel`, `status`, `oportunidadId?`, `lastMessageAt` |
| `growth_mensajes` | Via `conversationId` (no lleva `personaId` directo) |

Índice: `tenantId + personaId + channel + status` en conversaciones.

**Ficha hoy:** **no** muestra conversaciones ni último mensaje. Solo link cruzado desde Mensajes → «Ver persona».

**Futura ficha (sin segundo inbox):** lectura filtrada `growth_conversaciones` por `personaId` + preview último mensaje; CTA «Abrir en Mensajes». Dueño sigue siendo Mensajes.

El feed global Actividad ya puede proyectar mensajes; la ficha Persona **aún no** reutiliza ese adapter filtrado.

---

## 9. Relación con Actividad

| Pieza | Real |
| --- | --- |
| SSOT timeline | `growth_actividades` append-only |
| Ficha Persona | Ya carga hasta 100 por `tenantId + personaId`, orden `occurredAt` desc |
| UI | Sección «Qué ha pasado»; oculta `identity_conflict` |
| Feed `/admin/actividad` | Read model global; **sin** filtro `personaId` expuesto hoy |

**Veredicto:** la ficha **ya reutiliza** proyección por `personaId`. No crear segundo timeline. Opcional: alinear prosa con `humanizeHomeActivityStory` / Actividad V1 (presentación).

Índice: `tenantId + personaId + occurredAt`.

---

## 10. Relación con Campañas

| Afirmación | ¿Soportada? |
| --- | --- |
| Persona «pertenece» permanentemente a una campaña | **No** |
| Primer origen Persona puede llevar `origin.campaign` | Sí, si llegó así en el alta |
| Cada Oportunidad puede tener `origin.campaign` distinto | Sí |
| Métrica «Personas captadas» (contratos Campañas) | `DISTINCT personaId` en oportunidades con ese `origin.campaign` |

Audiencia de campañas: filtros dinámicos sobre **Oportunidades**, no lista materializada de Personas.

En listado Personas V1 actual: **no** hay filtro por campaña/origen.

---

## 11. Handoff Aprende Hoy

Frontera (ADR-010): Growth = captación / pre-admisión; Aprende Hoy = postulación formal / admisión / matrícula / académico.

**Evidencia de traspaso (sin expediente):**

| Señal | Dónde |
| --- | --- |
| Oportunidad `status === "handed_off"` | `growth_oportunidades` |
| `handoff.interesadoId` / `delivered` / `externalId` / `adapter` | En la Oportunidad |
| Actividad `kind: "handoff"` | `growth_actividades` |
| Origen Persona `kind: "admission"` | Primer toque si llegó por admisión |

Ingest de admisión aplica handoff tras proyección si `handoff.delivered`. **No** consultar ni duplicar expediente académico en Personas. **No** modificar Aprende Hoy.

---

## 12. Capacidades de listado

Estado real: `listGrowthPersonaViews` — excluye `merged`, sort `updatedAt` desc, limit 1–200 (default 100), búsqueda regex, filtros por tipo/estado de **Oportunidad**.

| Capacidad | Veredicto |
| --- | --- |
| Búsqueda por nombre | **EXISTE** (`displayName`) |
| Búsqueda por email | **EXISTE** (`email` / `emailNormalized`) |
| Búsqueda por teléfono | **EXISTE** (`phone` / `phoneNormalized`) |
| Filtro por origen (Persona) | **REQUIERE EXTENSIÓN** (campo existe; filtro UI/read no) |
| Filtro por estado Persona | **REQUIERE EXTENSIÓN** (y writers de archive aún no) |
| Orden por actividad reciente | **EXISTE** vía `updatedAt` (proxy; no `lastActivityAt` dedicado) |
| Ver si tiene oportunidades | **EXISTE** (`opportunityCount` / summary) |
| Ver si necesita atención | **EXISTE** (`nextActionLabel` vía `pickPrimaryNextAction`) |
| Paginación cursor | **REQUIERE EXTENSIÓN** (solo `limit`) |
| Filtro «con próxima acción» | **POSIBLE CON READ MODEL** (Ventas ya tiene opciones de copy; Personas no lo cablea) |

---

## 13. Capacidades de ficha

Estructura deseada vs realidad:

| Sección | ¿Hoy? | Reutilizar |
| --- | --- | --- |
| Datos principales | **Sí** (nombre, email, phone) | Growth Core + `persona-view` |
| De dónde llegó | **Sí** (label humanizado + fecha) | `labels` + `humanize-origin-display` |
| Oportunidades | **Sí** (lista + focus `?oportunidad=`) | Core + Ventas deep-link |
| Qué hacer ahora | **Sí** (`primaryNextAction` derivado) | `pickPrimaryNextAction` — **no** campo en Persona |
| Conversaciones | **No** | Mensajes: query conversaciones por `personaId` |
| Qué ha pasado | **Sí** (`growth_actividades`) | Mismo SSOT que Actividad |

**Qué falta realmente para V1 «completa»:** bloque Conversaciones (read-only + link a Mensajes); permisos; opcional creación manual; pulir humanize WhatsApp. No falta SSOT ni motor.

---

## 14. Acciones reutilizables

| Acción deseada | ¿Existe? | Motor / recurso |
| --- | --- | --- |
| Crear oportunidad | Sí (ingest / `openGrowthOpportunity`) | Growth Core — **no** botón en ficha Personas hoy |
| Abrir oportunidad | Sí | Ficha Persona `?oportunidad=` · Ventas `/admin/ventas/[id]` |
| Guardar nota | Sí | `salesRecordFollowUp` kind `note` (API opp) |
| Registrar contacto | Sí | `salesRecordFollowUp` kind `contact` |
| Definir qué hacer ahora | Sí | `salesSetNextAction` / clear |
| Cambiar estado / handoff | Sí | `salesTransitionOpportunity` |
| Abrir conversación | Sí | Mensajes inbox + reply API |
| Archivar Persona | **No** | Sin writer |
| Merge Persona | **No** (reservado) | Sin writer |

**NO duplicar** estas acciones dentro de Personas: deep-link / reutilizar Sales Ops y Mensajes.

---

## 15. Creación manual

| Pieza | Estado |
| --- | --- |
| Servicio Core | **`upsertGrowthPersona`** — dedupe, validación, origin, tenant |
| Evento | `GrowthPersonaUpserted` (vía ingest / bus cuando se publica) |
| API admin «Crear persona» | **No existe** (`/api/growth/persona*` ausente) |
| UI botón crear | **No** |
| Actor | No hay flujo manual con `actorUserId` en upsert Persona (sí en sales-ops de opp) |

**Brecha:** falta superficie admin segura que llame al upsert existente con `origin.kind: "manual"`, actor de sesión y permiso manage. **No implementar aquí** — reutilizar el servicio cuando se abra OT.

---

## 16. Qué hacer ahora

`nextAction` **pertenece a Oportunidad**. No mover a Persona.

**Contrato conceptual ya implementado (mantener):**

```
PersonaAttention =
  pickPrimaryNextAction(oportunidades de la Persona)
  // prioridad: no finales → dueAt más cercano → setAt más reciente
```

UI: una atención primaria a nivel Persona + nextAction por oportunidad en el detalle. Si hay varias: la primaria destaca; las demás visibles en cada tarjeta de Oportunidad.

**No inventar** `persona.nextAction`.

---

## 17. Búsqueda e índices

| Necesidad | Soporte actual |
| --- | --- |
| Listado por Espacio orden reciente | `tenantId + updatedAt` |
| Dedupe / identity | unique sparse email/phone |
| Opp por Persona | `tenantId + personaId + status` |
| Actividad por Persona | `tenantId + personaId + occurredAt` |
| Conversaciones por Persona | `tenantId + personaId + channel + status` |
| Búsqueda texto nombre/email/phone | Regex en app — **sin** índice text; OK para V1 pequeño/medio |
| Filtro `origin.kind` en Personas | Sin índice dedicado en `growth_personas` |
| Cursor pagination | No |

**Índices que podrían faltar (solo documentar):**

1. Si V1 filtra mucho por `origin.kind` / `origin.channel`: `tenantId + origin.kind + updatedAt` (opcional).
2. Si se archiva de verdad: alinear listado con `status ∈ {active}` e índice `tenantId + status + updatedAt`.
3. Text search solo si escala lo exige — **no** prioritario V1.

**NO crearlos en esta OT.**

---

## 18. Permisos

| Superficie | Permiso real hoy |
| --- | --- |
| Nav Personas | CMS / Experience / settings (ver §2) |
| Página Personas | Solo sesión autenticada + tenant |
| Ventas / Mensajes / Actividad APIs | `growth.sales.read` / `growth.sales.operate` |
| Campañas / Analytics / Automations | Permisos `growth.*` propios |
| Catálogo Identity | **No** existe `growth.people.*` |

**Recomendación (no congelar aún):**

- Candidatos coherentes con el patrón: `growth.people.view` + `growth.people.manage`.
- Alternativa mínima V1: reutilizar `growth.sales.view` / `growth.sales.read` para **lectura** de Personas (misma audiencia comercial), y `growth.sales.operate` solo si Personas ejecuta mutaciones de opp — **sin** mezclar Identity (`identity.audit`, etc.).
- El menú actual con `cms.pages.read` es el desajuste más claro: un editor CMS ve Personas Growth sin ser operador comercial.

**No usar Identity como permiso comercial.**

---

## 19. Multi-tenant

| Regla | Evidencia |
| --- | --- |
| Lecturas por `tenantId` | `personas-read`, stores `findById(tenantId, id)`, list filters |
| Identity resolution scoped | `findByEmail(tenantId, …)` / `findByPhone(tenantId, …)` |
| Índices tenant-scoped | Sí (§3 / §17) |
| Relaciones `personaId` + `tenantId` | Opp, Actividad, Conversaciones |
| Tests aislamiento ADL/SEM | `growth-personas-ui.test.ts` |
| Hardcodes por tenant | No en el motor Persona |

SEM y ADL no deben mezclarse: el modelo lo impide si todas las queries llevan `tenantId` del Espacio de sesión (como hoy).

---

## 20. Privacidad — no mostrar en UI

| Dato | Motivo |
| --- | --- |
| `_id` Mongo como dato | Técnico (OK en URL opaca) |
| `tenantId` | Aislamiento |
| `emailNormalized` / `phoneNormalized` | Claves internas |
| `emails[].normalized` / `phones[].normalized` | Idem |
| `origin.sourceCollection` / `sourceId` | Trazabilidad |
| `ingestKey`, `eventId`, hashes | Infra |
| Tokens / app secrets WhatsApp | Secretos (solo server connections) |
| Payload crudo `identity_conflict` | Interno (ya oculto el kind) |
| `identityUserId` | No es dato comercial |
| Expediente Aprende Hoy | Fuera de frontera |

La UI actual ya proyecta campos humanos; mantener esa disciplina.

---

## 21. Brechas reales

| # | Brecha | Severidad V1 | Tipo |
| --- | --- | --- | --- |
| 1 | Permisos nav/page no son `growth.*` | Alta (gobernanza) | Extensión permisos |
| 2 | Ficha sin Conversaciones | Media (entendimiento) | Read adapter Mensajes |
| 3 | Sin API/UI «Crear persona» manual | Media si producto lo exige | Thin API sobre upsert |
| 4 | Filtro origen / estado Persona | Baja–media | Read model |
| 5 | Humanize WhatsApp (`unknown` + channel) | Baja (copy) | Presentación |
| 6 | `merged`/`archived` sin writers | Baja V1 | Dejar fuera / no UI |
| 7 | Paginación solo `limit` | Baja a escala | Extensión lectura |
| 8 | Alias no participan en dedupe lookup | Conocida ADR | No V1 |
| 9 | Acciones sales-ops no embebidas en ficha | OK por diseño | Deep-links |

**No es brecha:** SSOT, upsert, multi-tenant, ficha básica, timeline, nextAction derivado, relación 0..N oportunidades.

---

## 22. Propuesta Personas V1

Solo lo que los motores **soportan** hoy (más ajustes §21):

### Rutas (ya existen — no crear otras)

- `/admin/personas`
- `/admin/personas/[id]`

### Listado

- Buscar nombre / email / teléfono (**existe**)
- Filtrar por tipo/estado de oportunidad (**existe**)
- Entender quién es, de dónde llegó, oportunidades, atención (**existe**)
- **Ajuste:** permisos Growth; opcional filtro origen; paginación si hace falta

### Ficha

- Datos principales · origen · oportunidades · qué necesita atención · actividad (**existe**)
- **Ajuste:** sección Conversaciones (read-only → Mensajes)
- Acciones mutadoras: deep-link a Ventas / Mensajes (**no** reimplementar)

### Creación manual

- Solo si producto lo exige en V1: wrapper de `upsertGrowthPersona` con `origin.kind: "manual"` + permiso manage.

---

## 23. Fuera de V1

Salvo evidencia fuerte posterior:

- Segmentador avanzado / listas estáticas
- Scoring IA / tags complejos / campos personalizados
- Marketing masivo / newsletter / importador masivo
- Customer data platform
- Expediente académico
- Duplicar inbox o timeline
- Segundo CRM / `crm_contacts` / leads paralelos
- Merge automático o UI de merge
- `persona.nextAction` paralelo
- Motor UTM / attribution multi-touch

---

## 24. Archivos / motores a reutilizar

| Área | Reutilizar |
| --- | --- |
| Tipos / SSOT | `src/core/growth/types.ts` |
| Upsert / contacto | `src/core/growth/upsert-persona.ts`, `normalize.ts`, `origin.ts` |
| Persistencia | `repository.ts`, `store.ts`, `indexes.ts`, migración `013-growth-personas` |
| Ingest captación | `src/core/growth/ingest.ts` |
| WhatsApp → Persona | `src/core/growth/whatsapp/receive.ts` |
| Oportunidades | `open-opportunity.ts`, `transition-opportunity.ts`, `opportunity-repository.ts` |
| Sales Ops | `src/lib/growth/sales-ops.ts` + APIs `/api/growth/oportunidades/*` |
| Mensajes | `messaging/*`, `mensajes-read.ts` |
| Actividad | `activity.ts`, `actividad-read.ts` (ficha ya usa colección directa) |
| UI Personas | `personas-read.ts`, `persona-view.ts`, `PersonasListClient`, `PersonaDetailClient`, pages |
| Labels | `labels.ts`, `humanize-origin-display.ts` |
| ADR | `docs/architecture/ADR-010.md` |
| Validación previa | `docs/validation/OT-GROWTH-CORE-007/` |

**No reutilizar como Persona:** `identity_users`, `content_people`, `portal_interesados` (fuente de ingest, no ficha), `identity_audit`.

---

## Checklist multi-tenant (contrato V1)

| Regla | Estado |
| --- | --- |
| Toda lectura/escritura con `tenantId` del Espacio | Obligatorio · ya en Core |
| Dedupe solo dentro del Espacio | Obligatorio · ya |
| Joins Persona/Opp/Mensaje/Actividad mismo tenant | Obligatorio · ya |
| Sin Personas globales entre SEM/ADL | Obligatorio · ya |
| Permisos Growth del Espacio (no Identity) | **Ajuste pendiente** |

---

## Próximo paso recomendado (NO abrir OT)

1. Tratar Personas V1 como **endurecimiento** de CORE-007, no como módulo nuevo.
2. Congelar alcance: listado + ficha existentes + conversaciones read-only + permisos Growth + (opcional) crear manual.
3. Redactar contrato corto de implementación solo con gaps §21.
4. No abrir automáticamente OT de implementación desde esta auditoría.

---

## Veredicto

**CERRADA · APTO CON AJUSTES · B**

Personas ya es el lugar correcto para encontrar y entender a quién se relaciona con el negocio. El SSOT y la resolución de identidad están hechos. V1 se completa con una extensión pequeña (gobernanza + conversaciones en ficha + opcionales), sin segundo CRM ni segundo motor.
