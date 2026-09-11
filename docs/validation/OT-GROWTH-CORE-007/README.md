# OT-GROWTH-CORE-007 — UI mínima de Personas y Oportunidades

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-007 |
| Tipo | Implementación |
| Fecha | 2026-09-05 |
| Estado | **CERRADA · APTO VISUAL** |
| ADR | [ADR-010](../../architecture/ADR-010.md) §5 · §1 |
| Predecesora | [OT-GROWTH-CORE-006](../OT-GROWTH-CORE-006/README.md) · **CERRADA · APTO** |
| Ajuste UX | [007A](../OT-GROWTH-CORE-007A/README.md) · [007B](../OT-GROWTH-CORE-007B/README.md) — **CERRADAS · APTO VISUAL** |
| Cierre V1 | [OT-GROWTH-CORE-CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md) · **Growth Core V1 CERRADO · APTO** |
| Criterio APTO | Listado + ficha en `/admin` del Espacio; datos solo de `growth_*`; lenguaje humano; aislamiento; capturas revisadas |

---

## Objetivo

Primera superficie visual de Growth Core en `/admin` para responder rápido:

**Quién es → De dónde llegó → Qué quiere → Qué ha pasado → Qué hacer ahora**

Sin crear otro CRM ni motores nuevos. Reutiliza Shell V2 + kit AEK.

## Alcance V1

- Navegación `/admin/personas`
- Listado de Personas del Espacio activo
- Búsqueda por nombre / correo / teléfono
- Filtros mínimos por tipo / estado de Oportunidad
- Ficha de Persona: datos, origen, Oportunidades, timeline, qué hacer ahora
- Detalle de Oportunidad embebido en la ficha (`?oportunidad=`)
- Estados y textos humanos

## Fuera de alcance

Edición masiva, merge, campañas, inbox, automatizaciones, IA, analítica, nuevos estados, configuración de tipos, `/platform`, branding, UX-SHELL-003B.

## Lenguaje visible

Persona · Oportunidad · De dónde llegó · Situación · Qué ha pasado · Qué hacer ahora · Ver detalle · Sin próxima acción

Evitar: CRM, pipeline, lead, trigger, activity log, tenant, ingest, Workflow, Event Bus, identity_conflict.

## Entrega

| Pieza | Rol |
| --- | --- |
| `src/lib/growth/labels.ts` | Textos humanos |
| `src/lib/growth/persona-view.ts` | Proyección pura → vista |
| `src/lib/growth/personas-read.ts` | Lectura tenant-scoped (stores Core + listado) |
| `src/components/admin/growth/*` | Listado + ficha (kit AEK) |
| `src/app/admin/personas/**` | Rutas `/admin` |
| Nav primer nivel → Personas | Shell V2 (`nav-domains`; ver 007A) |
| `tests/baseline/growth-personas-ui.test.ts` | Validaciones focalizadas + aislamiento ADL/SEM |

**No tocó:** captura/admisión, Aprende Hoy, `identity_users`, `content_people`, `/platform`, campos nuevos en `growth_*`.

## Pruebas

```bash
npx tsx --test tests/baseline/growth-personas-ui.test.ts
npm run test:baseline
npx tsc --noEmit
npx next build
```

**Resultado (2026-09-05):** focalizadas 15/15 · baseline 227/227 · `tsc --noEmit` OK · `npx next build` OK.

## Capturas (validación visual)

| Archivo | Ruta |
| --- | --- |
| [`admin-personas-list.png`](./admin-personas-list.png) | `/admin/personas` |
| [`admin-personas-empty.png`](./admin-personas-empty.png) | estado vacío |
| [`admin-persona-detail.png`](./admin-persona-detail.png) | `/admin/personas/[id]` |
| [`admin-oportunidad-detail.png`](./admin-oportunidad-detail.png) | ficha con `?oportunidad=` |

```bash
# con `npm run dev` en marcha (sesión Espacio ADL por defecto)
npx tsx --env-file=.env scripts/capture-growth-core-007.ts
```

Validación visual humana **aprobada** (2026-09-05). Cierre de cadena: [OT-GROWTH-CORE-CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md).

## Criterios de aceptación

- [x] Navegación `/admin/personas` en Shell del Espacio
- [x] Listado + búsqueda + filtros mínimos
- [x] Ficha con origen, Oportunidades, timeline, qué hacer ahora
- [x] Oportunidad: tipo, estado, origen, Persona, qué hacer ahora, historial relacionado
- [x] Solo datos `growth_personas` / `growth_oportunidades` / `growth_actividades`
- [x] Sin campos nuevos solo para UI
- [x] Lenguaje humano; sin jerga prohibida
- [x] Aislamiento por `tenantId` (Espacio activo; prueba ADL ≠ SEM con ID conocido)
- [x] Tests + baseline + typecheck + `npx next build`
- [x] Capturas reales generadas
- [x] Validación visual de capturas (revisión humana aprobada)

## Restricciones

- No reabrir SAAS, Productization, branding, Shell, Platform Admin
- No colecciones `crm_*`
- No UI en `/platform`
- No abrir CORE-008 desde esta OT

---

## Veredicto

**CERRADA · APTO VISUAL** — listado + ficha Persona + detalle Oportunidad aprobados. Personas es la primera superficie visual de Growth Core y función principal del Espacio. Growth Core V1 cerrado en [CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md).
