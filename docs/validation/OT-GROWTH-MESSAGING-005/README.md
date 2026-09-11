# OT-GROWTH-MESSAGING-005 — Ajustes → Canales

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-MESSAGING-005 |
| Tipo | Implementación (superficie admin) |
| Fecha | 2026-09-08 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| Entrada | [MESSAGING-002](../OT-GROWTH-MESSAGING-002/README.md) · [003](../OT-GROWTH-MESSAGING-003/README.md) · [004](../OT-GROWTH-MESSAGING-004/README.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## QUÉ REUTILIZÓ

| Pieza | Origen |
| --- | --- |
| `growth_whatsapp_connections` + cifrado | MESSAGING-002 |
| `GET/PUT /api/admin/integrations/whatsapp` | MESSAGING-002/003 |
| `upsertGrowthWhatsAppConnection` / `toPublicWhatsAppConnection` | Core WhatsApp |
| Permiso `settings.integrations` | Identity (mismo que integraciones) |
| Shell V2 + `AdminPageFrame` | UX admin existente |

**No** se creó otro motor de integraciones ni se tocó la bandeja Mensajes.

## QUÉ AGREGÓ

| Pieza | Rol |
| --- | --- |
| `/admin/settings/channels` | Superficie Ajustes → Canales |
| Nav **Canales** (permiso `settings.integrations`) | Separado de Integraciones (S3) |
| `toWhatsAppChannelAdminView` / estados humanos | Conectado · No conectado · Incompleto · Pausado |
| `POST /api/admin/integrations/whatsapp/test` | Probar conexión guardada |
| `probePhoneNumber` en Cloud API | Comprobación Graph sin enviar mensaje |
| Futuros: Instagram, Facebook, Chat del sitio, Correo | Solo “Disponible más adelante” |

## QUÉ VE EL ADMIN

En **Ajustes → Canales**:

- **WhatsApp** con estado en lenguaje humano
- Número visible (si hay)
- Si recibe mensajes / si puede responder desde Mensajes
- Última actualización (si aporta)
- Otros canales como información futura (sin datos ficticios)

No ve tokens, WABA, phoneNumberId, webhooks ni detalles de Meta en la ficha.

## QUÉ PUEDE HACER

1. **Conectar** — PUT existente  
2. **Administrar** — actualizar configuración (secretos opcionales = mantener)  
3. **Pausar / Reanudar** — `enabled` vía PUT (V1: desconectar = pausar)  
4. **Probar conexión** — “Conexión correcta” o “No pudimos conectar. Revisa la configuración.”  
5. **Ver mensajes** — abre `/admin/mensajes`

## SEGURIDAD

- Secretos solo servidor, cifrados
- UI / `channel` view sin tokens ni IDs técnicos
- Endpoint de prueba no reenvía errores de Meta
- Multi-tenant: cada Espacio solo su conexión
- Nav Canales oculto sin `settings.integrations`

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-messaging-005.test.ts
```

| Caso | Resultado |
| --- | --- |
| Estado conectado / incompleto / pausado / no conectado | OK |
| Probar conexión correcta / fallida | OK |
| Aislamiento por Espacio | OK |
| Secretos no expuestos en vista de canal | OK |
| Permiso + nav Canales | OK |
| Link a Mensajes; sin tocar bandeja | OK |

## CAPTURAS (validación humana)

| Archivo | Rol |
| --- | --- |
| [`admin-channels-desktop.png`](./admin-channels-desktop.png) | Desktop: Canales |
| [`admin-channels-whatsapp-connected.png`](./admin-channels-whatsapp-connected.png) | WhatsApp conectado |
| [`admin-channels-whatsapp-incomplete.png`](./admin-channels-whatsapp-incomplete.png) | WhatsApp incompleto |
| [`admin-channels-whatsapp-paused.png`](./admin-channels-whatsapp-paused.png) | WhatsApp pausado |
| [`admin-channels-mobile.png`](./admin-channels-mobile.png) | Móvil |

```bash
npx tsx --env-file=.env scripts/capture-growth-messaging-005.ts
```

## QUÉ FALTA (fuera de esta OT)

- Embedded Signup
- Instagram / Facebook / chat / correo reales
- Borrado definitivo de secretos
- Bot, IA, campañas, analítica
- APTO VISUAL (solo validación humana)
