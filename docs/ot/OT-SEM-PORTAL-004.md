# OT-SEM-PORTAL-004 — Sección de Confianza Institucional

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-PORTAL-004 |
| Versión | 2.2.0 |
| Prioridad | Muy Alta |
| Estado | Completada |

## Objetivo

Construir el bloque institucional de confianza que responde: **¿Por qué estudiar en este seminario?** Transmite confianza, no venta agresiva.

## Arquitectura

```text
PortalHome → InstitutionSection → Content Engine / bloques CMS
```

Sin motores ni colecciones nuevas. Highlights vía `presentation.settings.highlights`; modalidad vía bloque `modality`.

## Secciones implementadas

| # | Sección | Bloque CMS | Fuente de datos |
| --- | --- | --- | --- |
| 1 | ¿Por qué estudiar? | `presentation` | title, subtitle, description, `highlights[]` |
| 2 | Modalidad | `modality` | copy + `items[]` + imagen Media Library |
| 3 | Vida estudiantil | `gallery` | Content Engine → `academy_gallery` |
| 4 | Estadísticas | `stats` | `items[]` inline en bloque |
| 5 | Testimonios | `testimonials` | Content Engine → `academy_testimonials` |
| 6 | Versículo | `verse` | text, reference, background, imagen opcional |

## Componentes

| Archivo | Rol |
| --- | --- |
| `InstitutionSection.tsx` | Orquestador server (Content Engine + settings) |
| `institution/InstitutionSectionContent.tsx` | UI de las 6 subsecciones |
| `InstitutionSectionSkeleton.tsx` | Loading skeleton |
| `cards/TestimonialCard.tsx` | Tarjeta testimonio premium |
| `institution/GalleryImage.tsx` | Imagen galería segura |
| `institution/TestimonialAvatar.tsx` | Avatar con fallback |
| `blocks/ModalitySection.tsx` | Page Builder → portal |
| `blocks/GalleryGrid.tsx` | Page Builder → portal |
| `blocks/TestimonialsGrid.tsx` | Page Builder → portal |

## Estados

- **Loading:** `InstitutionSectionSkeleton` + `CardGridSkeleton`
- **Vacío:** `PortalEmptyState` por subsección
- **Error:** mensaje elegante sin romper layout

## Validación

```bash
npm run lint
npm run build
```

## Relacionado

- [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md)
- [OT-SEM-PORTAL-003](./OT-SEM-PORTAL-003.md)
