# OT-UX-HOME-002B — Oferta Académica Premium según Maqueta

| Atributo | Valor |
| --- | --- |
| OT | OT-UX-HOME-002B |
| Épica | EP-UX-HOME — Home Premium |
| Versión | 1.0.0 |
| Prioridad | Alta |
| Estado | Completada |
| Fecha cierre | 2026-06-30 |

## Objetivo

Rediseñar **solo** la sección Oferta Académica usando la Responsive Foundation, para que quede como el patrón visual aprobado: 3 cards horizontales premium inmediatamente después del Hero.

## Alcance

- `section-f`, `container-f`, `grid-f` en composición
- Header centrado con copy de maqueta
- Desktop: 3 columnas · Tablet: 2 columnas · Mobile: carrusel horizontal con snap
- Cards compactas: imagen 16:9, badge, título, descripción, metadata, precio y CTA
- Fondo gris claro institucional (`#f4f6f9`)

## Restricciones respetadas

- Hero, Core, CMS/API y módulos nuevos: **sin cambios**
- Solo composición y estilo de Oferta Académica

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/components/portal/programs/PortalProgramsSection.tsx` | Clases foundation (`section-f`, `container-f`, `grid-f`) |
| `src/components/portal/blocks/AcademicOfferBlockSection.tsx` | Merge de settings demo en Home |
| `src/lib/portal/institutional-demo.ts` | Copy maqueta + precios demo + `mergeHomeAcademicOfferSettings` |
| `src/lib/portal/program-image-fallbacks.ts` | Fallbacks a assets existentes en `/public/images` |
| `src/styles/home-premium-experience.css` | Bloque `[data-block="academic_offer"]` OT-UX-HOME-002B |

## Copy de maqueta (Home demo)

| Campo | Valor |
| --- | --- |
| Eyebrow | PROGRAMAS DESTACADOS |
| Título | Programas que transforman vidas |
| Descripción | Formación bíblica y ministerial con flexibilidad, excelencia académica y acompañamiento pastoral. |
| Link | Ver todos los programas → |

## Layout responsive

| Tier | Comportamiento |
| --- | --- |
| Mobile (&lt;768px) | Carrusel horizontal, `scroll-snap`, cards ~88vw |
| Tablet (768–991px) | Grid 2 columnas (`grid-f-md-2`) |
| Laptop+ (≥992px) | Grid 3 columnas (`grid-f-lg-3`) |

## Verificación

1. Abrir Home en `npm run dev`
2. Confirmar sección justo debajo del Hero
3. Revisar en 390px, 768px, 1366px y 1920px
4. Validar: compacta, horizontal, comercial, premium — sin tarjetas gigantes verticales

## Siguiente paso

Revisión de esta sección antes de OT-UX-HOME-002C — «¿Por qué estudiar?».
