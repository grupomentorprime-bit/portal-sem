# OT-GROWTH-CORE-007B — Cierre UX Personas

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-007B |
| Tipo | Ajuste UX (superficie) |
| Fecha | 2026-09-05 |
| Estado | **CERRADA · APTO VISUAL** |
| Predecesora | [OT-GROWTH-CORE-007](../OT-GROWTH-CORE-007/README.md) · [007A](../OT-GROWTH-CORE-007A/README.md) · **CERRADAS · APTO VISUAL** |
| Cierre V1 | [OT-GROWTH-CORE-CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md) |
| Criterio APTO | Jerarquía visual + encabezado + ficha; capturas revisadas por humano |

---

## Objetivo

Cerrar la superficie de Personas **sin** tocar lógica, datos, APIs, Growth Core, seguridad ni aislamiento.

## Alcance

| Cambio | Detalle |
| --- | --- |
| Nav | Personas permanece como navegación principal del Espacio (fuera de Formularios; 007A) |
| Listado | Filas Persona → Situación → Qué hacer ahora, solo datos existentes; filas compactadas; copy filtros «Todas las oportunidades» / «Todos los estados» |
| Encabezado | «Próxima acción» → **Qué hacer ahora** |
| Ficha | Arriba Persona + Qué hacer ahora; centro Oportunidades; abajo Qué ha pasado |
| Repetición | Menos eco visual entre acción, Oportunidad y timeline; el modelo sigue intacto |
| Capturas | Las 4 de CORE-007, regeneradas |

## Fuera de alcance

- Lógica, datos, APIs, Growth Core, seguridad, aislamiento
- `/platform`, UX-SHELL-003B, captación, Aprende Hoy, Workflow, Event Bus, colecciones
- Componentes o motores paralelos (reutiliza Shell V2 + AEK + tokens)
- CORE-008 u otros módulos posteriores

## Entrega

| Pieza | Rol |
| --- | --- |
| `src/lib/admin/nav-domains.ts` | Personas en primer nivel (sin cambio de IAM) |
| `src/lib/growth/labels.ts` | Encabezado «Qué hacer ahora» + Situación |
| `PersonasListClient` | Jerarquía de filas |
| `PersonaDetailClient` | Orden de ficha + menos repetición |
| Capturas en [OT-GROWTH-CORE-007](../OT-GROWTH-CORE-007/) | Evidencia visual |

## Capturas

| Archivo | Contenido |
| --- | --- |
| [`admin-personas-list.png`](../OT-GROWTH-CORE-007/admin-personas-list.png) | Listado |
| [`admin-personas-empty.png`](../OT-GROWTH-CORE-007/admin-personas-empty.png) | Estado vacío |
| [`admin-persona-detail.png`](../OT-GROWTH-CORE-007/admin-persona-detail.png) | Ficha |
| [`admin-oportunidad-detail.png`](../OT-GROWTH-CORE-007/admin-oportunidad-detail.png) | Ficha con `?oportunidad=` |

```bash
npx tsx --env-file=.env scripts/capture-growth-core-007.ts
```

## Criterios

- [x] Personas fuera de Formularios, como nav principal del Espacio
- [x] Filas Persona → Situación → Qué hacer ahora (compactadas para densidad)
- [x] Copy filtros: Todas las oportunidades / Todos los estados
- [x] Encabezado visible «Qué hacer ahora»
- [x] Ficha: Persona + Qué hacer ahora / Oportunidades / Qué ha pasado
- [x] Menos repetición visual sin quitar información del modelo
- [x] Shell V2 + AEK + tokens existentes
- [x] Capturas regeneradas
- [x] **Validación visual humana** (aprobada 2026-09-05)

## Veredicto

**CERRADA · APTO VISUAL** — jerarquía listado + ficha congeladas. CORE-007 y Growth Core V1 cerrados en [CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md).
