# OT-GROWTH-AUTOMATION-006 — WAIT en UI operativa

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-006 |
| Tipo | Implementación (UI operativa) |
| Fecha | 2026-09-07 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| ADR | [ADR-011](../../architecture/ADR-011.md) |
| Entrada | [AUTOMATION-005](../OT-GROWTH-AUTOMATION-005/README.md) · UI [004](../OT-GROWTH-AUTOMATION-004/README.md) / [004A](../OT-GROWTH-AUTOMATION-004A/README.md) |
| Criterio APTO VISUAL | Validación humana (no automático) |

---

## REUTILIZÓ

| Pieza | Origen |
| --- | --- |
| Catálogo `Trigger → Condición* → Acción+ → (Wait → Acción+)?` | AUTOMATION-005 (`catalog.ts`) |
| `durationMs` + tope 30 días | `AUTOMATION_WAIT_MAX_DURATION_MS` |
| Runner / `schedule` / `GrowthAutomationResume` | AUTOMATION-005 (`wait.ts` + runtime) |
| Versionado inmutable + borrador | AUTOMATION-002 |
| Permisos `growth.automations.view` / `manage` | AUTOMATION-004 |
| Flujo visual 1 → 2 → 3 | AUTOMATION-004A |
| Acciones sales-ops | Catálogo cerrado existente |

**No** se creó segundo runner, scheduler, Event Bus ni canvas.

## CAMBIÓ

| Área | Cambio |
| --- | --- |
| Formulario | Campos `waitEnabled` / cantidad / unidad / acción posterior → pasos `wait` + acción |
| Editor `/admin/automatizaciones` | Tras «Hacer esto»: *Después, esperar* → bloque Esperar → *Después, hacer esto* |
| Resumen | Prosa natural antes de activar (`automationNaturalProse`) |
| Listado | «Qué hace» menciona la espera cuando aplica |
| Unidades UI | minutos / horas / días (sin milisegundos ni `resumeKey`) |

## FLUJO VISIBLE

1 · Cuando pase esto  
↓  
2 · Si se cumple esto (opcional)  
↓  
3 · Hacer esto  
↓ *(si «Después, esperar»)*  
4 · Esperar [cantidad] [minutos/horas/días]  
↓  
5 · Después, hacer esto  

Ejemplo de resumen:

> Cuando se cree una oportunidad, definir qué hacer ahora.  
> Después, esperar 2 días y registrar seguimiento.

## VALIDACIONES

- Cantidad entero ≥ 1
- Unidad: minutos / horas / días
- Tope contractual: 30 días
- Si hay espera, acción posterior obligatoria
- Contrato server-side: `validateAutomationSteps` (005)
- Activa inmutable; editar abre borrador
- Aislamiento por Espacio

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-automation-006.test.ts
npx tsx --test tests/baseline/growth-automation-002.test.ts tests/baseline/growth-automation-003.test.ts tests/baseline/growth-automation-004.test.ts tests/baseline/growth-automation-005.test.ts
npx tsc --noEmit
# con npm run dev:
npx tsx --env-file=.env scripts/capture-growth-automation-006.ts
```

Cobertura 006: UI → guardar → publicar → evento → 1ª acción → WAIT persistido → vencimiento → 2ª acción; validación de espera; borrador; aislamiento tenant; sin jerga técnica en UI; regresión 002–005.

## CAPTURAS

| # | Archivo | Contenido |
| --- | --- | --- |
| 1 | [`admin-automatizaciones-create-wait.png`](./admin-automatizaciones-create-wait.png) | Crear con WAIT |
| 2 | [`admin-automatizaciones-review-wait.png`](./admin-automatizaciones-review-wait.png) | Resumen antes de activar |
| 3 | [`admin-automatizaciones-active-wait.png`](./admin-automatizaciones-active-wait.png) | Automatización activa |
| 4 | [`admin-automatizaciones-responsive-wait.png`](./admin-automatizaciones-responsive-wait.png) | Responsive |

## LÍMITES

| No en esta OT |
| --- |
| Canvas / drag & drop / IA |
| Email / WhatsApp |
| Historial de ejecuciones / métricas |
| Nuevas acciones de negocio |
| Segundo runner / scheduler / Event Bus |
| Cambios al Admin Shell |

---

**No declarar APTO VISUAL** — esperar validación humana.  
**No abrir siguiente OT.**
