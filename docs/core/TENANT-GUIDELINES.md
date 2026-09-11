# Tenant Guidelines

## Identidad del Espacio (Tenant)

| Capa | Nombre |
| --- | --- |
| Código / DB | `Tenant`, campo canónico `tenantId` (slug estable) |
| UX | **Espacio** |

SEM productivo (Tenant 001):

| Código | Valor |
| --- | --- |
| `tenantId` | `seminario-ipn` |
| Código | `T001` |
| Site principal | `siteId = seminario-ipn` (`S001`) |

Academia ADL (Tenant 002):

| Código | Valor |
| --- | --- |
| `tenantId` | `adl` |
| Código | `T002` |
| Site principal | `siteId = adl` (`S002`) |
| Host de desarrollo | `adl.localhost:3000` (`ADL_DEV_HOST`) |

Colecciones de fundación (ADR-008 / OT-GROWTH-SAAS-001):

- `tenants` — entidad raíz del cliente
- `sites` — superficie pública (portal) por tenant (SEM opera 1:1)
- `domains` — `host` único → `{ tenantId, siteId, isPrimary, kind }` (N por Site)
- `site_config` — config de portal por `siteId` (ex singleton `cms_config`)

### Compatibilidad `cms_config`

Mientras existan consumidores del contrato anterior:

- El singleton `cms_config` con `_id: "site"` **se conserva** y sigue siendo lectura de respaldo SEM.
- La migración `006-saas-foundation` crea T001/S001/Domain y espeja la config a `site_config`.
- `updateSiteConfig()` en T001 hace dual-write singleton + `site_config`; en otros Espacios solo `site_config`.

### Resolución pública (SAAS-002 / SAAS-008)

- Portal público: **Host** → `domains` → Site → Tenant → `site_config` → `TenantContext`.
- Host desconocido → sin contexto (no fallback a otro tenant).
- `?tenant=` / headers de spoof de tenant **no** definen el Espacio.
- Un Site puede tener **N** dominios (uno `isPrimary`); alias y primary resuelven el mismo Site.
- Host normalizado único global; no puede pertenecer a dos Sites.
- `kind`: `custom` (dominio propio), `platform_subdomain` (`{slug}.{PLATFORM_BASE_DOMAIN}`), `legacy` (hosts SEM históricos / bootstrap).
- Mutaciones: `addDomainToSite` / `setPrimaryDomain` / `changeDomainHost` / `removeDomainFromSite` en `src/core/tenant/domains.ts`.
- DNS/TLS **fuera** de la app (esta OT cierra modelo + resolución).
- `APP_URL` / `NEXT_PUBLIC_APP_URL` = origen canónico de la **plataforma** (canonical, OAuth, cookies). **No** asignan identidad de Espacio.
- Fallbacks temporales SEM: solo **loopback** sin fila en `domains` → SEM; sin Host de request (scripts) → singleton. Ver [OT-GROWTH-SAAS-002](../validation/OT-GROWTH-SAAS-002/README.md), [OT-GROWTH-PLATFORM-HOST-ISOLATION-001](../AI/auditorias/OT-GROWTH-PLATFORM-HOST-ISOLATION-001.md) y [OT-GROWTH-SAAS-008](../validation/OT-GROWTH-SAAS-008/README.md).

### Resolución autenticada (SAAS-005)

- Sesión: `identity_sessions.tenantId` = **Espacio activo** (`activeTenantId`).
- Solo membresías `active` habilitan un Espacio; switch vía `POST /api/identity/spaces/switch`.
- Admin CMS (`requireActiveTenant`) usa la sesión; portal público sigue resolviendo por host.
- 0 membresías → `/admin/sin-espacio` (nunca cascarón vacío).
- **Operador de Growth OS** (`platform_owner` / `platform_operator` en `identity_users`): independiente del Espacio activo. No se infiere de `super_admin`. Superficie `/platform` (catálogo, ficha, crear y entrar a Espacios vía membresía + switch). Ver [OT-GROWTH-PROD-005](../validation/OT-GROWTH-PROD-005/README.md) y [OT-GROWTH-PLATFORM-ADMIN-004](../validation/OT-GROWTH-PLATFORM-ADMIN-004/README.md).
- Keycloak: 1 realm de plataforma; membresías en Mongo (sin realm por tenant).

Ver [OT-GROWTH-SAAS-005](../validation/OT-GROWTH-SAAS-005/README.md).

### Branding por Site (SAAS-006)

- La marca visible sale de `site_config` del Site activo (`institution`, `branding`, `seo`, `contact`, `social`).
- Theme: `layout.tsx` inyecta `--brand-*` desde el Site; `design-tokens.css` mapea a `--color-*` / alias `--sem-*`.
- `createDefaultSiteConfig()` es plantilla vacía (paleta de plataforma). **No** rellena nombre/logo/contacto SEM.
- SEM conserva su apariencia porque T001/S001 tiene esos valores (migración `009-saas-branding`), no por fallbacks de runtime.
- Un Site sin branding no se convierte en SEM.
- Admin lee `getOperationalSiteConfig()` (Espacio de sesión). Portal público: Host → `TenantContext`.

Ver [OT-GROWTH-SAAS-006](../validation/OT-GROWTH-SAAS-006/README.md).

### Correo transaccional (PROD-002)

Transporte e identidad están separados. **No** hay proveedor de correo por Espacio.

| Capa | Fuente | Qué no es |
| --- | --- | --- |
| Transporte | `RESEND_API_KEY` + `EMAIL_FROM` (buzón técnico de proceso) | Nombre visible, reply-to, links |
| Identidad | `site_config` del Espacio que origina el correo + Domain primario del Site | Secretos, credenciales, Resend |

- Nombre visible del remitente: `institution.name`. Si falta → **Growth OS** (nunca SEM).
- Reply-To: `contact.email` del mismo Site, cuando es un correo válido.
- Links: origen del Domain del Site dueño (`pickEmailOrigin`). No se usa `APP_URL` de otro Espacio.
- `EMAIL_FROM` puede traer un nombre legado (`Portal SEM <…>`); el motor extrae solo el buzón.
- Secretos no se guardan en `site_config`.

Ver [OT-GROWTH-PROD-002](../validation/OT-GROWTH-PROD-002/README.md).

### Segundo Espacio — Academia ADL (SAAS-009)

SEM y ADL conviven en la misma DB. Diferencias = `site_config` / datos, no `if (tenant === "adl")`.

Ver [OT-GROWTH-SAAS-009](../validation/OT-GROWTH-SAAS-009/README.md).

Datos obligatorios recomendados (portal / Site):

- `institution.name`, `shortName`, `organization`, `website`
- `branding.logo`, `heroImage`, `favicon`, colores
- `seo.title`, `seo.description`
- `contact.*` y `social.*` según necesidad

Opcional:

- `branding.secondaryLogo` — logo de alianza o partner (antes acoplado a IPN)

## Menús CMS

IDs estándar (`src/core/navigation/types.ts`):

| ID | Uso |
|----|-----|
| `main` | Header desktop |
| `mobile` | Header móvil (fallback: `main`) |
| `footer` | Columnas del footer |
| `legal` | Enlaces legales (footer inferior) |
| `quick-links` | CTAs header (postular, campus, etc.) |

Los menús llevan campo `tenant`. La migración SAAS-001/003 hace backfill de menús sin tenant → `seminario-ipn`. El filtro es **exacto** `{ tenant }` (sin `$or` leaky).

IDs físicos (SAAS-004): `_id = {tenantId}:{logicalId}` (p. ej. `seminario-ipn:main`). El API acepta IDs lógicos (`main`, `home`); lookup prueba scoped y bare (compat). Migración: `008-saas-singletons`.

## Integraciones

`platform_integrations` es por `tenantId` (`_id: storage:{tenantId}`). GET de storage/roles/workflows **no** ejecuta `ensure*`.

## Contenido

- Colecciones Content Engine siempre filtran `{ tenant }`.
- Páginas CMS (`cms_pages`) requieren `tenant`; `_id` scoped como menús; lookups con candidatos lógico/scoped + `tenant`.
- `cms_blocks` / `cms_templates`: catálogo **global** de plataforma (no por tenant).
- Media Library: lookups `{ _id, tenant }`; storage bajo prefijo `{tenant}/`.
- APIs tenantizadas usan `requireActiveTenant()` — body/query no cambian el Espacio.

## Seed y datos demo

`src/lib/content/seed.ts` contiene datos de demostración para desarrollo. **No** se renderizan en producción si no existen en la base de datos del tenant. Seeds SEM son datos de T001 (extracción = SAAS-007). T002 nace limpio: menús de plataforma, home vacía, sin forms/admisión/contenido SEM.

## Onboarding de un nuevo tenant

Alta genérica: `provisionTenantFoundation` (colecciones SAAS-001→008). Sin ramas por cliente.

1. Crear registro en `tenants` + Site default en `sites` + Domain (`addDomainToSite`).
2. Crear `site_config` del Site (plantilla vacía + identidad del cliente, sin seeds SEM).
3. Seed de menús (`getDefaultMenusForTenant` → plataforma salvo T001).
4. Roles de portal + stub `storage:{tenantId}` deshabilitado.
5. Membresía controlada (usuario existente) para probar el switcher.
6. Seed de contenido vía `POST /api/cms/content-seed` solo si aplica (SEM only hoy).
7. Configurar branding en `/admin/config`.

T002 Academia ADL:

```bash
npm run migrate -- 012-saas-adl-tenant
```

Host de desarrollo: `adl.localhost:3000` (no reutiliza `APP_URL`). `ensureAdlTenantFoundation` es idempotente y está separada de `010-saas-sem-content`.

Migración SEM existente:

```bash
npm run migrate -- 006-saas-foundation
npm run migrate -- 007-saas-isolation
npm run migrate -- 008-saas-singletons
```

La función `ensureSemTenantFoundation` es idempotente.
