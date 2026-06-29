# Platform Conventions

## Naming

| Evitar | Preferir |
|--------|----------|
| `logoSem`, `logoIpn` | `logoPrimary`, `logoSecondary` / `branding.logo` |
| `CMS_ASSET_PATHS.logoSem` | `PLATFORM_ASSET_FALLBACKS.logo` |
| Textos "SEM", "Seminario…" en UI | `config.institution.*` |
| Nav arrays en componentes | `resolveNavigation()` desde CMS |

## Imports

```typescript
import { getTenantContext, getActiveTenantContext } from "@/core/tenant";
import { resolveBrandingAssets } from "@/core/branding";
import { resolveNavigation, NAV_MENU_IDS } from "@/core/navigation";
import { assertActiveTenant } from "@/core/security";
import { resolvePageTitle } from "@/core/seo";
```

Portal público puede usar el adaptador legacy:

```typescript
import { getPortalContext } from "@/lib/portal/site";
```

## API routes

Toda ruta que acepte `tenant` como parámetro debe llamar:

```typescript
const check = await assertActiveTenant(requestedTenant);
if (!check.ok) return tenantGuardResponse(check);
// usar check.tenant
```

## Theming

Colores del tenant se inyectan en `app/layout.tsx` como CSS variables `--brand-*`. Componentes consumen tokens semánticos (`--primary`, `--secondary`) definidos en `globals.css`.

## Rutas públicas

Rutas de producto (programas, noticias, eventos, equipo) son genéricas.

Páginas institucionales custom (ej. alianzas) se publican como CMS pages y se resuelven vía `(site)/[slug]/page.tsx`.

## Versionado

- Core foundation: `v1.5.0-core-foundation`
- Package: `1.5.0`
