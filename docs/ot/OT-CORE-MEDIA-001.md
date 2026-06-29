# OT-CORE-MEDIA-001 — Asset Engine (Media Reference Model v2)

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-MEDIA-001 |
| Versión objetivo | v1.6.0 |
| Tag Git | v1.6.0-asset-engine |
| ADR | [ADR-003 — Media Library desacoplada](../architecture/ADR-003.md) |

## Objetivo

La identidad de un recurso multimedia es el **Media Asset (`mediaId`)**, no su URL. Las URLs son derivadas, resueltas por el Asset Engine en `src/core/media/`.

## Asset Resolver

| Función | Descripción |
| --- | --- |
| `resolveMedia()` | Metadatos completos del asset |
| `resolveMediaUrl()` | URL para variante (thumbnail, w400–w1920, webp) |
| `resolveMediaThumbnail()` | URL de miniatura |
| `resolveMediaSet()` | Lote de assets por IDs |
| `resolveMediaPlaceholder()` | blurDataURL |
| `resolveMediaMetadata()` | Alias de resolveMedia |
| `resolveMediaRef()` | Compatibilidad mediaId → URL, fallback legacy URL |

## Campos persistentes

### Branding (`cms_config`)

`logoMediaId`, `secondaryLogoMediaId`, `faviconMediaId`, `heroMediaId`

### SEO

`ogImageMediaId`, `twitterImageMediaId`

### Contenido

`coverMediaId`, `featuredMediaId`, `photoMediaId`, `imageMediaId`, `galleryMediaIds[]`, `srcMediaId`

### Page Builder (bloque hero)

`heroMediaId`, `logoMediaId`

## Compatibilidad legacy

Si existe `*MediaId`, el resolver lo usa. Si no, cae a la URL legacy (`logo`, `heroImage`, `image`, etc.).

## Usage Index

`rebuildUsageIndex(tenant)` en `src/core/media/usage/` reconstruye `usage[]` escaneando branding, páginas y colecciones de contenido.

## Migración

```bash
npm run migrate:media-ids
```

Script idempotente: `scripts/migrate-media-ids.ts`

## MediaPicker

Devuelve `MediaSelection` con `mediaId`; el consumidor persiste solo el ID.

## Referencias

- [MEDIA-LIBRARY.md](../cms/MEDIA-LIBRARY.md)
- [ADR-003](../architecture/ADR-003.md)
