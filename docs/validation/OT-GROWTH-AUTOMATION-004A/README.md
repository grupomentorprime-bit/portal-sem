# OT-GROWTH-AUTOMATION-004A — Refinamiento UX final

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-004A |
| Tipo | Refinamiento visual / copy (superficie) |
| Fecha | 2026-09-06 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| Predecesora | [OT-GROWTH-AUTOMATION-004](../OT-GROWTH-AUTOMATION-004/README.md) · funcionalmente aprobada |
| ADR | [ADR-011](../../architecture/ADR-011.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## Objetivo

Cerrar el refinamiento visual de Automatizaciones V1 **sin** tocar APIs, runtime, Event Bus, sales-ops, versionado, IAM, catálogo, Shell ni navegación.

## Qué cambió (solo superficie)

| # | Área | Cambio |
| --- | --- | --- |
| 1 | Nombre | Proyección `automationDisplayName`: oculta marcadores técnicos `[…]` al inicio. Listado, formulario, breadcrumb, título y detalle muestran solo el nombre humano. |
| 2 | Formulario | Flujo visual en tres bloques conectados: **1 · Cuando pase esto** → **2 · Si se cumple esto** → **3 · Hacer esto**. Mismo modelo y campos. Sin canvas ni drag & drop. |
| 3 | Acciones | Se mantienen **Guardar borrador** · **Revisar y activar** y el resumen en lenguaje natural. En móvil los bloques se apilan. |

## Qué no se tocó

APIs, runtime, Event Bus, sales-ops, versionado, IAM, catálogo, Shell, navegación. Sin WAIT, canvas, IA, email, WhatsApp, runs ni funciones nuevas.

## Evidencia visual (validación humana)

| Captura | Contenido |
| --- | --- |
| [`admin-automatizaciones-create.png`](./admin-automatizaciones-create.png) | Creación desktop |
| [`admin-automatizaciones-active.png`](./admin-automatizaciones-active.png) | Detalle activo |
| [`admin-automatizaciones-list.png`](./admin-automatizaciones-list.png) | Listado |
| [`admin-automatizaciones-responsive.png`](./admin-automatizaciones-responsive.png) | Responsive |

```bash
npx tsx --test tests/baseline/growth-automation-004.test.ts
npx tsc --noEmit
# con npm run dev en :3000 (preferir Espacio ADL):
npx tsx --env-file=.env scripts/capture-growth-automation-004a.ts
```

## Veredicto

**No declarar APTO VISUAL** — esperar validación visual humana.
