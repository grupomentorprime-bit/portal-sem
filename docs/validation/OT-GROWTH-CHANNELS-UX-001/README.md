# OT-GROWTH-CHANNELS-UX-001 — Rediseño visual Centro de Canales

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CHANNELS-UX-001 |
| Tipo | Refinamiento visual (superficie) |
| Fecha | 2026-09-08 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| Predecesora | [OT-GROWTH-MESSAGING-005](../OT-GROWTH-MESSAGING-005/README.md) · [005A](../OT-GROWTH-MESSAGING-005A/README.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## Qué cambió (solo UX / UI)

- Cabecera: copy de Centro de Canales; sin “Volver al inicio”.
- WhatsApp como tarjeta protagonista (estado, número, capacidades, acción primaria + secundarias discretas).
- Instagram, Facebook, Chat del sitio y Correo como tarjetas compactas deshabilitadas (“Disponible más adelante”).
- Modal de conectar/administrar: jerarquía, espacios y explicación mejorados (misma lógica y campos).

**No se tocó:** shell, Mensajes, APIs, permisos, webhook, secretos ni conexión técnica.

## Jerarquía de acciones WhatsApp

| Estado | Primario | Secundarios |
| --- | --- | --- |
| Conectado | Ver mensajes | Administrar · Probar conexión · Pausar |
| Incompleto | Completar conexión | Ver mensajes · Administrar · Probar conexión · Pausar |
| Pausado | Reanudar | Ver mensajes · Administrar · Probar conexión |

## Evidencia visual (validación humana)

| Captura | Contenido |
| --- | --- |
| [`admin-channels-desktop.png`](./admin-channels-desktop.png) | Desktop: composición Centro de Canales |
| [`admin-channels-whatsapp-connected.png`](./admin-channels-whatsapp-connected.png) | Desktop: WhatsApp conectado |
| [`admin-channels-whatsapp-incomplete.png`](./admin-channels-whatsapp-incomplete.png) | Desktop: WhatsApp incompleto |
| [`admin-channels-whatsapp-modal.png`](./admin-channels-whatsapp-modal.png) | Modal Administrar WhatsApp |
| [`admin-channels-mobile.png`](./admin-channels-mobile.png) | Móvil: una tarjeta por fila |

## Captura

```bash
npx tsx --env-file=.env scripts/capture-growth-channels-ux-001.ts
```
