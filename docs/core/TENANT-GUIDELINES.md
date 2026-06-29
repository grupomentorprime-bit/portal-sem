# Tenant Guidelines

## Identidad del tenant

Cada instancia AprendeHoy expone un tenant activo vía `cms_config.institution.tenant`.

Datos obligatorios recomendados:

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

Los menús pueden incluir campo `tenant` para despliegues multi-tenant en una sola base de datos.

## Contenido

- Colecciones Content Engine siempre filtran `{ tenant }`.
- Páginas CMS (`cms_pages`) requieren `tenant` en documento.
- Media Library almacena bajo prefijo `{tenant}/`.

## Seed y datos demo

`src/lib/content/seed.ts` contiene datos de demostración para desarrollo. **No** se renderizan en producción si no existen en la base de datos del tenant.

## Onboarding de un nuevo tenant

1. Crear `cms_config` con tenantId único.
2. Seed de menús (`DEFAULT_MENUS`) asociados al tenant.
3. Seed de contenido vía `POST /api/cms/content-seed`.
4. Configurar branding en `/admin/config`.
5. Publicar home y páginas institucionales en Page Builder.
