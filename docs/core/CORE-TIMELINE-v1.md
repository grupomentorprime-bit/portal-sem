# CORE TIMELINE v1.0

**Estado:** LOCKED

Módulo Experience Timeline oficial de AprendeHoy. Representa procesos, rutas, cronologías y etapas de forma visual — no es un timeline exclusivo de admisión.

## Principio

Un único Timeline para toda la plataforma. No se crean timelines distintos para Programas, Admisión o Eventos.

## Casos de uso

| Contexto | Ejemplo |
| --- | --- |
| SEM | Proceso de admisión, ruta formativa, jornada presencial |
| Universidad | Ruta del estudiante, carrera profesional |
| OTEC | Inscripción, certificación |
| Empresa | Implementación, onboarding |
| Landing | Paso 1 → Paso 2 → Paso 3 |

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalTimeline` | Sección con header + track de etapas |
| `PortalTimelineItem` | Nodo, título, descripción, fecha, estado |
| `PortalTimelineHeader` | Eyebrow, título, descripción |
| `PortalTimelineConnector` | Segmento de línea entre etapas |
| `PortalTimelineSkeleton` | Loading idéntico al timeline |

Ruta: `src/components/portal/experience/timeline/`

## Contrato CMS — bloque `timeline`

### Sección

| Campo | Tipo |
| --- | --- |
| `overline` | string |
| `title` | string |
| `description` | string |
| `layout` | `auto` \| `horizontal` \| `vertical` |
| `variant` | `process` \| `chronology` \| `calendar` \| `route` \| `steps` \| `roadmap` |
| `emptyTitle` | string |
| `emptyDescription` | string |

### Cada etapa (`items[]`)

| Campo | Tipo |
| --- | --- |
| `title` | string (requerido) |
| `description` | string |
| `icon` | string |
| `step` | number |
| `order` | number |
| `status` | `pending` \| `active` \| `completed` \| `upcoming` |
| `color` | string → `--timeline-accent` |
| `date` | string |
| `visible` | boolean |
| `url` | string |

## Layout responsive (`layout: auto`)

| Breakpoint | Comportamiento |
| --- | --- |
| Mobile (&lt;768px) | Vertical, scroll natural |
| Tablet (768–1023px) | Grid 2 columnas |
| Notebook (1024–1279px) | Grid 3 columnas |
| Desktop (≥1280px) | Horizontal con conectores |

## Estados de etapa

| Estado | Visual |
| --- | --- |
| `pending` | Nodo neutro |
| `active` | Nodo acento, `aria-current="step"` |
| `completed` | Nodo success |
| `upcoming` | Nodo warning |

## Animaciones (LOCKED)

- Entrada sección: fade-up (`animate-slide-up`)
- Línea: draw (`portal-timeline-line-draw`)
- Nodo: scale (`portal-timeline-node-scale`)
- Hover: glow en marcador
- `prefers-reduced-motion`: sin animaciones

## Tokens

Solo design tokens (`--timeline-accent`, `--primary`, `--success`, `--warning`, etc.). Sin `--sem-*` ni hex hardcodeados.

## Archivos Core (no tocar sin OT)

| Área | Archivo |
| --- | --- |
| Tipos | `src/types/timeline.ts` |
| Estilos | `src/styles/timeline.css` |
| Bloque CMS | `src/components/portal/blocks/TimelineBlockSection.tsx` |
| Extractor | `src/components/portal/experience/timeline/extract.ts` |

## Deprecaciones

| Componente | Reemplazo |
| --- | --- |
| `AdmissionProcessSection` | `PortalTimeline` |
| Bloque `admission_process` | Bloque `timeline` |
| `.admission-process` CSS | `.portal-timeline` |

## Experience Modules — roadmap

```
✅ Hero (LOCKED)
✅ Catalog Card (LOCKED)
✅ Feature Grid v1.0
✅ Timeline v1.0 (este documento)
⏳ News Grid (OT-PORTAL-005)
⏳ Agenda (OT-PORTAL-006)
⏳ Teachers (OT-PORTAL-007)
⏳ CTA Premium (OT-PORTAL-008)
```

## OTs

- OT-PORTAL-004 — Timeline v1.0 (este documento)
