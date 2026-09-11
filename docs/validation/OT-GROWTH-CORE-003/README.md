# OT-GROWTH-CORE-003 — Oportunidad + Workflow + próxima acción

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-003 |
| Tipo | Implementación |
| Fecha | 2026-09-04 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-010](../../architecture/ADR-010.md) §1.3 · §1.5 · §3 · §5 |
| Predecesora | [OT-GROWTH-CORE-002](../OT-GROWTH-CORE-002/README.md) · **CERRADA · APTO** |
| Siguiente | [OT-GROWTH-CORE-004](../OT-GROWTH-CORE-004/README.md) · **CERRADA · APTO** |
| Criterio APTO | `growth_oportunidades` SSOT con Workflow `growth.opportunity`, `nextAction` embebido y tipos base; sin segundo motor ni UI |

---

## Objetivo

Segunda capa del núcleo: persistir **Oportunidad** genérica con estados vía Workflow existente, `nextAction` embebido y `growth_space_config` (defaults de plataforma). Sin Actividad completa, sin ingestión cableada, sin UI.

## Alcance

- Colección `growth_oportunidades` + tipos/helpers
- Workflow de plataforma `growth.opportunity` (mismo motor ADR-005)
- Estados: `open → active → won | lost | handed_off | archived`
- Tipos base: `inquiry`, `registration`, `conversion`
- `nextAction` embebido (crear / actualizar / cerrar = `null`)
- `growth_space_config` por `tenantId` (defaults si ausente)
- Índices ADR-010 §5 + migración `014-growth-oportunidades`
- Tests focalizados + baseline + typecheck + build

## Fuera de alcance

- Actividad completa + tipos Event Bus → CORE-004
- Ingestión admisión/forms → CORE-005
- Backfill → CORE-006
- UI `/admin` → CORE-007
- Motor de tareas, campañas, inbox, IA

## Contrato (ADR-010)

### Oportunidad

`tenantId` + `personaId` obligatorios. Una Persona → N Oportunidades. Reuso si misma `typeKey` + asunto y status no final.

### Workflow

Definición `growth.opportunity` en `SYSTEM_WORKFLOW_TEMPLATES`. `status` espeja `workflow_instances.currentState`. Sin estados educativos hardcodeados.

### `handed_off`

Salida del proceso académico hacia sistema externo (p. ej. Aprende Hoy). Conserva Persona, Oportunidad e historial; no borra.

### Próxima acción

Campo embebido. ADR: `summary`, `dueAt?`, `assigneeUserId?`, `kind`, `setAt`. OT brief: what→`summary`, assigneeId→`assigneeUserId`; cerrar limpia el campo (sin `status` propio ni cola de tareas).

---

## Entrega

### Qué reutilizó

- Workflow Engine existente (`SYSTEM_WORKFLOW_TEMPLATES`, `ensureSystemDefinitions`, instancias/historial)
- Persona store / upsert de CORE-002 (seed en tests)
- Patrón store inyectable + memoria + Mongo + `ensureIndex`
- `buildGrowthOrigin` / `buildGrowthIngestKey`
- Sin tocar admisión, forms, adapter Aprende Hoy

### Qué cambió

| Pieza | Rol |
| --- | --- |
| `src/core/growth/opportunity-*` | Definición, port Workflow, store, open/transition/nextAction |
| `src/core/growth/space-config.ts` | Defaults inquiry/registration/conversion |
| `src/core/workflow/definitions/defaults.ts` | Template `growth.opportunity` |
| `src/lib/workflow/integration.ts` | Mapeo entityType `growth.opportunity` |
| `014-growth-oportunidades` | Índices oportunidades + space_config + actividades |
| `tests/baseline/growth-oportunidades.test.ts` | Validaciones de la OT |

**No tocó:** `identity_users`, `content_people`, `portal_interesados`, Experience Forms, UI, adapter Aprende Hoy.

### Pruebas

```bash
npx tsx --test tests/baseline/growth-oportunidades.test.ts
npm run test:baseline
npx tsc --noEmit
npx next build
```

| Caso | Resultado |
| --- | --- |
| Misma Persona → N Oportunidades | OK |
| Reuso typeKey+asunto; nueva si final | OK |
| Tenants aislados | OK |
| Transición inválida rechazada | OK |
| `handed_off` preserva historial | OK |
| nextAction create/update/clear | OK |
| Tipos base; rechaza `matricula` | OK |
| Admisión/forms sin referencias Growth | OK |
| Template en SYSTEM_WORKFLOW_TEMPLATES | OK |
| Baseline completo | OK |
| `tsc --noEmit` | OK |
| `next build` | OK |

Nota: `npm run build` (script con `check:branding`) falla por colores fuera de tokens en `src/app/platform/page.tsx` (UX Shell / Platform Admin — **fuera de esta OT**). El compile Next de CORE-003 pasa.

### Riesgos / deudas

- Port de Workflow en memoria para tests; adapter de producción al engine real se cablea con ingestión (CORE-005) / superficie admin.
- Stub de Actividad para `opportunity_*` / `next_action_set` — modelo + Event Bus en CORE-004.
- `growth_space_config` solo defaults de plataforma; relabel/extensión por Espacio sin UI aún.
- Sin endpoints ni UI en esta OT.
- Branding gate de `/platform` preexistente (no introducido aquí).

## Criterios de aceptación

- [x] `growth_oportunidades` SSOT según ADR-010 §1.3
- [x] Workflow `growth.opportunity` reutilizado (no segundo motor)
- [x] Estados mínimos + `handed_off` sin borrar
- [x] Tipos base inquiry / registration / conversion
- [x] `nextAction` embebido sin motor de tareas
- [x] Aislamiento por `tenantId`
- [x] Sin impacto en admisión/forms
- [x] Sin UI
- [x] Baseline + typecheck + build

## Restricciones

- No reabrir SAAS, Productization, branding, Shell, Platform Admin ni Identity Master ≠ Espacio
- No colecciones `crm_*`
- No cambiar payload / adapter Aprende Hoy
- No abrir CORE-004 hasta cerrar esta

---

## Veredicto

**CERRADA · APTO** — Oportunidad + Workflow + nextAction listos. Abrir **OT-GROWTH-CORE-004** solo tras este cierre.
