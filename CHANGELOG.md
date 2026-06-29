# Changelog — Portal SEM

Todos los cambios notables del proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## v2.0.0 — Portal Engine

### Added

- `src/core/portal/` — motor CMS-driven (registry, resolver, visibility, seo, events, layout)
- `PortalRenderer` — renderizado unificado de páginas públicas
- Block Registry con type, version, component, resolver
- Condiciones de visibilidad por bloque (`settings.conditions`)
- Eventos portal: `PageViewed`, `BlockRendered`, `CTAViewed`
- SEO consolidado vía `consolidatePageSeo()`
- Documentación [PORTAL-ENGINE.md](./docs/core/PORTAL-ENGINE.md), [ADR-007](./docs/architecture/ADR-007.md)

### Changed

- `PortalHome` — contenedor mínimo que delega a `PortalRenderer`
- `/[slug]` y `PortalCmsPage` — migrados a `PortalRenderer` (antes `ServerBlockRenderer`)
- `PortalStructuredData` — recibe JSON-LD consolidado del engine

### Removed

- `PortalHomeBlock.tsx` (lógica absorbida por engine + `PortalBlockSection`)
- `HomeJsonLd.tsx` (reemplazado por `consolidatePageSeo`)

---

## v2.4.0 — Conversión y Admisión

### Added

- `PortalHomeBlock` — router CMS-driven por tipo de bloque
- `TeachersSection` con `resolveBlockContent` → `academy_team`
- Bloques: `admission_process`, `scholarships`, `faq`, `quick_contact`, `alliance`
- Página `/admision`
- `contact.hours` en configuración institucional
- `HomeJsonLd` (Organization + FAQ schema.org)
- Empty states configurables por bloque
- Documentación [OT-SEM-PORTAL-006](./docs/ot/OT-SEM-PORTAL-006.md)

### Fixed (P0)

- Home ordenada por bloques CMS (sin orden fijo en código)
- Header nav visible 1024–1279px
- Timeline eventos: clases `eco-events-timeline__*` unificadas
- Eliminado `fetchTeam()` de PortalHome

### Changed

- Plantilla Home ampliada con bloques de conversión
- Hero defaults: `Postular ahora` → `/admision`
- CTA final siempre con defaults de conversión

---

## v2.4.0 — Conversión y Gobernanza CMS

### Added

- `PortalBlockSection` — Home gobernada 100 % por orden de bloques CMS
- Bloques de conversión: `admission_process`, `scholarships`, `faq`, `quick_contact`, `alliance`
- `TeachersSection` vía Content Engine (elimina `fetchTeam` en Home)
- `PortalStructuredData` — Organization + FAQPage schema
- `portalCopy` en `cms_config` para textos de footer
- CSS admisión: `.admission-process` timeline responsive

### Changed

- `PortalHome` renderiza bloques en orden Page Builder (sin secciones fijas)
- Empty states, errores y CTAs de cards desde settings CMS
- Header nav visible desde 1024 px con flex-wrap
- Hero: `heroImageAlt` configurable
- Footer: focus visible + labels desde CMS

### Fixed

- Timeline eventos: nomenclatura CSS `eco-events-timeline__*`
- Hallazgos P0 de UX-AUDIT-001

---

## v2.3.0 — Ecosistema Académico

### Added

- `AcademicEcosystemSection` con 4 subsecciones: Noticias, Eventos, Biblioteca, Recursos destacados
- Bloque Page Builder `resources` para contenido estratégico configurable
- `NewsCard`, `EventCard`, `LibraryCard`, `ResourceCard`, `CardMedia` premium
- Helpers `splitNewsItems`, `extractResources`
- Timeline de eventos (desktop) y tarjetas apiladas (mobile)
- Layout noticias 1 destacada + 3 secundarias
- CSS ecosystem en `globals.css` (`.eco-news-layout`, `.eco-events-timeline`, etc.)
- Documentación [OT-SEM-PORTAL-005](./docs/ot/OT-SEM-PORTAL-005.md)

### Changed

- `PortalHome` delega ecosistema académico a `AcademicEcosystemSection` (sin `fetchNews` hardcodeado)
- Page Builder: `NewsGrid`, `EventsGrid`, `LibraryGrid`, `ResourcesGrid` unificados con portal
- Plantilla Home incluye bloques news, events, library, resources
- Queries por defecto: `limit: 4` en news, events, library

---

## v2.2.0 — Confianza Institucional

### Added

- `InstitutionSection` con 6 subsecciones de confianza (¿Por qué estudiar?, Modalidad, Galería, Stats, Testimonios, Versículo)
- Bloque Page Builder `modality`
- `TestimonialCard`, `GalleryImage`, `TestimonialAvatar` premium
- Helpers `extractHighlights`, `extractModalityItems`
- Seed ampliado en `SEED_HOME_BLOCK_DATA`
- Documentación [OT-SEM-PORTAL-004](./docs/ot/OT-SEM-PORTAL-004.md)

### Changed

- `PortalHome` delega confianza a `InstitutionSection`
- Page Builder: `GalleryGrid`, `TestimonialsGrid`, `ModalitySection` unificados con portal
- Plantilla Home incluye gallery, verse, modality

---

## v2.1.0 — Programas Premium Dinámicos

### Added

- Sección **Programas Destacados** premium (`ProgramsSection`, `ProgramCard`)
- Integración Content Engine vía `settings.query` del bloque `programs`
- `ProgramCardMedia` con placeholders elegantes y manejo de errores
- Skeleton de carga (`ProgramsSectionSkeleton`, `CardGridSkeleton`)
- Campos extendidos en `ProgramItem` (badge, certificación, precio, CTAs)
- Documentación [OT-SEM-PORTAL-003](./docs/ot/OT-SEM-PORTAL-003.md)

### Changed

- `PortalHome` delega programas a `ProgramsSection` (sin `fetchPrograms` hardcodeado)
- `ProgramsGrid` (Page Builder) usa componentes portal premium
- Query por defecto de programas: `limit: 3`

---

## v1.4.0 — Portal UX

### Added

- Portal UX público (rutas institucionales, componentes portal)
- Gobierno documental formal ([OT-SEM-DOC-001](./docs/ot/OT-SEM-DOC-001.md))
- [HANDBOOK](./docs/HANDBOOK.md), [CHANGELOG](./CHANGELOG.md), [RELEASES](./RELEASES.md)
- Estructura oficial `docs/` (architecture, design, ux, development, cms, ot, legacy)

---

## v1.3.0

### Added

- Media Library ([OT-SEM-CMS-005](./docs/ot/OT-SEM-CMS-005.md))
- Integración S3 para almacenamiento de medios
- Documentación: [MEDIA-LIBRARY](./docs/cms/MEDIA-LIBRARY.md)

---

## v1.2.0

### Added

- Content Engine ([OT-SEM-CMS-004](./docs/ot/OT-SEM-CMS-004.md))
- Gestión de contenido institucional (programas, noticias, eventos, equipo)
- Documentación: [CONTENT-ENGINE](./docs/cms/CONTENT-ENGINE.md)

---

## v1.1.0

### Added

- Menu Engine ([OT-SEM-CMS-002](./docs/ot/OT-SEM-CMS-002.md))
- Navegación dinámica (header, footer, mobile)
- Documentación: [CMS-MENUS](./docs/cms/CMS-MENUS.md)

---

## v1.0.0

### Added

- Infraestructura base Next.js + MongoDB ([OT-SEM-INFRA-001](./docs/ot/OT-SEM-INFRA-001.md))
- Configuration Hub ([OT-SEM-CMS-001](./docs/ot/OT-SEM-CMS-001.md))
- Design System institucional
- Page Builder ([OT-SEM-CMS-003](./docs/ot/OT-SEM-CMS-003.md))
- Endpoint de validación `GET /api/test`
- Documentación: [CMS-CONFIGURACION](./docs/cms/CMS-CONFIGURACION.md), [DESIGN-SYSTEM](./docs/design/DESIGN-SYSTEM.md)
