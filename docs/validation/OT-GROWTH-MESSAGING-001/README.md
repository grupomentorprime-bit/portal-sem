# OT-GROWTH-MESSAGING-001 — Base de Conversaciones

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-MESSAGING-001 |
| Tipo | Implementación |
| Fecha | 2026-09-07 |
| Estado | **CERRADA · APTO** |
| Criterio APTO | Conversación + Mensaje multi-tenant; idempotencia externa; `GrowthMessageReceived` en Event Bus existente; sin Meta / bandeja / envío |

---

## QUÉ REUTILIZÓ

- **Growth Persona** (`upsertGrowthPersona`, store Persona) — la conversación solo guarda `personaId`
- **Resolución teléfono/email** existente — el conector futuro resuelve Persona antes de llamar a messaging
- **Growth Opportunity** — `oportunidadId` opcional (FK); sin snapshot
- **Event Bus** (`GrowthEventBusPort` / `core_events`) — sin segundo bus
- **Patrón port/adapter** — store inyectable + memoria (tests) + Mongo
- **`tenantId`** — mismo aislamiento por Espacio que el resto de Growth Core

## QUÉ CREÓ

| Pieza | Rol |
| --- | --- |
| `src/core/growth/messaging/` | Modelo, store, ensure conversación, inbound message |
| Colecciones `growth_conversaciones` / `growth_mensajes` | Persistencia mínima |
| `GrowthMessageReceived` | Hecho de dominio en catálogo del bus |
| Migración `018-growth-messaging` | Índices tenant-scoped |
| `tests/baseline/growth-messaging-001.test.ts` | Casos de la OT |

**No tocó:** Meta/WhatsApp, webhooks, bandeja UI, envío, bot/IA, acciones de Automatizaciones, Ventas/Captación/Automatizaciones cerradas.

## CÓMO REPRESENTA UNA CONVERSACIÓN

Un hilo por **Espacio + Persona + canal** (reutilizable), con:

- `externalThreadId` opcional (id del proveedor)
- `oportunidadId` opcional (FK a Growth Opportunity)
- `status` básico: `open` \| `closed` \| `archived`
- Sin datos duplicados de Persona ni Oportunidad

Canales previstos (sin conectores): `whatsapp`, `instagram`, `facebook`, `web_chat`, `other`.

Un **Mensaje** apunta a la conversación: dirección `inbound`/`outbound`, `body`, `externalMessageId` opcional, `status` mínimo, fechas.

## CÓMO EVITA DUPLICADOS

Índice unique sparse `{ tenantId, channel, externalMessageId }` en `growth_mensajes`.  
`recordGrowthInboundMessage` short-circuit si el id externo ya existe → no inserta ni republica el evento.

Conversaciones: unique sparse `{ tenantId, channel, externalThreadId }`; si no hay hilo externo, reutiliza conversación `open` de la misma Persona+canal.

## CÓMO SEPARA ESPACIOS

Toda query lleva `tenantId`. Lookups de Persona, conversación y mensaje nunca cruzan Espacios. El mismo `externalMessageId` en dos tenants son dos mensajes distintos.

## EVENTO GENERADO

**`GrowthMessageReceived`** — “Se recibió un mensaje”

```ts
{
  type: "GrowthMessageReceived",
  tenantId,
  entityType: "growth.message",
  entityId: messageId,
  payload: {
    conversationId,
    messageId,
    personaId,
    channel,
    direction: "inbound",
    oportunidadId?,      // si la conversación la tiene
    externalMessageId?,
    occurredAt,
  }
}
```

Publicación **después** de persistir. Si el bus falla, el mensaje queda (sin `eventId`). Registrado en `GROWTH_DOMAIN_EVENT_TYPES` + `DOMAIN_EVENT_TYPES`.

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-messaging-001.test.ts
```

| Caso | Resultado |
| --- | --- |
| Crear / reutilizar conversación (Persona+canal / externalThreadId) | OK |
| Guardar mensaje entrante + Persona | OK |
| No duplicar mensaje externo | OK |
| Oportunidad opcional (solo FK) | OK |
| Aislamiento entre Espacios | OK |
| Emitir `GrowthMessageReceived` vía Event Bus | OK |
| Fallo del bus no borra mensaje | OK |
| Migración 018 registrada + índices | OK |

## LÍMITES

- Sin Meta / WhatsApp API / webhook
- Sin bandeja visual ni envío real
- Sin bot, IA, respuestas automáticas
- Sin nuevas acciones de Automatizaciones (el evento queda disponible como trigger futuro)
- Sin campañas ni analítica
- Outbound modelado en tipos; sin API de envío
- Resolución Persona por teléfono/email queda en el conector (reutiliza `upsertGrowthPersona`)

## Siguiente paso (propuesta — no abierto)

**OT-GROWTH-MESSAGING-002** — adaptador WhatsApp Cloud API (webhook inbound → `recordGrowthInboundMessage` + resolución Persona por teléfono), sin bandeja ni envío.
