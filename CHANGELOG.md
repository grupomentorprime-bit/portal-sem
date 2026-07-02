# Changelog — Portal SEM

Todos los cambios notables del proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## v2.0.0 — Portal Engine · Foundation Complete

Declaración oficial: [FOUNDATION-COMPLETE.md](./docs/strategy/FOUNDATION-COMPLETE.md) — cierre de Etapa I (Platform Core).

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

## v2.6.1 — Dirección de Arte Editorial (OT-PORTAL-003)

### Added

- [EDITORIAL-ART-DIRECTION.md](./docs/design/EDITORIAL-ART-DIRECTION.md) — guía permanente de identidad editorial SEM
- [OT-PORTAL-003](./docs/ot/OT-PORTAL-003.md) — orden de trabajo Dirección de Arte Institucional (planificada)

### Changed

- [INTRODUCTION.md](./docs/design/INTRODUCTION.md) — referencia a dirección editorial junto al Experience Kit
- [PULL_REQUEST_CHECKLIST.md](./docs/design/PULL_REQUEST_CHECKLIST.md) — checklist §15 identidad ministerial
- [EP-001](./docs/strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md) — OT-PORTAL-003 redefinida como Dirección de Arte Editorial
- [HOME-PREMIUM-v2-ART-DIRECTION.md](./docs/design/HOME-PREMIUM-v2-ART-DIRECTION.md) — enlace al documento padre

---

## v2.6.0 — Home Institucional Definitivo (OT-PORTAL-001)

### Added

- Bloque CMS `audience_profiles` — sección «¿Este seminario es para ti?» (5 criterios visuales)
- `src/lib/cms/home-portal-001.ts` — contenido canónico, orden narrativo y migración `portal-001`
- Experiencias home: `AudienceProfilesExperience`, `MethodologyHomeExperience`
- Estilos `src/styles/home-premium/` (audience, methodology, testimonials, faq, admission)
- Campo `program` en `ContentDocument` para iglesia/comunidad en testimonios
- Documentación [OT-PORTAL-001](./docs/ot/OT-PORTAL-001.md), [AUDIT-PORTAL-001](./docs/audits/AUDIT-PORTAL-001.md)

### Changed

- Home pública — narrativa continua: hero → programas → perfil → metodología → equipo → testimonios → admisión → FAQ → CTA
- `loadHomePage()` aplica migración OT-PORTAL-001 a páginas home existentes
- Hero — mensaje, CTA `/admision`, indicadores de confianza
- `modality` en home renderiza flujo metodológico de 6 pasos
- Testimonios — muestran generación (`role`) e iglesia (`program`) por separado
- Seed testimonios enriquecido; template home usa `buildPortal001HomeBlocks`
- [EP-001](./docs/strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md) — OT-PORTAL-001 marcada completada

### Removed

- Audiencia embebida en `FeaturedProgramsExperience` (ahora bloque dedicado)
- Noticias, contact hub y timeline formativo del orden home canónico

### Notes

- Primera OT de producto post EP-000; establece estándar de calidad para páginas públicas
- QA Lighthouse ≥ 95 y WCAG AA documentados en AUDIT-PORTAL-001 (verificación manual en deploy)

---

## v2.5.3 — Cierre épica EP-000 & Roadmap producto v2

### Added

- Cierre épica [EP-000 — Foundation / Experience Kit](./docs/strategy/epics/EP-000-FOUNDATION-EXPERIENCE-KIT.md)
- Épicas producto: [EP-001](./docs/strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md) Portal, [EP-002](./docs/strategy/epics/EP-002-CRM-ADMISSIONS.md) CRM, [EP-003](./docs/strategy/epics/EP-003-CAMPUS-VIRTUAL.md) Campus, [EP-004](./docs/strategy/epics/EP-004-BACKOFFICE-ACADEMICO.md) Backoffice
- [OT-PORTAL-001](./docs/ot/OT-PORTAL-001.md) — Home Institucional Definitivo ✅

### Changed

- [PRODUCT-ROADMAP-2026-2028.md](./docs/strategy/PRODUCT-ROADMAP-2026-2028.md) — versión 2.0, foco producto post EP-000
- [FOUNDATION-COMPLETE.md](./docs/strategy/FOUNDATION-COMPLETE.md) — Etapa II apunta a épicas EP-001+
- `EP-001-CRM-ADMISSIONS.md` — nota de renumeración a EP-002

### Notes

- Línea Branding (OT-001→005) y épica EP-000 cerradas oficialmente
- Nomenclatura OT futura: producto (`OT-PORTAL-*`, `OT-CRM-*`) sobre Experience Kit

---

## v2.5.2 — Design System Governance (OT-BRANDING-005)

### Added

- Documentación Experience Kit: `docs/design/INTRODUCTION.md`, `DESIGN-PRINCIPLES.md`, `COLORS.md`, `TYPOGRAPHY.md`, `SPACING.md`, `LAYOUT.md`, `ICONS.md`, `MOTION.md`, `ACCESSIBILITY.md`, `COMPONENTS.md`, `CONTRIBUTING.md`, `PULL_REQUEST_CHECKLIST.md`, `VERSIONING.md`
- Catálogo visual interno en `/internal/design-system` con specs por componente
- `src/components/design-system/component-specs.ts` y `ComponentSpecPanel.tsx`
- Documentación [OT-BRANDING-005](./docs/ot/OT-BRANDING-005.md), [AUDIT-BRANDING-005](./docs/audits/AUDIT-BRANDING-005.md)

### Changed

- `/admin/design-system` redirige a `/internal/design-system`
- Middleware protege rutas `/internal/*` cuando `IDENTITY_ENFORCE=true`
- `DESIGN-SYSTEM.md` apunta a INTRODUCTION.md como índice principal

### Notes

- Cierre de la línea de trabajo Branding (OT-001 → OT-005)
- Sin cambios visuales respecto a OT-BRANDING-004

---

## v2.5.1 — Branding Corporativo SEM (OT-BRANDING-004)

### Added

- `src/lib/admin/admin-ui.ts` — clases compartidas del panel administrativo con tokens SEM
- `src/core/workflow/workflow-colors.ts` — paleta corporativa para estados de workflow
- Validador `check-branding.ts` ampliado: Tailwind prohibidos, modo estricto por defecto
- Documentación [OT-BRANDING-004](./docs/ot/OT-BRANDING-004.md), [AUDIT-BRANDING-004](./docs/audits/AUDIT-BRANDING-004.md)

### Changed

- Panel administrativo (CMS): layout, media manager, workflows, formularios y menús migrados a `--sem-*` / `--color-*`
- Workflows: definiciones por defecto sin HEX legacy (`workflowStateColors`)
- `MenuBadge`, `MediaCard`, `ConfigurationHub` — estados danger/warning/success vía tokens
- `scripts/branding-baseline.json` — **0 entradas** (baseline deprecado; CI en modo estricto)

### Removed

- Clases Tailwind prohibidas del admin: `zinc-*`, `slate-*`, `amber-*`, `emerald-*`, `red-*`, `blue-*`
- HEX hardcodeados en componentes CMS y workflows
- Deuda de branding residual (90 → 0 incidencias)

---

### Added

- `PortalFooter` modular: `FooterInstitution`, `FooterPrograms`, `FooterLinkColumn`, `FooterContact`, `FooterBottom`, `BackToTop`
- Programas destacados en footer desde `academy_programs` (Content Engine)
- Menú footer jerárquico: Recursos + Admisión en `menu-defaults.ts`
- `institution.tagline` en `cms_config`
- `portalCopy` ampliado: títulos de columnas, créditos, volver arriba
- `social.spotify` en configuración de redes
- `PortalCopyForm` en `/admin/config` → General
- CSS `.portal-footer-premium__*` — grid responsive 1 / 2 / 5 columnas
- JSON-LD `sameAs` desde redes sociales configuradas
- Documentación [OT-SEM-PORTAL-007](./docs/ot/OT-SEM-PORTAL-007.md)

### Changed

- `PortalShell` obtiene programas destacados para el footer
- Menú legal: Política de Privacidad, Términos de Uso, Mapa del Sitio

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
