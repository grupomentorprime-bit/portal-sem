# OT-GROWTH-AUTOMATION-004 — UI operativa V1 de Automatizaciones

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-004 |
| Tipo | Implementación UI operativa |
| Fecha | 2026-09-06 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| ADR | [ADR-011](../../architecture/ADR-011.md) |
| Entrada | [AUTOMATION-002](../OT-GROWTH-AUTOMATION-002/README.md) · [AUTOMATION-003](../OT-GROWTH-AUTOMATION-003/README.md) · Shell V1 ([SHELL-002](../OT-GROWTH-UX-ADMIN-SHELL-002/README.md)) |
| Refinamiento UX | [OT-GROWTH-AUTOMATION-004A](../OT-GROWTH-AUTOMATION-004A/README.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## REUTILIZÓ

| Pieza | Origen |
| --- | --- |
| APIs `GET/POST /api/growth/automations` (+ publish / active) | AUTOMATION-002 |
| Catálogo cerrado + versionado inmutable | `validateAutomationSteps` / service |
| Runtime Event Bus → sales-ops | AUTOMATION-003 (sin cambios) |
| Admin Shell V1 | SHELL-002 congelado (solo `href` del ítem) |
| Humanización de origen | `humanizeOriginDisplayLabel` |
| Labels Growth (estado / tipo / qué hacer ahora) | `src/lib/growth/labels.ts` |
| Permisos | `growth.automations.view` / `manage` |

## IMPLEMENTÓ

- `/admin/automatizaciones` — listado + empty state
- `/admin/automatizaciones/nueva` y `/admin/automatizaciones/[id]` — formulario guiado (sin canvas)
- Proyección reutilizable técnica → humana (`automations-labels` + `automations-form`)
- Ciclo: borrador → revisar → activar / desactivar; edición de publicada vía nuevo borrador (API existente)
- Nav **Crecer → Automatizaciones** con `href` y gate IAM

## FLUJO UX

Cuando pase esto… → Si se cumple esto… (opcional) → Hacer esto… → resumen en lenguaje natural → Activar automatización.

## PERMISOS

| Permiso | UI | Server |
| --- | --- | --- |
| `view` | listado + detalle lectura | GET APIs / page guard |
| `manage` | crear / editar / activar / desactivar | POST/PUT + page guard |

## AISLAMIENTO

Solo Espacio activo (`tenantId` de sesión). Sin ramas por marca. Sin exponer `tenantId` en UI.

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-automation-004.test.ts tests/baseline/growth-automation-002.test.ts tests/baseline/growth-automation-003.test.ts
npx tsc --noEmit
npx next build
# capturas (servidor en :3000):
npx tsx --env-file=.env scripts/capture-growth-automation-004.ts
```

## NO IMPLEMENTÓ

Canvas, drag & drop, WAIT, historial de runs, IA, email/WhatsApp, acciones nuevas, segundo bus/engine/core, cambios al Shell más allá del `href`.

## CAPTURAS

| Archivo | Rol |
| --- | --- |
| [`admin-automatizaciones-list.png`](./admin-automatizaciones-list.png) | Lista con Automatizaciones |
| [`admin-automatizaciones-empty.png`](./admin-automatizaciones-empty.png) | Estado vacío |
| [`admin-automatizaciones-create.png`](./admin-automatizaciones-create.png) | Crear / editar |
| [`admin-automatizaciones-condition.png`](./admin-automatizaciones-condition.png) | Condición |
| [`admin-automatizaciones-review.png`](./admin-automatizaciones-review.png) | Resumen antes de activar |
| [`admin-automatizaciones-active.png`](./admin-automatizaciones-active.png) | Automatización activa |
| [`admin-automatizaciones-responsive.png`](./admin-automatizaciones-responsive.png) | Responsive |

## Veredicto

**No declarar APTO VISUAL** — esperar validación visual humana.
