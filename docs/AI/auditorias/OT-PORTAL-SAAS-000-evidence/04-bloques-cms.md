# Evidencia 04 — CMS bloques

## Registry

- Contrato: `BLOCK_TYPES` en `src/types/page.ts` — **37 tipos**.
- Definiciones editor: `DEFAULT_BLOCK_DEFINITIONS` en `src/lib/cms/page-defaults.ts`.
- Registry Portal Engine: `PORTAL_BLOCK_REGISTRY` en `src/core/portal/registry/index.ts`.
- Persistencia opcional: colección `cms_blocks` (`src/lib/cms/blocks.ts`); si vacía, usa defaults.
- Renderer: `src/components/portal/PortalBlockSection.tsx` (switch por `block.type`).
- Editor: page-builder + Experience Studio (`src/lib/experience-studio/registry.ts`).
- Query-driven: `QUERY_BLOCK_TYPES` en `src/lib/content/block-query-defaults.ts` (11 tipos).

## Ciclo de vida

| Capacidad | Estado |
|-----------|--------|
| Schema de bloque | `BlockSettings = Record<string, unknown>` + defaults por tipo |
| Validación | `src/lib/cms/page-validation.ts` (tipo en `BLOCK_TYPES`, merge settings) |
| Orden | `order` + `sortBlocks` |
| Visibilidad | `visible` + Portal visibility/conditions |
| Draft / published / scheduled / archived | `PageStatus` en `cms_pages` |
| Versionado | `CmsPage.versions[]` (snapshots title/blocks/seo) |
| Preview | Experience Studio / PreviewDevice |
| Publicación | status `published` + `getPublishedPageBySlug(slug, tenant)` |
| Reutilización | templates `cms_templates`; no hay BlockInstance compartida entre páginas |
| Almacenamiento | embebido en `cms_pages.blocks[]` — **no** hay colección de instancias |

## Evolución a `BlockDefinition → BlockInstance → Page → Site → Tenant`

**Factible sin reescribir el motor**, con capas:

1. `BlockDefinition` ya existe (`cms_blocks` / defaults).
2. `Page` + `tenant` ya existen.
3. `Site` **no existe** (hoy Site = instancia = `cms_config` único).
4. `BlockInstance` hoy es un objeto embebido; extraerlo a colección es opcional, no bloqueante.

El hueco es **Site/Tenant de runtime**, no el modelo de bloques.

## Clasificación de cada bloque

| Tipo | Clasificación | Nota |
|------|---------------|------|
| `hero` | GENERIC | Defaults copy/CTA SEM en `page-defaults` |
| `text` | GENERIC | |
| `presentation` | GENERALIZE | default «¿Por qué estudiar en el SEM?» |
| `feature_grid` | EDUCATION_GENERIC | copy ministerial default |
| `audience_profiles` | EDUCATION_GENERIC | «este seminario» |
| `modality` | EDUCATION_GENERIC | |
| `programs` | EDUCATION_GENERIC | |
| `academic_offer` | EDUCATION_GENERIC | |
| `seminarios_home` | SEM_SPECIFIC | nombre + «certificación SEM» |
| `teachers` | DEPRECATED | marcado legacy; people lo reemplaza |
| `people` | GENERIC | |
| `news` | GENERIC | |
| `events` | GENERIC | |
| `academic_agenda` | EDUCATION_GENERIC | |
| `institutional_notices` | GENERIC | |
| `library` | EDUCATION_GENERIC | |
| `resources` | EDUCATION_GENERIC | |
| `cta` | DEPRECATED | legacy vs `cta_premium` |
| `cta_premium` | GENERIC | |
| `testimonials` | GENERIC | |
| `gallery` | GENERIC | |
| `stats` | GENERIC | |
| `video` | GENERIC | |
| `verse` | EDUCATION_GENERIC | bíblico; no es genérico secular |
| `contact` | GENERIC | formulario legado |
| `admission_process` | EDUCATION_GENERIC | |
| `timeline` | GENERIC | |
| `scholarships` | EDUCATION_GENERIC | |
| `faq` | GENERIC | |
| `quick_contact` | GENERIC | |
| `contact_hub` | GENERIC | |
| `experience_form` | GENERIC | |
| `footer_premium` | GENERIC | fallbacks SEM en componentes |
| `alliance` | TENANT DATA | IPN / partner |
| `divider` | GENERIC | |
| `html` | GENERIC | adminOnly |
| `markdown` | GENERIC | adminOnly |

Conteo: 37 tipos. SEM_SPECIFIC fuerte: `seminarios_home`. EDUCATION_GENERIC: oferta/fe/biblioteca/verse. DEPRECATED: `teachers`, `cta`.
