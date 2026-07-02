# Home Premium SEM — Fases 1–6

**OT:** OT-SEM-PORTAL-001 · OT-SEM-PORTAL-002 · OT-SEM-PORTAL-003 · OT-SEM-PORTAL-004 · OT-SEM-PORTAL-005 · OT-SEM-PORTAL-006 · OT-SEM-PORTAL-007

## Objetivo

Evolucionar la Home hacia el mockup aprobado con sensación de universidad moderna: institución seria, diseño excelente, confianza académica.

## Cambios implementados

### Footer Premium (OT-SEM-PORTAL-007)

- `PortalFooter` modular: institución, programas, recursos, admisión, contacto, bottom.
- Programas destacados desde `academy_programs` → `/programas/{slug}`.
- Menú footer jerárquico: Recursos + Admisión (`cms_menus.footer`).
- Contacto completo: dirección, teléfono, WhatsApp, email, horario.
- Redes sociales condicionales (Facebook, Instagram, YouTube, Spotify, TikTok, LinkedIn).
- `BackToTop` accesible con scroll suave.
- `portalCopy` ampliado: títulos de columnas, créditos, copyright.
- `institution.tagline` en configuración general.
- CSS `.portal-footer-premium__*` — grid 1 / 2 / 5 columnas.

### Conversión y admisión (OT-SEM-PORTAL-006)

- `PortalHome` gobernado 100% por orden de bloques del CMS (sin orden fijo en código).
- `PortalHomeBlock`: router server por tipo de bloque.
- `TeachersSection` → `resolveBlockContent` → `academy_team` (sin `fetchTeam` en Home).
- Bloques de conversión: `admission_process`, `scholarships`, `faq`, `quick_contact`, `alliance`, `cta`.
- Página `/admision` como destino de postulación.
- `contact.hours` en configuración institucional.
- Empty states configurables por bloque (`emptyTitle`, `emptyDescription`, …).
- Header: nav + CTAs visibles desde 1024px (`lg`).
- Timeline eventos: clases CSS unificadas (`eco-events-timeline__*`).
- SEO: JSON-LD `EducationalOrganization` + `FAQPage`.

### Ecosistema académico (OT-SEM-PORTAL-005)

- `AcademicEcosystemSection`: 4 subsecciones administrables desde CMS.
- Noticias → bloque `news` + Content Engine (`content_news`): 1 destacada + 3 secundarias.
- Próximos eventos → bloque `events` + Content Engine (`content_events`): timeline desktop / cards mobile.
- Biblioteca → bloque `library` + Content Engine (`content_library`): grid 4 recursos.
- Recursos destacados → bloque `resources` (Page Builder): items configurables.
- `NewsCard`, `EventCard`, `LibraryCard`, `ResourceCard` premium con placeholders elegantes.
- URLs amigables: `/noticias/{slug}`, `/eventos/{slug}`, `/biblioteca/{slug}`.
- Estados: empty, error, skeleton (`AcademicEcosystemSectionSkeleton`).

### Confianza institucional (OT-SEM-PORTAL-004)

- `InstitutionSection`: 6 subsecciones administrables desde CMS.
- ¿Por qué estudiar? → bloque `presentation` + `highlights[]`.
- Modalidad → bloque `modality` (nuevo en Page Builder).
- Vida estudiantil → `gallery` + Content Engine.
- Estadísticas → bloque `stats` con fondo institucional.
- Testimonios → `TestimonialCard` premium + Content Engine.
- Versículo → bloque `verse` con fondo configurable.

### Programas Destacados (OT-SEM-PORTAL-003)

- `ProgramsSection` → Content Engine → `academy_programs` (query en bloque CMS).
- `ProgramCard` premium: imagen con overlay, badges, metadatos, CTAs configurables.
- `ProgramCardMedia`: placeholder elegante, sin imágenes rotas.
- Estados: empty, error, skeleton (`ProgramsSectionSkeleton`).
- Grid responsive 1 / 2 / 3 columnas.
- `ProgramsGrid` (Page Builder) unificado con componentes portal.

### PortalHeader (`src/components/portal/layout/PortalHeader.tsx`)

- Altura **88–96 px** vía `--portal-header-height`.
- Grid 3 columnas (marca | nav centrado | CTAs) en desktop **lg (1024px+)**.
- Logos IPN + SEM vía `PortalBrandMark` con separador gradiente y SEM más protagonista.
- Menú con **hover de línea inferior animada** (`.portal-nav-link`).
- **Postular ahora**: degradado institucional (`.portal-btn-apply`).
- **Ingresar**: botón sobrio (`.portal-btn-login`).
- Scroll suave con blur y sombra (`--transition-slow`).

### PortalHero (`src/components/portal/PortalHero.tsx`)

- Layout **42/58** en desktop: copy + imagen amplia a la derecha.
- Fondo institucional con orbes, grid decorativo y gradientes (tokens).
- `PortalHeroMedia`: marco redondeado, sombras, overlay, **placeholder elegante** si no hay imagen.
- Título `text-display-xxl`, subtítulo legible, dos CTAs diferenciados (gradiente + outline).

### PortalHeroMedia (`src/components/portal/PortalHeroMedia.tsx`)

- Componente cliente con `onError` — nunca muestra imagen rota.
- Variantes `portrait` (4:5 hero) y `landscape` (4:3 contenido).

### PortalHeroBenefits

- Iconografía unificada con `.portal-icon-badge` (tamaño, grosor, color consistentes).

### Tipografía y espaciado

- Secciones: `text-display-l` (H2), overline `text-caption`, body `text-body`.
- Grilla 8 px: `gap-8`, secciones `py-20 sm:py-28`.

### PortalBrandMark

- Logo SEM más grande; fallback textual sin assets rotos.

## Fuentes de datos (sin hardcode)

| Elemento | Fuente |
|----------|--------|
| Logos | `cms_config.branding.logo`, `secondaryLogo` |
| Hero image | Bloque `hero.settings.heroImage` → `branding.heroImage` |
| Título hero | Bloque `hero.settings.institutionName` → `institution.name` |
| Subtítulo | Bloque `hero.settings.motto` → `seo.description` |
| Descripción | Bloque `presentation.settings.description` |
| Beneficios | Bloque `hero.settings.badge` o `stats.settings.items` |
| Programas destacados | Bloque `programs.settings.query` → Content Engine |
| Confianza institucional | Bloques `presentation`, `modality`, `stats`, `gallery`, `testimonials`, `verse` |
| Equipo docente | Bloque `teachers` → Content Engine (`academy_team`) |
| Proceso admisión | Bloque `admission_process` |
| Becas / FAQ / Contacto | Bloques `scholarships`, `faq`, `quick_contact` |
| CTA final | Bloque `cta` → `/admision` |
| Horario atención | `cms_config.contact.hours` |
| Ecosistema académico | Bloques `news`, `events`, `library`, `resources` → Content Engine |
| Nav | `cms_menus` (`main`, `mobile`) |
| Ingresar / Postular | `cms_menus` (`quick-links`) |
| Footer institucional | `cms_config` + `cms_menus.footer` + `academy_programs` |
| Textos footer | `cms_config.portalCopy` |
| Lema institucional | `cms_config.institution.tagline` |

## Menú quick-links (seed)

Actualizado en `menu-defaults.ts`:

1. Ingresar → `/ingresar`
2. Postular ahora → `/admision` (highlighted)
3. Aula virtual → URL externa (solo mobile/footer si se usa)

## CSS

Tokens y utilidades en `globals.css`:

- `.portal-header-premium`, `.portal-nav-link`, `.portal-btn-apply`, `.portal-btn-login`
- `.portal-hero-premium`, `.portal-hero-media`, `.portal-icon-badge`
- `.program-card-premium__*` (tarjetas de programa)
- `.trust-feature-card`, `.trust-gallery`, `.trust-verse`, `.trust-testimonial`
- `.eco-news-layout`, `.eco-events-timeline`, `.eco-card-media`, `.eco-library-card`, `.eco-resource-card`
- `.admission-process`, `.faq-accordion`, `.quick-contact-card`
- `.portal-footer-premium__*` (footer institucional 5 columnas)
- `--portal-header-height` en `:root`

## Validación

```bash
npm run lint
npm run build
```

## Próximas fases

- Identidad institucional oficial (OT-SEM-ASSETS-001)
- Optimización producción / Lighthouse (OT-SEM-PORTAL-008)
- Formulario de postulación en línea
