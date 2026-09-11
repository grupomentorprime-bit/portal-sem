# OT-GROWTH-AUTOMATION-007 — Ver qué pasó

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-007 |
| Tipo | Implementación (historial de ejecuciones) |
| Fecha | 2026-09-07 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| ADR | [ADR-011](../../architecture/ADR-011.md) |
| Entrada | [AUTOMATION-003](../OT-GROWTH-AUTOMATION-003/README.md) · [005](../OT-GROWTH-AUTOMATION-005/README.md) · [006](../OT-GROWTH-AUTOMATION-006/README.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## QUÉ REUTILIZÓ

| Pieza | Origen |
| --- | --- |
| Outcomes del runtime (`executed` / `waiting` / `resumed` / `action_failed`) | AUTOMATION-003 / 005 |
| Acciones reales vía `sales-ops` (+ `activityId` como ref) | AUTOMATION-003 |
| Espera (`scheduledFor`, duración) | AUTOMATION-005 / `core_scheduled_events` |
| Claims anti-bucle / `attemptKey` = `sourceEventId` | `reentrancy.ts` (idempotencia, sin exponer en UI) |
| Permiso `growth.automations.view` | AUTOMATION-002 / 004 |
| Superficie `/admin/automatizaciones/[id]` | AUTOMATION-004 / 006 |
| Etiqueta «Qué ha pasado» | Convención Growth (`GROWTH_TIMELINE_SECTION_LABEL`) |

**No** se creó segundo Event Bus, segundo runtime ni copia de payloads/eventos.

## QUÉ AGREGÓ

| Área | Cambio |
| --- | --- |
| Proyección | `growth_automation_runs` — solo estado humano + líneas de prosa + refs |
| Runtime | `runRecorder` opcional (fail-soft) al completar / esperar / fallar / reanudar |
| API | `GET /api/growth/automations/[id]/history` |
| UI | Sección **Qué ha pasado** en automatización **activa** |
| Migración | `017-growth-automation-runs` (índices tenant-scoped) |

## QUÉ PODRÁ VER EL USUARIO

Dentro de una automatización activa:

- Cuándo se activó (`Hoy, 10:32` / `6 sep, 16:20`)
- Qué hizo (prosa: «Se creó una oportunidad.», «Definió qué hacer ahora: “…”», etc.)
- Si está **Esperando** y cuándo **continuará**
- Si **Terminó** correctamente
- Si **Necesita atención** («No se pudo completar esta acción.» + «Ver un poco más» si hay detalle útil)

Estados humanos (solo si aplican): En curso · Esperando · Terminada · Necesita atención.

**No ve:** `eventId`, `resumeKey`, `automationId`, `version`, claims, payloads, stacks.

## QUÉ GUARDA NUEVO (si fue necesario)

Sí: proyección fina `growth_automation_runs` por ejecución.

- Upsert idempotente por `(tenantId, automationId, attemptKey)` — reintentos no duplican
- Guarda líneas humanas ya redactadas + `status` + `scheduledFor` (si espera)
- Guarda `activityIds` como referencia (no copia de `growth_actividades` ni de `core_events`)
- Un Espacio solo lista sus propias ejecuciones

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-automation-007.test.ts
npx tsx --test tests/baseline/growth-automation-003.test.ts tests/baseline/growth-automation-005.test.ts tests/baseline/growth-automation-006.test.ts
npx tsc --noEmit
# con npm run dev:
npx tsx --env-file=.env scripts/capture-growth-automation-007.ts
```

Cubierto: evento → acción → historial; espera; reanudación → terminado; fallo → necesita atención; aislamiento tenant; permisos en API; sin duplicados por reintento; sin jerga en UI.

## CAPTURAS

| # | Archivo | Contenido |
| --- | --- | --- |
| 1 | [`admin-automatizaciones-history-completed.png`](./admin-automatizaciones-history-completed.png) | Ejecución terminada |
| 2 | [`admin-automatizaciones-history-waiting.png`](./admin-automatizaciones-history-waiting.png) | Ejecución esperando |
| 3 | [`admin-automatizaciones-history-attention.png`](./admin-automatizaciones-history-attention.png) | Ejecución con problema |
| 4 | [`admin-automatizaciones-history-responsive.png`](./admin-automatizaciones-history-responsive.png) | Móvil |

## LÍMITES

| No en esta OT |
| --- |
| Analítica / gráficos / métricas inventadas |
| Canvas / drag & drop / IA |
| Email / WhatsApp |
| Segundo Event Bus / segundo runtime |
| Rediseño del Admin Shell |
| Cambios a AUTOMATION-006 (salvo coexistir) |

---

**No declarar APTO VISUAL** — esperar validación humana.  
**No abrir siguiente OT.**
