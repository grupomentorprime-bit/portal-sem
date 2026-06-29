# Portal UX — OT-SEM-PORTAL-UX-001

Portal público moderno del tenant SEM, integrado con CMS, Content Engine y Media Library.

## Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Home con secciones institucionales |
| `/programas` | Listado con filtros por estado |
| `/programas/[slug]` | Detalle de programa |
| `/noticias` | Listado de noticias |
| `/noticias/[slug]` | Artículo con compartir y relacionados |
| `/eventos` | Listado de eventos |
| `/eventos/[slug]` | Detalle de evento |
| `/equipo` | Equipo agrupado por rol/departamento |
| `/institucion` | Página CMS o empty state |
| `/ipn-chile` | Vinculación IPN Chile |
| `/contacto` | Contacto CMS o datos de configuración |

## Arquitectura

```
src/components/portal/
  layout/          Header, Footer, MobileNav, Breadcrumb, Container, Section, CTA
  cards/           ProgramCard, NewsCard, EventCard, TeamCard, FeatureCard, StatCard
  PortalShell.tsx  Layout público (reemplaza SiteShell)
  PortalHome.tsx   Home compuesta con Content Engine
  PortalHero.tsx   Hero con media desde branding

src/lib/portal/
  site.ts          Contexto del portal (config, nav, logos)
  content.ts       Queries server-side al Content Engine
  blocks.ts        Utilidades para bloques CMS de la home
```

## Fuentes de datos

- **Logos e imágenes hero:** `config.branding` (Media Library) con fallback en `CMS_ASSET_PATHS`
- **Navegación:** menú CMS `main` o `PORTAL_DEFAULT_NAV`
- **Programas, noticias, eventos, equipo:** Content Engine (`executeContentQuery`)
- **Textos de home (stats, CTA, presentación):** bloques de la página CMS `/`
- **Páginas institucionales:** CMS por slug (`/institucion`, `/contacto`, `/ipn-chile`)

## Reglas

- No se inventan datos institucionales; empty states cuando falta contenido
- Multi-tenant vía `config.institution.tenant`
- React nunca accede a MongoDB directamente

## Validación

```bash
npm run lint
npm run build
```

Verificar manualmente: home, header/footer mobile, detalle por slug, fallbacks de imagen.
