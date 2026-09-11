# OT-GROWTH-CORE-007A — Ajuste UX Personas (pre-cierre)

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-007A |
| Tipo | Ajuste UX (superficie) |
| Fecha | 2026-09-05 |
| Estado | **CERRADA · APTO VISUAL** |
| Predecesora | [OT-GROWTH-CORE-007](../OT-GROWTH-CORE-007/README.md) · **CERRADA · APTO VISUAL** |
| Siguiente | [OT-GROWTH-CORE-007B](../OT-GROWTH-CORE-007B/README.md) — **CERRADA · APTO VISUAL** |
| Cierre V1 | [OT-GROWTH-CORE-CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md) |
| Criterio APTO | Navegación + shell + superficie Personas alineados; capturas revisadas por humano |

---

## Objetivo

Ajuste UX **antes del cierre** de Personas: navegación de primer nivel, diferenciación Growth OS / Espacio, y superficie visual alineada al patrón aprobado — **sin** tocar Growth Core, datos, APIs, seguridad, aislamiento, ingestión ni modelos.

## Alcance

| Cambio | Detalle |
| --- | --- |
| Nav | Personas sale de Formularios → primer nivel del sidebar (junto a Inicio) |
| Shell | Clarificar **Growth OS = producto** / **Espacio activo** (identidad ADL u otro Site) |
| `/admin/personas` | Fondo neutro, cards blancas, bordes suaves, más presencia |
| Vacío | Lenguaje humano de llegada; filtros presentes pero no dominantes |
| Capturas | Listado vacío · listado con datos · ficha Persona |

## Fuera de alcance

- Growth Core / stores / ingest / modelos `growth_*`
- Módulos de navegación que aún no existen
- Métricas, oportunidades inventadas, nuevas funcionalidades
- Declarar APTO sin revisión humana
- `/platform`, branding packs, UX-SHELL-003B

## Entrega

| Pieza | Rol |
| --- | --- |
| `src/lib/admin/nav-domains.ts` | Personas en zona home (primer nivel) |
| `AdminSidebar` / `AdminTopBar` | Producto vs Espacio activo |
| `PersonasListClient` / `PersonaDetailClient` | Superficie visual |
| `src/lib/growth/labels.ts` | Copy vacío humano |
| Capturas en [OT-GROWTH-CORE-007](../OT-GROWTH-CORE-007/) | Evidencia visual |

## Capturas (validación visual obligatoria)

| Archivo | Contenido |
| --- | --- |
| [`admin-personas-empty.png`](../OT-GROWTH-CORE-007/admin-personas-empty.png) | Listado vacío (estado real) |
| [`admin-personas-list.png`](../OT-GROWTH-CORE-007/admin-personas-list.png) | Listado con datos |
| [`admin-persona-detail.png`](../OT-GROWTH-CORE-007/admin-persona-detail.png) | Ficha Persona |

```bash
# con `npm run dev` en marcha (preferir Espacio ADL)
npx tsx --env-file=.env scripts/capture-growth-core-007.ts
```

## Criterios

- [x] Personas en primer nivel del sidebar (fuera de Formularios)
- [x] Growth OS = producto · Espacio activo diferenciado
- [x] Superficie Personas: cards blancas, jerarquía clara, más presencia
- [x] Vacío con lenguaje humano; filtros no dominan
- [x] Sin inventar datos / métricas / módulos
- [x] Capturas regeneradas
- [x] **Validación visual humana** (aprobada 2026-09-05)

## Veredicto

**CERRADA · APTO VISUAL** — Personas en primer nivel; superficie alineada. Cierre de cadena en [CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md).
