# OT-SEM-PORTAL-003 — Programas Premium Dinámicos

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-PORTAL-003 |
| Versión | 2.1.0 |
| Prioridad | Muy Alta |
| Estado | Completada |
| Dependencias | OT-SEM-PORTAL-001, OT-SEM-PORTAL-002, OT-SEM-CMS-004, OT-SEM-CMS-005 |

## Objetivo

Construir la sección **Programas Destacados** con nivel visual premium, alimentada exclusivamente por el Content Engine y el CMS. Sin contenido hardcodeado. Referencia para futuras tarjetas del ecosistema AprendeHoy.

## Arquitectura

```
PortalHome
  ↓ Suspense
ProgramsSection
  ↓ resolveBlockContent()
Content Engine
  ↓
academy_programs
  ↓
ProgramCard Premium
```

No se crearon motores ni colecciones nuevas.

## Integración CMS

El bloque `programs` del Page Builder almacena solo la consulta en `settings.query`:

```json
{
  "collection": "academy_programs",
  "featured": true,
  "limit": 3,
  "sort": { "field": "order", "direction": "asc" }
}
```

Copy de sección (`overline`, `title`, `description`, CTAs de sección) también vive en `settings` del bloque.

## ProgramCard Premium

| Elemento | Fuente CMS |
| --- | --- |
| Imagen | `image` / `featuredMediaId` (Content Engine) |
| Badge | `badge` o `programStatus` o `featured` |
| Nombre / descripción | `title`, `summary` |
| Modalidad / duración | `modality`, `duration` |
| Certificación | `certification` |
| Precio | `fees` si `showPrice` |
| Fecha inicio | `startDate` |
| CTA principal | `ctaPrimaryLabel` → default «Ver programa» |
| CTA secundario | `ctaSecondaryLabel` + `ctaSecondaryHref` |
| Enlace | `/programas/{slug}` |

Placeholders elegantes vía `ProgramCardMedia` (`onError` + mesh institucional).

## Estados

| Estado | Comportamiento |
| --- | --- |
| Sin programas | `PortalEmptyState` institucional |
| Error | Mensaje elegante sin romper layout |
| Loading | `ProgramsSectionSkeleton` + `CardGridSkeleton` |

## Archivos

| Archivo | Rol |
| --- | --- |
| `src/components/portal/ProgramsSection.tsx` | Server: Content Engine + render |
| `src/components/portal/ProgramsSectionContent.tsx` | Presentacional reutilizable |
| `src/components/portal/ProgramsSectionSkeleton.tsx` | Loading skeleton |
| `src/components/portal/cards/ProgramCard.tsx` | Tarjeta premium |
| `src/components/portal/cards/ProgramCardMedia.tsx` | Imagen segura + placeholder |
| `src/components/blocks/ProgramsGrid.tsx` | Page Builder → portal premium |
| `src/types/content.ts` | Campos extendidos `ProgramItem` |
| `src/lib/content/mappers.ts` | `mapToProgramItem` ampliado |

## Responsive

- Desktop (lg+): 3 columnas
- Tablet (sm): 2 columnas
- Mobile: 1 columna
- Alturas homogéneas (`h-full`, flex column)

## Validación

```bash
npm run lint
npm run build
```

## Relacionado

- [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md)
- [CONTENT-ENGINE](../cms/CONTENT-ENGINE.md)
