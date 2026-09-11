# OT-GROWTH-SAAS-006 — Branding por Espacio/Site

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-006 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | La identidad visual de SEM existe porque está configurada en T001/S001, no porque Growth OS tenga SEM grabado en su runtime |

## Objetivo

Eliminar dependencias runtime de identidad visual SEM para que la marca visible provenga del Site/Espacio activo. Reutilizar `site_config`, Theme (`--brand-*`) y `resolveBrandingAssets` — no crear otro sistema de branding.

## Fuera de alcance

- Contenido, formularios, generaciones y seeds SEM (SAAS-007)
- Tenant 002 ADL
- Custom domains / multi-realm Keycloak

## Contrato

| Superficie | Fuente |
| --- | --- |
| Nombre, logos, favicon, colores | `site_config.institution` / `branding` |
| SEO / title | `site_config.seo` + `core/seo` |
| Contacto / redes | `site_config.contact` / `social` |
| Theme CSS | `buildBrandThemeStyle` → `--brand-*` → `--color-*` / alias `--sem-*` |
| Portal público | Host → `TenantContext.config` |
| Admin | `getOperationalSiteConfig()` (Espacio de sesión) |
| Plantilla de Site nuevo | `createDefaultSiteConfig()` vacía (paleta de plataforma) |

SEM (T001/S001) se materializa con `applySemSiteIdentity` / migración `009-saas-branding`. Un Site sin esos campos **no** hereda SEM.

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

Fixture de aislamiento: `tenant-saas006` (no contamina SEM).

## Fallbacks que permanecen (compat / OT posterior)

| Ítem | Motivo |
| --- | --- |
| Paleta HEX en `brand.css` (`--sem-*` en `:root`) | Default de plataforma Growth OS; el Site la sobreescribe en `body` |
| Nombres CSS `--sem-*` | Alias legacy; valores siguen el Theme del Site |
| `sem-app-url-compat` / `sem-legacy-singleton` | SAAS-002; resolución de host, no marca visual |
| `getSiteConfig()` sin Host de request | Scripts → singleton T001 |
| Copy de footer CTA / columnas / sello IPN | Contenido SEM → [SAAS-007](../OT-GROWTH-SAAS-007/README.md) |
| `page-defaults`, home, forms, convocatorias | Seeds SEM → [SAAS-007](../OT-GROWTH-SAAS-007/README.md) |
| Admisión closing (`logo-sem-icon.svg`) | Pieza de producto SEM → [SAAS-007](../OT-GROWTH-SAAS-007/README.md) |
| PDF Asuntos Estudiantiles (nombre/logo fijos) | Informe parametrizado en [SAAS-007](../OT-GROWTH-SAAS-007/README.md) |
| Showcase Design System / mock admin preview | Superficies de demo, no runtime de Site |
| `SEM_TENANT_ID` / foundation T001 | Contrato de identidad de datos, no fallback visual |

## Veredicto

**APTO** — marca visible desde Site/Espacio; T001 conserva SEM porque está configurado; Site vacío o de prueba no se convierte en SEM; baseline / tsc / build.
