# OT-GROWTH-CORE-006 — Backfill histórico

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-006 |
| Tipo | Implementación |
| Fecha | 2026-09-05 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-010](../../architecture/ADR-010.md) §4 · §4.3 |
| Predecesora | [OT-GROWTH-CORE-005](../OT-GROWTH-CORE-005/README.md) · **CERRADA · APTO** |
| Siguiente | [OT-GROWTH-CORE-007](../OT-GROWTH-CORE-007/README.md) · **CERRADA · APTO VISUAL** · cierre V1 [CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md) |
| Criterio APTO | Históricos V1 proyectan con el mismo contrato de CORE-005; idempotente; fail-soft; resumen final; sin mutar fuentes ni UI |

---

## Objetivo

Proyectar los registros históricos compatibles de las fuentes existentes hacia Growth Core **usando exactamente el mismo contrato de ingestión** de CORE-005 (`projectGrowthFromSignal`).

## Alcance

- Backfill tenant-scoped de `portal_interesados` y `experience_form_submissions`
- Reutilizar `projectGrowthFromSignal` / Safe, dedupe, `ingestKey`, Persona, Origen, Oportunidad, Actividad
- Solo fuentes V1 (ADR-010): admisión → `conversion`; contact / information_request → `inquiry`; event_registration → `registration`
- Lotes / paginado; reejecutable e idempotente; fail-soft por registro
- Resumen: procesados / creados / ya existentes / conflictos / omitidos / errores
- Tests focalizados + baseline + typecheck + `npx next build`

## Fuera de alcance

- UI → CORE-007
- Campañas, inbox, automatizaciones, IA
- Mutar fuentes históricas
- Colecciones `crm_*`
- Tocar `/platform` ni deuda de branding
- Abrir CORE-007 aquí

## Contrato (ADR-010 §4)

| Fuente | Destino Growth |
| --- | --- |
| `portal_interesados` | Persona · Origen `admission` · Oportunidad `conversion` · Actividad `application_received` (+ handoff si aplica) |
| destination `contact` / `information_request` | Persona · Origen `form` · Oportunidad `inquiry` · `form_submitted` |
| destination `event_registration` | Persona · Origen `event` · Oportunidad `registration` · `form_submitted` |
| attendance / absence / testimonial / subscription | Omitidos en V1 |

Mismo camino que live ingest: `toGrowth*Input` → `projectGrowthFromSignalSafe`. No hay segundo transformador.

---

## Entrega

### Qué reutilizó

- `projectGrowthFromSignal` / Safe (CORE-005)
- Persona / Oportunidad / Actividad / Event Bus / Workflow (CORE-002–005)
- Mapeo unificado `ingest-map` (también cableado en live-ingest)

### Qué cambió

| Pieza | Rol |
| --- | --- |
| `src/core/growth/ingest-map.ts` | Mapeo fuente → `GrowthIngestInput` (live + backfill) |
| `src/core/growth/backfill.ts` | Orquestación por lotes + resumen + harness memoria |
| `src/core/growth/backfill-mongo.ts` | Reader Mongo (solo lectura, paginado por `_id`) |
| `src/lib/growth/backfill.ts` | Runner producción (`runMongoGrowthBackfill`) |
| `scripts/backfill-growth-core.ts` | CLI tenant-scoped |
| `scripts/_stub-server-only.cjs` | Stub para CLI (Workflow/Event Bus) |
| `tests/baseline/growth-backfill.test.ts` | Validaciones de la OT |

**No tocó:** payload Aprende Hoy, `identity_users`, `content_people`, UI, `/platform`, fuentes históricas (solo lectura).

### Uso

```bash
npm run backfill:growth -- <tenantId>
npm run backfill:growth -- <tenantId> --batch=50
npm run backfill:growth -- <tenantId> --dry-run
```

### Pruebas

```bash
npx tsx --test tests/baseline/growth-backfill.test.ts
npm run test:baseline
npx tsc --noEmit
npx next build
```

| Caso | Resultado |
| --- | --- |
| Reejecución sin duplicados | OK |
| Aislamiento entre Espacios | OK |
| identity_conflict en resumen, lote continúa | OK |
| Registros fuera de V1 omitidos | OK |
| Error parcial sin abortar | OK |
| Compatible con datos CORE-005 (idempotent_hit) | OK |
| Paginación por batchSize | OK |
| Baseline + typecheck + `npx next build` | OK |

Nota: `npm run build` (script con `check:branding`) puede fallar por colores fuera de tokens en `src/app/platform/page.tsx` (deuda ajena). No se tocó `/platform`. El compile Next (`npx next build`) es el gate de esta OT.

### Riesgos / deudas

- UI admin → CORE-007
- Branding gate de `/platform` preexistente
- CLI necesita stub `server-only` (mismo cableado Workflow/Event Bus que live ingest)

## Criterios de aceptación

- [x] Mismo contrato que CORE-005 (`projectGrowthFromSignal`)
- [x] Solo fuentes V1; resto omitido
- [x] Tenant-scoped, reejecutable, idempotente, por lotes
- [x] Fail-soft por registro + resumen final
- [x] Fuentes históricas intactas (solo lectura)
- [x] Sin UI; sin abrir CORE-007 aquí
- [x] Baseline + typecheck + build

## Restricciones

- No reabrir SAAS, Productization, branding, Shell, Platform Admin
- No colecciones `crm_*`
- No cambiar adapter / payload Aprende Hoy
- No abrir CORE-007 hasta cerrar esta

---

## Veredicto

**CERRADA · APTO** — backfill histórico listo. Abrir **OT-GROWTH-CORE-007** solo tras este cierre.
