# Configuration Hub — OT-SEM-CMS-001

Documentación del módulo de Configuración Institucional del Portal SEM.

## Resumen

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-CMS-001 |
| Módulo | CMS — Configuration Hub |
| Versión | 1.0 |
| Dependencia | OT-SEM-INFRA-001 |
| Colección | `cms_config` (`_id: "site"`) |

## Arquitectura

```
Administrador
      ↓
Configuration Hub (/admin/config)
      ↓
API CMS (/api/cms/config)
      ↓
MongoDB — cms_config
      ↓
Portal Web (metadata, home, branding)
```

## Modelo de datos

Documento único en `cms_config` con `_id = "site"`.

### Bloques

| Bloque | Interface TypeScript | Campos |
| --- | --- | --- |
| General | `Institution` | name, shortName, tenant, organization, website, status |
| Branding | `Branding` | logo, favicon, heroImage, colores |
| SEO | `SeoConfig` | title, description, keywords |
| Contacto | `ContactInfo` | email, phone, whatsapp, address, city, country |
| Redes | `SocialLinks` | facebook, instagram, youtube, linkedin, tiktok |
| Funcionalidades | `FeatureFlags` | blog, news, events, store, library, forms, applications, onlinePayments |
| Metadatos | — | createdAt, updatedAt |

Interfaces definidas en `src/types/cms.ts`.

## APIs

### `GET /api/cms/config`

Obtiene la configuración institucional completa.

```json
{ "ok": true, "config": { ... } }
```

### `PUT /api/cms/config`

Actualiza la configuración. Actualiza automáticamente `updatedAt`.

- No permite crear documentos adicionales.
- No existe endpoint DELETE.
- Validaciones en `src/lib/cms/validation.ts`.

```json
{ "ok": true, "config": { ... } }
```

Errores de validación:

```json
{ "ok": false, "errors": [{ "field": "...", "message": "..." }] }
```

## Componentes

| Componente | Ubicación | Función |
| --- | --- | --- |
| `ConfigurationLayout` | `src/components/config/` | Layout con tabs laterales y barra de guardado |
| `ConfigurationHub` | `src/components/config/` | Orquestador del panel |
| `InstitutionForm` | `src/components/config/` | Datos generales |
| `LogoUploader` | `src/components/config/ImageUploader.tsx` | URL del logo |
| `FaviconUploader` | `src/components/config/ImageUploader.tsx` | URL del favicon |
| `HeroUploader` | `src/components/config/ImageUploader.tsx` | URL imagen hero |
| `ColorPicker` | `src/components/config/` | Selector de colores |
| `SeoEditor` | `src/components/config/` | Metadatos SEO |
| `ContactForm` | `src/components/config/` | Datos de contacto |
| `SocialLinksForm` | `src/components/config/` | Redes sociales |
| `FeatureTogglePanel` | `src/components/config/` | Interruptores de módulos |
| `PortalStatusCard` | `src/components/config/` | Estado del portal |

## Caché

- Lecturas públicas: `unstable_cache` con tag `cms-config` (60 s).
- Invalidación: `revalidateTag` al guardar vía PUT.
- Panel admin: `force-dynamic` para datos frescos al cargar.

## SEO dinámico

`generateMetadata()` en `src/app/layout.tsx` consume `cms_config` y genera:

- Title y description
- Open Graph
- Twitter Cards
- Robots (index según estado `active`)
- Favicon

## Reglas funcionales

1. Solo existe un documento `_id: "site"`.
2. Toda modificación actualiza `updatedAt`.
3. El portal lee siempre desde `cms_config`.
4. No se puede eliminar la configuración.
5. Sin datos institucionales hardcodeados en componentes.

## Acceso

- **Panel:** [http://localhost:3000/admin/config](http://localhost:3000/admin/config)
- **API:** [http://localhost:3000/api/cms/config](http://localhost:3000/api/cms/config)

> Autenticación de administradores pendiente para OT futura (auth_users, auth_roles).

## Pruebas

```bash
npm run lint
npm run build
npm run dev
```

Validar:

1. `GET /api/cms/config` retorna configuración.
2. Panel carga todas las secciones.
3. `PUT` persiste cambios y actualiza `updatedAt`.
4. Home refleja nombre, descripción y branding dinámicos.
5. Metadata del HTML coincide con bloque SEO.
