# OT-GROWTH-MESSAGING-004 — Bandeja de Mensajes V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-MESSAGING-004 |
| Tipo | Implementación (bandeja UI) |
| Fecha | 2026-09-07 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| Entrada | [MESSAGING-001](../OT-GROWTH-MESSAGING-001/README.md) · [002](../OT-GROWTH-MESSAGING-002/README.md) · [003](../OT-GROWTH-MESSAGING-003/README.md) |
| Refinamiento visual | [OT-GROWTH-MESSAGING-004A](../OT-GROWTH-MESSAGING-004A/README.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## QUÉ PUEDE HACER AHORA EL USUARIO

En `/admin/mensajes` el administrador ve la bandeja real del Espacio:

- **Quién** escribió (nombre de la Persona)
- **Por dónde** (canal, p. ej. WhatsApp)
- **Qué** dijo (último mensaje / hilo)
- **Cuándo**
- **Responder** con texto libre (reutiliza MESSAGING-003)

**Desktop:** lista a la izquierda · conversación abierta a la derecha.  
**Móvil:** lista → tocar conversación → chat (con volver).

Accesos: **Ver persona**; **Ver oportunidad** solo si hay vínculo real.

## QUÉ REUTILIZÓ

| Pieza | Origen |
| --- | --- |
| `growth_conversaciones` / `growth_mensajes` | MESSAGING-001 |
| Personas | Growth Core |
| `POST /api/growth/conversaciones/:id/reply` | MESSAGING-003 |
| Shell V2 + AEK (`AdminModulePage`, `EmptyState`, tokens) | UX admin existente |
| Permisos `growth.sales.read` / `operate` | Ventas |

**No** se creó otro motor de mensajes ni se modificó el envío/recepción de 001/002/003.

## QUÉ NO MUESTRA

IDs técnicos, wamid, webhooks, tokens, WABA, estados de proveedor ni lenguaje de Meta.  
Tampoco inventa «no leído» (el modelo actual no lo tiene).

## CAPTURAS (validación humana)

| Archivo | Rol |
| --- | --- |
| [`admin-mensajes-desktop.png`](./admin-mensajes-desktop.png) | Desktop: lista + hilo abierto |
| [`admin-mensajes-desktop-composer.png`](./admin-mensajes-desktop-composer.png) | Desktop: caja de respuesta |
| [`admin-mensajes-mobile-list.png`](./admin-mensajes-mobile-list.png) | Móvil: listado |
| [`admin-mensajes-mobile-chat.png`](./admin-mensajes-mobile-chat.png) | Móvil: chat |

```bash
npx tsx --env-file=.env scripts/capture-growth-messaging-004.ts
```

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-messaging-004.test.ts
```

## QUÉ FALTA (fuera de esta OT)

- No leídos reales (modelo)
- Plantillas / ventana cerrada
- Bot, IA, Instagram/Facebook, campañas, analítica
- APTO VISUAL (solo validación humana)
