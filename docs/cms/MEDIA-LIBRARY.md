# Media Library — OT-SEM-CMS-005

Biblioteca de medios institucional (Digital Asset Manager) del Portal SEM / AprendeHoy Learning OS.

| Atributo | Valor |
| --- | --- |
| ADR | [ADR-003 — Media Library desacoplada](../architecture/ADR-003.md) |
| OT | OT-SEM-CMS-005 |
| Versión | 1.3.0 |
| Tag Git | v1.3.0-media-library |
| Colección | `cms_media` |

## 1. Objetivo

Centralizar fotografías, logos, documentos, videos y audios en una única biblioteca reutilizable por todo el ecosistema AprendeHoy.

## 2. Arquitectura

```
Portal / Page Builder / Config
        ↓
   MediaPicker (UI)
        ↓
   POST /api/cms/media
        ↓
   CMS Media Service (lib/cms/media.ts)
        ↓
   MongoDB (cms_media — solo metadatos)
        ↓
   Object Storage (S3 / local public/media/)
        ↓
   URLs optimizadas → next/image / img
```

**Decisión clave:** MongoDB almacena únicamente metadatos. Los binarios viven en almacenamiento de objetos (S3-compatible) o en `public/media/` en desarrollo.

## 3. Modelo `cms_media`

Campos principales: `tenant`, `filename`, `mimeType`, `size`, `width`, `height`, `folder`, `category`, `tags`, `alt`, `caption`, `url`, `thumbnail`, `responsive`, `hash`, `usage[]`, `visibility`, `trashedAt`.

### Carpetas oficiales

Logos, Hero, Programas, Noticias, Profesores, Biblioteca, Eventos, Testimonios, Galería, Documentos, Descargas, Videos, Audio, Iconos, Otros.

### Categorías

Imagen, Documento, Video, Audio, SVG, Icono.

## 4. API REST

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/cms/media` | Listado con filtros |
| POST | `/api/cms/media` | Subida multipart |
| GET | `/api/cms/media/[id]` | Detalle |
| PUT | `/api/cms/media/[id]` | Editar metadatos |
| DELETE | `/api/cms/media/[id]` | Papelera (403 si en uso) |
| DELETE | `/api/cms/media/[id]?permanent=true` | Eliminar definitivo |
| POST | `/api/cms/media/bulk` | Acciones masivas |
| GET/POST | `/api/cms/media/search` | Búsqueda avanzada |

## 5. Optimización de imágenes

Al subir PNG/JPG/WEBP, el motor genera automáticamente:

- Thumbnail (200px)
- Variantes WebP: 400, 800, 1200, 1920px
- Original convertido a WebP

SVG: sanitización de scripts embebidos.

## 6. Seguridad

- Whitelist MIME y extensiones
- Límites de peso por tipo (imagen 15MB, documento 50MB, video 300MB, audio 100MB)
- Detección de duplicados por hash SHA-256
- Sanitización SVG
- No eliminar archivos con referencias activas (`usage[]`)

## 7. Papelera

`DELETE` mueve a `visibility: trash`. Retención 30 días, luego purga automática en listados.

## 8. Panel admin

`/admin/media` — vista cuadrícula/lista, carpetas, filtros, búsqueda, subida drag-and-drop, detalle y uso.

## 9. MediaPicker

Componente reutilizable en:

- Configuración → Logo, Favicon, Hero (`BrandingPanel`)
- Page Builder → bloque Hero
- Futuro: programas, noticias, profesores (OTs de contenido)

```tsx
<MediaField
  label="Logo"
  value={logo}
  onChange={setLogo}
  tenant="seminario-ipn"
  folder="Logos"
  category="Imagen"
/>
```

## 10. Variables de entorno

Ver `.env.example`:

- `NEXT_PUBLIC_APP_URL` — base URL para archivos locales
- `S3_*` — almacenamiento S3-compatible (producción)

## 11. Integración Expo / Campus

Consumir la misma API REST con `tenant` y seleccionar `url` o variantes `responsive` según dispositivo.

## 12. Módulos

| Archivo | Rol |
| --- | --- |
| `src/types/media.ts` | Tipos compartidos |
| `src/lib/cms/media.ts` | Servicio CRUD |
| `src/lib/cms/media-storage.ts` | Local / S3 |
| `src/lib/cms/media-processing.ts` | Sharp + hash |
| `src/lib/cms/media-usage.ts` | Referencias cruzadas |
| `src/components/media/*` | UI completa |

## 13. Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Gestión centralizada en cms_media | ✅ |
| Sin subida directa en formularios | ✅ |
| MediaPicker en config y hero | ✅ |
| API REST completa | ✅ |
| Filtros, carpetas, búsqueda | ✅ |
| ARQ-003 compatible | ✅ |
| Preparado S3 + Expo | ✅ |
