# OT-GROWTH-SALES-001 — Ventas V1 operativa

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SALES-001 |
| Tipo | Implementación (superficie operativa) |
| Fecha | 2026-09-05 |
| Estado | **CERRADA · APTO TÉCNICO** (pendiente validación visual humana) |
| ADR | [ADR-010](../../architecture/ADR-010.md) |
| Alcance | Cola `/admin/ventas` + operar Oportunidad sobre Growth Core existente |
| Criterio | Listado tenant-scoped, filtros, transición, seguimiento, próxima acción, actor humano, eventos, aislamiento, permisos, typecheck, baseline, build |

---

## Objetivo

Hacer operables las Oportunidades existentes de Growth Core. Ventas es una superficie operativa — **no** un CRM nuevo.

---

## Qué reutilizó

- Colecciones `growth_personas` / `growth_oportunidades` / `growth_actividades`
- `transitionGrowthOpportunity`, `setGrowthNextAction`, `clearGrowthNextAction`, `recordGrowthActivity`
- Workflow `growth.opportunity` + Event Bus (`core_events`)
- Ficha `/admin/personas/[id]`, labels/kit admin existentes
- IAM existente (registry + catálogo granular + roles)

## Qué implementó

- `/admin/ventas` — cola de Oportunidades del Espacio activo
- `/admin/ventas/[id]` — operar: estado, nota/contacto, set/clear próxima acción, abrir Persona
- Capa `sales-ops` reutilizable (UI / API / futuro Automatizaciones)
- Lectura `ventas-read` (proyección; sin lógica de dominio)
- Permisos `growth.sales.read` / `growth.sales.operate`
- Actor de sesión en mutaciones (Workflow `performedBy` + `actorUserId` en Actividad)

## APIs creadas

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/api/growth/oportunidades` | `growth.sales.read` |
| GET | `/api/growth/oportunidades/[id]` | `growth.sales.read` |
| POST | `/api/growth/oportunidades/[id]/transition` | `growth.sales.operate` |
| POST | `/api/growth/oportunidades/[id]/activities` | `growth.sales.operate` |
| PUT | `/api/growth/oportunidades/[id]/next-action` | `growth.sales.operate` |
| DELETE | `/api/growth/oportunidades/[id]/next-action` | `growth.sales.operate` |

## Permisos

| Legacy | Granular | Roles (plantilla) |
| --- | --- | --- |
| `growth.sales.read` | `growth.sales.view` | Super Admin, Institution Admin, Support, Admissions |
| `growth.sales.operate` | `growth.sales.operate` | idem |

Nav Ventas ya no depende de CMS/forms. Tras desplegar: `npm run sync:tenant-roles -- <tenantId>` (o el script de captura actualiza el rol del operador).

## Actor / auditoría

Acciones manuales usan `ctx.user._id` → `actorUserId` en Actividad y `performedBy` en historial de Workflow. Ingestión pública sigue usando `growth-ingest`.

## Eventos (contrato vigente)

| Acción | Actividad | Evento |
| --- | --- | --- |
| Cambiar estado | `opportunity_transitioned` | `GrowthOpportunityTransitioned` |
| Nota / contacto | `note` / `contact` | `GrowthActivityRecorded` |
| Qué hacer ahora | `next_action_set` | `GrowthNextActionSet` |

Actividad = SSOT de hechos. Event Bus no la reemplaza.

## Pruebas

```bash
npx tsx --test tests/baseline/growth-sales-001.test.ts
npx tsc --noEmit
npm run build
```

Validado: transición válida/inválida, note/contact, set/clear, actor humano, eventos, aislamiento tenant, permisos, typecheck.

## Evidencia visual

| Captura | Contenido |
| --- | --- |
| [`admin-ventas-empty.png`](./admin-ventas-empty.png) | Cola vacía |
| [`admin-ventas-list.png`](./admin-ventas-list.png) | Cola con datos |
| [`admin-ventas-operate.png`](./admin-ventas-operate.png) | Operar Oportunidad |

**No se declara APTO VISUAL.** Pendiente validación visual humana.

```bash
npx tsx --env-file=.env scripts/capture-growth-sales-001.ts
```

## Fuera de alcance (prohibido / diferido)

- `crm_*`, segundo CRM / Workflow / Event Bus
- Automatizaciones editor/runtime, IA, Mensajes, Campañas
- attribution, merge Personas, `/platform`, CORE-008
- Hardcode ADL/SEM
