# OT-SEM-PORTAL-006 — Conversión, Gobernanza CMS y Correcciones Críticas (P0)

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-PORTAL-006 |
| Versión | 2.4.0 |
| Prioridad | Crítica |
| Estado | Completada |

## Objetivo

Cerrar hallazgos P0 de UX-AUDIT-001 y completar el flujo de conversión del Portal SEM. La Home queda gobernada por el Page Builder y preparada para OT-SEM-PORTAL-007 (Footer Premium).

## Parte A — Correcciones P0

| # | Hallazgo | Solución |
| --- | --- | --- |
| 1 | Orden fijo en `PortalHome` | `PortalBlockSection` itera `cms_pages.blocks` por `order` |
| 2 | `fetchTeam()` inline | Bloque `teachers` → `TeachersSection` → `resolveBlockContent` |
| 3 | Header 1024–1279 px | Nav visible desde `lg`; flex-wrap; mobile drawer alineado |
| 4 | Timeline eventos CSS | Clases unificadas `eco-events-timeline__*` |
| 5 | Textos hardcodeados | Empty/error/CTA en `DEFAULT_SETTINGS`; `portalCopy` en `cms_config` |

## Parte B — Conversión

| Bloque CMS | Componente | Descripción |
| --- | --- | --- |
| `admission_process` | `AdmissionProcessSection` | 4 pasos: timeline horizontal/vertical |
| `scholarships` | `ScholarshipsSection` | Becas, descuentos, convenios, beneficios |
| `cta` | `CtaBlockSection` | CTA principal postulación + asesor |
| `quick_contact` | `QuickContactSection` | WhatsApp, email, teléfono, horario, dirección desde `cms_config` |
| `faq` | `FaqSection` | Acordeón administrable |
| `alliance` | `AllianceSection` | Alianza institucional CMS |

## Arquitectura

```text
PortalHome
  → sortedVisibleBlocks(cms_pages.blocks)
  → PortalBlockSection (por tipo)
  → Content Engine / Page Builder settings
  → MongoDB
```

## Accesibilidad y SEO

- `heroImageAlt` en bloque hero
- `focusRing` en footer y CTAs
- `<main>` en `PortalShell`
- JSON-LD: Organization + FAQPage en `PortalStructuredData`

## Componentes clave

- `PortalBlockSection.tsx` — orquestador por bloque
- `src/components/portal/blocks/*` — secciones server individuales
- `PortalBlockSkeleton.tsx` — loading por tipo
- `seo/PortalStructuredData.tsx` — schema.org

## Validación

```bash
npm run lint
npm run build
```

## Relacionado

- [UX-AUDIT-001](../audits/UX-AUDIT-001.md)
- [OT-SEM-PORTAL-005](./OT-SEM-PORTAL-005.md)
- [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md)
