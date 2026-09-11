# OT-GROWTH-AUTOMATION-002 — Persistencia versionada + IAM Automatizaciones

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-002 |
| Tipo | Implementación (persistencia + IAM) |
| Fecha | 2026-09-06 |
| Estado | **CERRADA · APTO TÉCNICO** |
| ADR | [ADR-011](../../architecture/ADR-011.md) |
| Entrada | [AUTOMATION-001](../OT-GROWTH-AUTOMATION-001/README.md) · [SALES-001](../OT-GROWTH-SALES-001/README.md) |
| Criterio | Guardar/versionar/publicar Automatización V1 por Espacio; aislamiento `tenantId`; permisos; sin ejecución |

---

## Objetivo

Persistir definiciones versionadas de Automatización por Espacio según el contrato ADR-011, con IAM `growth.automations.view` / `growth.automations.manage`, **sin** subscriber, runner, WAIT habilitado ni editor.

## Qué reutilizó

| Pieza | Origen |
| --- | --- |
| Catálogo eventos `Growth*` | `GROWTH_DOMAIN_EVENT_TYPES` (event-bus-port) |
| Acciones contractuales | Nombres de `sales-ops` (solo como catálogo cerrado; sin invocar) |
| Store inyectable + memoria | Patrón Growth Core (`memory-store` / Mongo) |
| Índices + migración | Patrón `015-growth-actividades` |
| IAM registry + catálogo granular + roles | Patrón SALES-001 |
| `requirePermission` + `tenantId` de sesión | Identity / ADR-004 · ADR-008 |
| Actor timestamps | `createdByUserId` / `updatedByUserId` (sesión) |

**No** reutiliza `workflow_definitions` como almacén.

## Qué implementó

- Colecciones `growth_automations` (identidad estable) + `growth_automation_versions` (definición versionada)
- Pasos persistidos: **Trigger → Condición\* → Acción+** (catálogo cerrado ADR-011)
- Tipo `wait` representable en el modelo; **rechazado** en validación (`wait_not_enabled`)
- Estados: Automatización `draft` / `active` / `disabled`; versión `draft` / `published` (publicada **inmutable**)
- Editar tras publicar → nueva versión borrador; la publicada no se toca
- Actor sistema documentado: `growth-automation` (sin uso en runtime)
- Migración `016-growth-automations` (índices tenant-scoped)
- Permisos + plantillas Super Admin / Institution Admin / Support / Admissions

## APIs

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/api/growth/automations` | `growth.automations.view` |
| POST | `/api/growth/automations` | `growth.automations.manage` |
| GET | `/api/growth/automations/[id]` | `growth.automations.view` |
| PUT | `/api/growth/automations/[id]` | `growth.automations.manage` |
| POST | `/api/growth/automations/[id]/publish` | `growth.automations.manage` |
| POST | `/api/growth/automations/[id]/active` | `growth.automations.manage` |

## Permisos

| Legacy / registry | Granular | Roles (plantilla) |
| --- | --- | --- |
| `growth.automations.view` | `growth.automations.view` | Super Admin, Institution Admin, Support, Admissions |
| `growth.automations.manage` | `growth.automations.manage` | idem |

Tras desplegar: `npm run sync:tenant-roles -- <tenantId>` si los roles del Espacio ya existían.

## Pruebas

```bash
npx tsx --test tests/baseline/growth-automation-002.test.ts
npx tsc --noEmit
```

Validado: aislamiento tenant A/B; inmutabilidad versión publicada; catálogo rechaza fuera de ADR-011 y WAIT; permisos registry/catálogo/roles; crear/editar/publicar sin efecto de ejecución; nav Automatizaciones sigue `href: null`.

## Fuera de alcance (prohibido / diferido)

- Subscriber / runner / worker / ejecución
- WAIT funcional
- Editor visual / UI `/admin/automatizaciones`
- IA, email Growth, WhatsApp
- Segundo Event Bus / Workflow Engine
- Lógica duplicada de `sales-ops`
- Páginas falsas

## Siguiente OT (propuesta; no abierta)

**OT-GROWTH-AUTOMATION-003** — Subscriber in-process al Event Bus existente: al publicar un `Growth*` del Espacio, evaluar Automatizaciones `active` (versión publicada) y ejecutar **una** Acción `sales-ops` con actor `growth-automation`. Sin WAIT, sin editor, sin cola distribuida.

> Cerrada en [OT-GROWTH-AUTOMATION-003](../OT-GROWTH-AUTOMATION-003/README.md).

---

**Veredicto: APTO TÉCNICO** — persistencia + IAM suficientes para abrir AUTOMATION-003 cuando se autorice.
