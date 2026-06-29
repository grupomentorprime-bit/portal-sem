# Event Bus — Domain Events

**Versión:** v1.9.0  
**OT:** [OT-CORE-EVENTS-001](../ot/OT-CORE-EVENTS-001.md)  
**ADR:** [ADR-006](../architecture/ADR-006.md)

---

## Propósito

El Event Bus oficial desacopla los módulos del Core. Cuando una acción produce efectos secundarios, el módulo origen **publica** un Domain Event; otros módulos **reaccionan** mediante suscripciones.

---

## Ubicación

```text
src/core/events/
├── bus/dispatcher.ts      # Despacho con reintentos y aislamiento
├── registry/              # Catálogo de tipos conocidos
├── publisher/             # publish, publishMany, schedule
├── subscribers/           # subscribe, once, subscribeMany
├── handlers/builtin.ts    # Search, Notifications, Analytics (stubs)
├── replay/replay.ts       # Reprocesamiento
├── dead-letter/           # DLQ
├── persistence/store.ts   # MongoDB core_events
├── middleware/            # Observabilidad
└── utils/context.ts       # ExecutionContext en eventos
```

---

## Modelo DomainEvent

| Campo | Descripción |
| --- | --- |
| `id` | Identificador único (`evt-…`) |
| `type` | Tipo del evento (ej. `PagePublished`) |
| `version` | Versión del esquema del evento |
| `tenantId` | Tenant multi-tenant |
| `entityType` / `entityId` | Entidad afectada |
| `occurredAt` | Timestamp ISO |
| `userId` | Actor (opcional) |
| `correlationId` | Trazabilidad entre eventos |
| `causationId` | Evento que causó este |
| `payload` | Datos del dominio |
| `context` | requestId, traceId, sessionId |

---

## API del bus

### Publicar

```ts
import { publish, publishMany, schedule } from "@/core/events";

await publish({
  type: "PagePublished",
  tenantId: "sem",
  entityType: "cms.page",
  entityId: pageId,
  userId: actorId,
  payload: { slug, title },
});
```

### Suscribirse

```ts
import { subscribe, once, subscribeMany } from "@/core/events";

const unsub = subscribe("PagePublished", async (event) => {
  // indexar en search
});
```

### Replay

```ts
import { replayEvent, replayEventsByType } from "@/core/events";

await replayEvent("evt-…");
await replayEventsByType("sem", "WorkflowTransitioned", 20);
```

---

## Persistencia

| Colección | Uso |
| --- | --- |
| `core_events` | Todos los eventos publicados |
| `core_event_dead_letter` | Handlers fallidos tras 3 reintentos |
| `core_scheduled_events` | Eventos programados |

---

## Eventos registrados

Workflow: `WorkflowStarted`, `WorkflowTransitioned`, `WorkflowCompleted`, `WorkflowCancelled`

CMS: `PageCreated`, `PagePublished`, `PageArchived`, `NewsPublished`, `ProgramPublished`

Media: `MediaUploaded`, `MediaUpdated`, `MediaDeleted`

Identity: `UserRegistered`, `UserLoggedIn`, `InvitationCreated`, `InvitationAccepted`

---

## Integraciones

| Módulo | Publica | Escucha |
| --- | --- | --- |
| Workflow | ✓ | — |
| Identity | ✓ | — |
| Media | ✓ | — |
| CMS | ✓ | — |
| Search | — | `PagePublished`, `NewsPublished`, `ProgramPublished` |
| Notifications | — | `InvitationCreated` |
| Analytics | — | `WorkflowTransitioned`, `UserLoggedIn` |

---

## APIs administrativas

| Método | Ruta | Permiso |
| --- | --- | --- |
| `POST` | `/api/events/publish` | `events.manage` |
| `GET` | `/api/events` | `events.read` |
| `GET` | `/api/events/:id` | `events.read` |
| `POST` | `/api/events/replay` | `events.replay` |

UI: `/admin/events`

---

## Permisos

* `events.read` — Ver eventos y DLQ
* `events.manage` — Publicar manualmente
* `events.replay` — Reprocesar eventos

---

## Flujo de despacho

```text
publish() → persist (pending) → dispatch handlers
  → retry ×3 por handler
  → éxito: processed
  → fallo total: dead_letter + DLQ entry
```

---

## Workflow (migración)

El bus anterior en `src/core/workflow/events/bus.ts` ahora delega al Event Bus oficial. La API `subscribe`/`publish` de workflow se mantiene como adaptador.
