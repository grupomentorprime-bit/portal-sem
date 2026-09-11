# OT-GROWTH-MESSAGING-003 — Responder WhatsApp

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-MESSAGING-003 |
| Tipo | Implementación |
| Fecha | 2026-09-07 |
| Estado | **CERRADA · APTO** |
| Criterio APTO | Respuesta libre por Cloud API sobre conversación existente; mensaje saliente persistido; fallo real sin fingir envío; ventana/plantilla sin gestión completa; multi-tenant; sin bandeja |

---

## QUÉ PUEDE HACER AHORA EL USUARIO

Sobre una **conversación WhatsApp ya existente** (creada al recibir mensajes), un operador con permiso de Ventas puede **enviar una respuesta de texto libre** desde Growth OS.

No hay bandeja visual completa todavía: el envío está disponible por API operativa.

## CÓMO SE ENVÍA

1. El operador llama `POST /api/growth/conversaciones/:id/reply` con `{ body, clientRequestId? }` (permiso `growth.sales.operate`).
2. Growth OS valida que la conversación pertenece al **Espacio del usuario** y es canal `whatsapp`.
3. Usa la **conexión WhatsApp del mismo Espacio** (`phone_number_id` + *access token* cifrado).
4. Resuelve el destinatario desde el hilo (`externalThreadId` = `phoneNumberId:wa_id`).
5. Comprueba la **ventana de servicio de 24 h** desde el último mensaje entrante.
6. Si la ventana está abierta, llama a **WhatsApp Cloud API** (`POST /{phone-number-id}/messages`).
7. Guarda el mensaje saliente (`direction: outbound`, `status: sent`, `externalMessageId` = wamid de Meta).
8. Actualiza `lastMessageAt` de la conversación.
9. Publica **`GrowthMessageSent`** en el Event Bus existente.

La cuenta se configura en `PUT /api/admin/integrations/whatsapp` (ahora también `accessToken`). La respuesta pública solo expone `hasAccessToken`.

## QUÉ PASA SI FALLA

| Situación | Comportamiento |
| --- | --- |
| Meta rechaza el envío | `status: failed` + `failureCode` / `failureDetail`; **no** queda como enviado |
| Ventana cerrada / sin inbound | No llama a Meta; registra `template_required` (hace falta plantilla; **sin** gestión de plantillas en esta OT) |
| Sin conexión / sin access token / deshabilitada | `connection_unavailable` — no inventa cuenta |
| Sin destinatario en el hilo | `recipient_unavailable` |
| Conversación de otro Espacio | `conversation_not_found` |
| Reintento con mismo `clientRequestId` tras éxito | Devuelve el mensaje ya enviado; **no** vuelve a llamar a Meta |
| Reintento tras fallo con el mismo `clientRequestId` | Reutiliza el **mismo** registro de mensaje |

## QUÉ SE GUARDA

En `growth_mensajes`, mismo hilo (`growth_conversaciones`):

- `body`, `occurredAt` / `createdAt`
- `direction: outbound`
- `status`: `queued` → `sent` \| `failed`
- `externalMessageId` cuando Meta entrega el wamid
- `clientRequestId` opcional (idempotencia de reintento)
- `failureCode` / `failureDetail` si falló (sin secretos)

## SEGURIDAD

- Tokens (`accessToken`, `appSecret`, `verifyToken`) solo servidor, cifrados en `growth_whatsapp_connections`
- Un Espacio solo usa **su** conexión (`tenantId`)
- La API de reply no expone ni registra tokens
- Conversación + tenant validados antes de cualquier llamada a Meta
- Vista pública: `hasAccessToken` / `hasAppSecret` / `hasVerifyToken` — nunca el valor

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-messaging-003.test.ts
```

| Caso | Resultado |
| --- | --- |
| Envío correcto + mensaje saliente + conversación | OK |
| Aislamiento entre Espacios | OK |
| Meta rechaza → failed real | OK |
| Reintento sin duplicación incorrecta | OK |
| Reintento tras fallo reutiliza registro | OK |
| Conexión / token no disponible | OK |
| Ventana cerrada → template_required | OK |
| Secretos no expuestos | OK |
| Migración 020 registrada | OK |

## QUÉ FALTA

- Bandeja visual completa en admin
- Gestión de plantillas WhatsApp
- Bot, IA, respuestas automáticas
- Instagram / Facebook
- Campañas y analítica
- Cambios a Automatizaciones (el evento `GrowthMessageSent` queda disponible como trigger futuro)
- Segundo motor de mensajes

## Siguiente paso (propuesta — no abierto)

Bandeja mínima de lectura/escritura sobre lo ya persistido, o gestión básica de plantillas para fuera de ventana.
