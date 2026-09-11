# OT-GROWTH-MESSAGING-002 — Recibir mensajes de WhatsApp

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-MESSAGING-002 |
| Tipo | Implementación |
| Fecha | 2026-09-07 |
| Estado | **CERRADA · APTO** |
| Criterio APTO | Webhook Cloud API autenticado → Persona por teléfono → `recordGrowthInboundMessage` → `GrowthMessageReceived`; multi-tenant; sin envío ni bandeja |

---

## QUÉ CONECTÓ

El webhook oficial de **WhatsApp Business Cloud API** con la base de Conversaciones de MESSAGING-001.

| Pieza | Rol |
| --- | --- |
| `GET/POST /api/webhooks/whatsapp` | Verificación Meta + eventos inbound |
| `growth_whatsapp_connections` | Cuenta/número por Espacio (secretos cifrados, fuera del documento del Espacio) |
| `PUT /api/admin/integrations/whatsapp` | Configurar la cuenta del Espacio (sin devolver tokens) |
| `receiveWhatsAppCloudWebhook` | Orquesta firma → Espacio → Persona → mensaje |

Reutiliza sin tocarlo: `upsertGrowthPersona`, resolución por teléfono, `recordGrowthInboundMessage`, Event Bus existente, `tenantId`.

**No tocó** el núcleo MESSAGING-001, bandeja, envío, bot, IA, Automatizaciones, Instagram/Facebook, campañas ni analítica.

## QUÉ PASA CUANDO ALGUIEN ESCRIBE

1. La persona escribe por WhatsApp.
2. Meta llama a Growth OS (`POST /api/webhooks/whatsapp`) con el payload Cloud API y `X-Hub-Signature-256`.
3. Growth OS valida la firma con el *app secret* de la cuenta conectada.
4. Extrae número remitente, `wamid`, `phone_number_id` y el contenido soportado (texto, respuestas de botón/lista, media con pie o etiqueta).
5. Resuelve el Espacio por el `phone_number_id` conectado.
6. Resuelve la Persona por teléfono (`upsertGrowthPersona`).
7. Crea o reutiliza la conversación WhatsApp de esa Persona.
8. Guarda el mensaje (idempotente por `wamid`).
9. Publica **`GrowthMessageReceived`** en el Event Bus de siempre.

Los *statuses* (entregado/leído) no entran como mensaje. Un reintento de Meta con el mismo `wamid` no duplica ni vuelve a publicar el evento.

## CÓMO SABE A QUÉ ESPACIO PERTENECE

Cada Espacio conecta **su** número/cuenta Cloud API (`phone_number_id` + *verify token* + *app secret*).

Esa conexión vive en `growth_whatsapp_connections`, no en `growth_space_config` ni en el documento del Espacio. No hay números ni tenants hardcodeados.

El `phone_number_id` del payload apunta a **un solo** Espacio (índice único). Si el número no está conectado o está duplicado, el evento no ingresa.

## QUÉ PASA SI LA PERSONA NO EXISTE

Se crea o reutiliza con **`upsertGrowthPersona`** (el mismo mecanismo de identidad de Growth Core). Solo teléfono; origen de primer toque `unknown` + canal `whatsapp`.

No hay un segundo modelo de Personas. Si esa Persona ya existía (mismo teléfono en el Espacio), se reutiliza y su origen original no cambia.

## SEGURIDAD

- **GET:** `hub.mode=subscribe` + *verify token* de una conexión habilitada → `hub.challenge` en texto plano. Token incorrecto → 403.
- **POST:** firma `X-Hub-Signature-256` obligatoria. Firma inválida, JSON inválido o número desconocido → no se guarda nada.
- Secretos cifrados en servidor (`SESSION_SECRET`); la API admin solo expone flags (`hasVerifyToken` / `hasAppSecret`). Nada en `NEXT_PUBLIC_`.
- Un número conectado no puede reclamarse desde otro Espacio.
- El webhook no registra tokens ni el body en logs.

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-messaging-002.test.ts
```

| Caso | Resultado |
| --- | --- |
| Verificación webhook (token válido / inválido) | OK |
| Mensaje entrante de texto | OK |
| Persona existente (mismo teléfono) | OK |
| Persona nueva vía `upsertGrowthPersona` | OK |
| Conversación creada y reutilizada | OK |
| Reintento Meta (`wamid` igual) sin duplicado ni segundo evento | OK |
| Aislamiento entre dos Espacios / número no robable | OK |
| `GrowthMessageReceived` en el Event Bus | OK |
| Payload inválido / firma inválida / número desconocido no ingresa | OK |
| Secretos fuera del documento del Espacio | OK |
| Migración 019 registrada | OK |

## QUÉ FALTA

- ~~Responder / enviar mensajes~~ → **MESSAGING-003**
- Bandeja visual en admin
- Bot, IA, Automatizaciones nuevas sobre el evento
- Instagram / Facebook Messenger
- UI de Integraciones (hoy solo API)
- Campañas y analítica

## Siguiente paso (propuesta — no abierto)

Bandeja mínima de conversaciones WhatsApp (leer/escribir lo ya persistido).
