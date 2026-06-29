# Workflow Engine — AprendeHoy Learning OS

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-WORKFLOW-001 |
| Versión | v1.8.0 |
| Tag Git | v1.8.0-workflow-engine |
| ADR | [ADR-005 — Workflow Engine](../architecture/ADR-005.md) |

## Principios

1. **Genérico** — no conoce Página, Programa ni Postulación; solo entidades, estados y transiciones.
2. **Basado en estados y transiciones** — definiciones declarativas versionadas.
3. **Integrado** — Identity (permisos), Audit, Event Bus.
4. **Multi-tenant** — instancias y historial por tenant.

## Arquitectura

```text
src/core/workflow/
├── engine/         # startWorkflow, transition, canTransition…
├── definitions/    # Plantillas CMS, programas, noticias
├── guards/         # requirePermission, requireRole, customGuard
├── actions/        # audit, notify (extensible)
├── events/         # Event bus (WorkflowStarted, WorkflowTransitioned…)
├── audit/          # Integración identity_audit
└── services/       # ExecutionContext
```

## Modelo de datos

| Colección | Propósito |
| --- | --- |
| `workflow_definitions` | Flujos reutilizables |
| `workflow_instances` | Estado actual de una entidad |
| `workflow_history` | Historial de transiciones |

## ExecutionContext

Todos los servicios reciben:

```ts
{
  requestId, tenant, user, membership, permissions,
  session, locale, timezone, traceId, compatMode
}
```

Construido desde AuthContext: `buildExecutionContext(auth)`.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/workflows/start` | Iniciar instancia |
| POST | `/api/workflows/transition` | Ejecutar transición |
| GET | `/api/workflows/history` | Historial (por instancia o tenant) |
| GET | `/api/workflows/definitions` | Definiciones + instancias activas |

## Definiciones del sistema

| Key | Entidad | Flujo |
| --- | --- | --- |
| `cms.page` | cms.page | draft → review → approved → published → archived |
| `academy.program` | academy.program | draft → published → archived |
| `content.news` | content.news | draft → review → published |

## Integración CMS

Al guardar una página (`PUT /api/cms/pages/[id]`), se sincroniza el workflow vía `syncPageWorkflow()`.

## UI

`/admin/workflows` — definiciones, instancias activas, historial, ejecución de transiciones.

## Event Bus

```ts
import { subscribe } from "@/core/workflow";

subscribe("WorkflowTransitioned", async (event) => {
  // reaccionar sin acoplar al engine
});
```

## Permisos

- `workflow.read` — consultar definiciones e historial
- `workflow.manage` — cancelar/reiniciar workflows
- `workflow.transition` — ejecutar transiciones

## Preparación Serie 2.x

El motor está listo para CRM, Admisiones, Matrículas, Finanzas, Certificados, RRHH y Soporte sin modificar el core.
