# OT-GROWTH-CAMPAIGNS-003 — Implementación funcional Campañas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CAMPAIGNS-003 |
| Tipo | Implementación funcional |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-CAMPAIGNS-CONTRACT-002](./OT-GROWTH-CAMPAIGNS-CONTRACT-002.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Persistencia, APIs, bridge ingest, condición automation, audiencias, métricas, permisos, superficie mínima `/admin/campanas` |
| Fuera de alcance | Diseño visual final · Mensajes · broadcast · Meta · WhatsApp templates · Shell/Inicio/Mensajes visual · DNS/infra · segundo CRM/inbox/engine · timeline propio |

---

## Gate final

**APTO**

Campañas V1 queda operativa como capa de configuración/atribución inbound sobre Growth Core existente, sin reinterpretar el contrato congelado ni ampliar alcance.

---

## Qué se reutilizó

| Área | Patrón reutilizado |
| --- | --- |
| Persistencia | Store / memory / Mongo repository + índices idempotentes (como Automatizaciones) |
| Servicio | create / update / activate / end con errores tipados |
| APIs | `requirePermission` + rutas tenant-scoped; estado vía POST explícito (`activate` / `end`) |
| IAM | Catálogo + registry + role templates + `PORTAL_TENANT_ROLES` |
| Nav | `nav-domains.ts` con `requiredAnyPermission` |
| Admin UI | `AdminModulePage` + list/detail/form clients (mismo estilo Automatizaciones) |
| Ingest | `toGrowthFormInput` + `buildGrowthOrigin` + `projectGrowthFromSignalSafe` |
| Automatizaciones | Catálogo + evaluador existentes; una sola condición nueva |
| Actividad | Enlace a `/admin/actividad` (sin colección propia) |

---

## Archivos creados / modificados

### Creados

- `src/core/growth/campaigns/*` (types, store, memory, repository, indexes, service, audience, metrics, resolve-active, index)
- `src/lib/growth/campaigns.ts`, `campaigns-read.ts`, `campaigns-labels.ts`
- `src/app/api/growth/campaigns/route.ts`
- `src/app/api/growth/campaigns/[id]/route.ts`
- `src/app/api/growth/campaigns/[id]/activate/route.ts`
- `src/app/api/growth/campaigns/[id]/end/route.ts`
- `src/app/admin/campanas/page.tsx`, `nueva/page.tsx`, `[id]/page.tsx`, `[id]/editar/page.tsx`
- `src/components/admin/growth/CampanasListClient.tsx`, `CampanaFormClient.tsx`, `CampanaDetailClient.tsx`
- `src/core/migrations/021-growth-campaigns.ts`
- `tests/baseline/growth-campaigns-003.test.ts`
- `docs/AI/auditorias/OT-GROWTH-CAMPAIGNS-003.md`

### Modificados

- `src/lib/growth/live-ingest.ts` — bridge fail-safe campaign
- `src/core/growth/ingest-map.ts` — `campaign?` en form input
- `src/core/growth/automations/types.ts`, `catalog.ts`, `conditions.ts`
- `src/lib/growth/automations-labels.ts`, `automations-form.ts`
- `src/core/identity/permissions/{registry,catalog,role-templates}.ts`
- `src/core/identity/roles/defaults.ts`
- `src/core/migrations/registry.ts`
- `src/lib/admin/nav-domains.ts`
- `src/components/admin/preview/growth-os-master/master-nav.ts`
- `tests/baseline/growth-os-admin-shell-002.test.ts`

---

## Modelo final implementado

Colección `growth_campaigns`:

| Campo | Notas |
| --- | --- |
| `_id`, `tenantId`, `name`, `status`, `objective`, `trackingKey`, `source` | Obligatorios |
| `audience?`, `automationId?`, `startAt?`, `endAt?` | Opcionales |
| `createdBy`, `createdAt`, `updatedAt` | Auditoría |

Estados: `draft` \| `active` \| `ended`.

Transiciones: `draft→active`, `active→ended`, `draft→ended`. Sin `paused`. Sin reopen. Sin auto-end por fecha.

Índices:

- `tenantId + trackingKey` UNIQUE
- `tenantId + status`
- `tenantId + updatedAt`
- partial unique `tenantId + source.formId` cuando `status=active` y `source.kind=form`

---

## APIs

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/api/growth/campaigns` | `growth.campaigns.view` |
| POST | `/api/growth/campaigns` | `growth.campaigns.manage` |
| GET | `/api/growth/campaigns/:id` | `growth.campaigns.view` |
| PATCH | `/api/growth/campaigns/:id` | `growth.campaigns.manage` |
| POST | `/api/growth/campaigns/:id/activate` | `growth.campaigns.manage` |
| POST | `/api/growth/campaigns/:id/end` | `growth.campaigns.manage` |

Errores técnicos (`code`) + mensajes humanos en UI (`campaignHumanError`).

---

## Tracking bridge

```text
Experience Form submission
  → live ingest
  → resolveActiveFormCampaignTrackingKey(tenantId, formId)
  → si active + source.form: GrowthFormIngestInput.campaign = trackingKey
  → buildGrowthOrigin → origin.campaign
```

- Sin hidden fields, query params, UTM ni cambio de definición de formulario.
- Si no hay campaña active: ingest idéntico a hoy.
- Fallo de lookup de campaña: fail-safe (ingest continúa).

Primer origen (ADR-010):

- Persona existente: `origin` inmutable.
- Persona nueva: puede recibir `campaign`.
- Oportunidad nueva: conserva `origin.campaign` cuando el bridge atribuyó.

---

## Condición Automatizaciones

Autorizada y cableada:

```text
{ field: "origin.campaign", op: "eq", value: "<trackingKey>" }
```

Sin acciones nuevas, sin runtime de campañas, sin fan-out. `automationId` es solo vínculo.

---

## Audiencias

Filtros dinámicos AND sobre Oportunidades:

- `typeKey`, `status`, `origin.kind`, `origin.channel`, `origin.formId`, `origin.campaign`

Sin `personaIds` persistidos, sin snapshots, sin tags nuevos.

---

## Métricas

Derivadas de `growth_oportunidades` con `tenantId` + `origin.campaign = trackingKey`:

- `personasCaptadas` (DISTINCT `personaId`)
- `oportunidadesGeneradas`
- `enSeguimiento` (`status === active`)
- `ganadas` / `perdidas`

Sin contadores materializados en la campaña.

---

## Permisos

- `growth.campaigns.view` — listar, detalle, métricas
- `growth.campaigns.manage` — crear, editar, activar, terminar

Plantillas: Super Admin, Institution Admin, Support, Admissions.

Nav: `/admin/campanas` con esos permisos.

---

## Pruebas

`tests/baseline/growth-campaigns-003.test.ts` cubre A–T del brief (CRUD, unicidad trackingKey, active form, atribución draft/active/ended, primer origen, cross-tenant refs, condición automation, audiencia AND, métricas, IAM, regresiones Forms/Automations).

Verificado también:

- `growth-ingest.test.ts`
- `growth-automation-002/003/004.test.ts`
- `growth-os-admin-shell-002.test.ts`

---

## Riesgos

1. **Índice partial unique** requiere migración `021-growth-campaigns` en cada entorno.
2. **Roles existentes en Mongo** no se actualizan solos: hace falta `sync:tenant-roles` (o equivalente) para que operadores hereden `growth.campaigns.*`.
3. **UI mínima** pide IDs de formulario/automatización a mano (sin selector rico) — suficiente para operación, no es diseño final.
4. **Audiencia en detalle** evalúa sobre oportunidades del Espacio; datasets muy grandes pueden necesitar proyección Mongo más adelante (no materializado en V1).
5. **datetime-local** en formulario se guarda como string parseable; no hay auto-end por `endAt`.

---

## Confirmación explícita

No existe en esta OT:

- segundo CRM
- segundo inbox
- segundo automation engine
- broadcast / envío masivo
- `growth_campaign_activities`
- motor UTM / hidden fields / query params de campaña

---

## Veredicto

**CERRADA · APTO**

Implementación alineada al contrato congelado CONTRACT-002. No se abre otra OT automáticamente. Diseño visual final queda fuera.
