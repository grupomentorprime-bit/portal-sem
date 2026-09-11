# OT-GROWTH-MESSAGING-004A — Refinamiento visual final

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-MESSAGING-004A |
| Tipo | Refinamiento visual (superficie) |
| Fecha | 2026-09-08 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| Predecesora | [OT-GROWTH-MESSAGING-004](../OT-GROWTH-MESSAGING-004/README.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## Objetivo

Cerrar el refinamiento visual de la bandeja `/admin/mensajes` **sin** tocar MESSAGING-001/002/003, APIs, datos, permisos, envío, webhook ni Shell.

## Qué cambió (solo superficie)

| # | Área | Cambio |
| --- | --- | --- |
| 1 | Selección | Conversación activa con acento lateral + superficie suave (Growth OS). |
| 2 | Canal | Icono + nombre humano; WhatsApp reconocible de inmediato. Sin estados inventados. |
| 3 | Cabecera de hilo | Nombre protagonista; canal secundario; Ver persona / Ver oportunidad discretos. |
| 4 | Desktop chat | Mensajes anclados hacia el compositor; menos vacío; panel con altura de conversación. |
| 5 | Burbujas | Recibidos vs enviados con superficies/tokens existentes (sin colores estridentes). |
| 6 | Compositor | Campo + Enviar en un bloque asociado; deshabilitado evidente sin texto. |
| 7 | Móvil chat | Prioriza conversación: sin breadcrumb/título general; `←` + nombre bastan. |
| 8 | Móvil lista | Persona, último mensaje, hora y canal. Nada más. |

## Qué no se tocó / no se agregó

MESSAGING-001/002/003, APIs, webhook, envío, permisos, Shell.  
Sin no leído, contador, online, escribiendo…, doble check, adjuntos, emojis, búsqueda avanzada, asignación, IA, bot, plantillas ni datos simulados.

## Evidencia visual (validación humana)

| Captura | Contenido |
| --- | --- |
| [`admin-mensajes-desktop.png`](./admin-mensajes-desktop.png) | Desktop: bandeja + hilo |
| [`admin-mensajes-desktop-composer.png`](./admin-mensajes-desktop-composer.png) | Desktop: escribiendo |
| [`admin-mensajes-mobile-list.png`](./admin-mensajes-mobile-list.png) | Móvil: lista |
| [`admin-mensajes-mobile-chat.png`](./admin-mensajes-mobile-chat.png) | Móvil: conversación |

```bash
npx tsx --test tests/baseline/growth-messaging-004.test.ts
# con npm run dev en :3000 (preferir Espacio ADL):
npx tsx --env-file=.env scripts/capture-growth-messaging-004a.ts
```

## Veredicto

**No declarar APTO VISUAL** — esperar validación visual humana.
