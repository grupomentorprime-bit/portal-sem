# Evidencia 01 — Mapa físico del repositorio

Fuente: inspección de solo lectura del árbol `portal-sem` (2026-09-02).  
Versión `package.json`: **2.5.0**. Framework: **Next.js 16.2.9**, **React 19.2.4**, **Node 20**.

## Árbol resumido

```
portal-sem/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (site)/             # Portal público (layout institucional)
│   │   ├── admin/              # Backoffice CMS / operación
│   │   ├── api/                # Route Handlers
│   │   ├── ingresar/           # Redirect → /admin/login
│   │   ├── invite/             # Aceptación de invitaciones IAM
│   │   ├── internal/           # Design system interno
│   │   ├── dev-preview/        # Previews solo desarrollo
│   │   ├── layout.tsx          # Root: fuente Manrope + CSS vars de branding
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── proxy.ts                # Edge proxy (ex middleware Next 16): cookie sesión /admin
│   ├── core/                   # Núcleo de plataforma (agnóstico de UI)
│   │   ├── tenant/             # TenantContext desde cms_config
│   │   ├── identity/           # Auth, roles, políticas, Keycloak
│   │   ├── security/           # assertActiveTenant
│   │   ├── portal/             # Portal Engine: load page, registry, SEO, visibility
│   │   ├── experience/         # Actions + Forms engine
│   │   ├── branding/ seo/ navigation/ hero/ media/
│   │   ├── workflow/ events/ analytics/ search/ notifications/
│   │   ├── admission/          # Adapter local | AprendeHoy (stub)
│   │   └── migrations/
│   ├── lib/                    # Persistencia MongoDB y orquestación
│   │   ├── mongodb.ts          # Un cliente → MONGODB_DB único
│   │   ├── cms/                # config, pages, menus, media, storage S3
│   │   ├── content/            # Content Engine
│   │   ├── identity/           # users, memberships, sessions, Keycloak admin
│   │   ├── experience/forms/   # repository, roster, generations
│   │   ├── student-affairs/    # operación de jornadas
│   │   ├── notifications/      # Resend + templates
│   │   ├── portal/             # site context, defaults SEM, admisión
│   │   └── admin/              # nav, feature flags, kit
│   ├── components/             # UI portal, admin, page-builder, visual-builder
│   ├── types/                  # Contratos TypeScript
│   ├── design/tokens/          # Tokens TS (colores default = paleta SEM)
│   └── styles/                 # CSS tokens, home-premium
├── public/                     # assets estáticos; logos SEM/IPN; /media local
├── scripts/                    # migraciones, Keycloak, roster SEM, branding
├── docs/                       # handbook, OTs, ADRs, audits, design
├── Dockerfile                  # Node 20 alpine; Dokploy
├── next.config.ts
├── package.json
└── .env.example                # plantilla (sin secretos)
```

## Responsabilidad por área

| Área | Responsabilidad |
|------|-----------------|
| `src/app/(site)` | Render público: home CMS, catálogo, admisión, formularios, contenido |
| `src/app/admin` | CMS, media, menús, formularios, convocatorias, asuntos estudiantiles, IAM |
| `src/app/api` | Contratos HTTP; mezcla de CMS, identity, experience, student-affairs |
| `src/proxy.ts` | Protección de `/admin` y `/internal` si `IDENTITY_ENFORCE=true` |
| `src/core` | Contratos de plataforma reutilizables; **no resuelve tenant por host** |
| `src/lib` | I/O MongoDB, S3, Resend, Keycloak; filtros `tenant` inconsistentes |
| `src/components/portal` | Renderer de bloques + páginas especiales |
| `src/components/page-builder` + `visual-builder` | Editor CMS / Experience Studio |
| `src/design` + `src/styles` | Design system; defaults cromáticos SEM |
| `scripts/` | Ops: índices, seeds, **datos nominativos de convocatorias SEM** |
| `docs/` | Gobernanza; identidad de producto mezclada Portal SEM / AprendeHoy |

## Lo que no existe en el repo

- `pages/` (Pages Router): no.
- Suite de tests `*.test.*` / Playwright specs: no.
- `docker-compose`, Nginx, PM2, Terraform: no (deploy vía Dockerfile + Dokploy, según comentarios).
- Resolución multi-dominio / multi-`cms_config`.
