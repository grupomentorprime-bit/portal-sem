# Page Builder — Portal SEM

**Código:** OT-SEM-CMS-003

Constructor visual de páginas institucionales basado en bloques tipados, sin HTML libre en el código fuente.

---

## Principios

1. **El código nunca contiene contenido institucional** — Todo proviene de `cms_pages`.
2. **No HTML libre** — Cada bloque tiene un modelo de datos JSON (`settings`).
3. **Bloques reutilizables** — Un único `HeroInstitutional` configurable para cualquier página.
4. **Design System obligatorio** — Todos los bloques renderizan componentes institucionales.

---

## Arquitectura

```
MongoDB
├── cms_pages      # Páginas con bloques ordenados
├── cms_blocks     # Biblioteca de tipos de bloque
└── cms_templates  # Plantillas predefinidas

src/
├── types/page.ts
├── lib/cms/
│   ├── pages.ts
│   ├── blocks.ts
│   ├── templates.ts
│   ├── page-defaults.ts
│   ├── page-validation.ts
│   └── sanitize.ts
├── components/
│   ├── blocks/           # Wrappers CMS → Design System
│   └── page-builder/     # Constructor admin
└── app/
    ├── (site)/page.tsx   # Render dinámico home
    ├── (site)/[slug]/    # Páginas internas
    └── admin/pages/      # Constructor
```

---

## Colecciones

### cms_pages

```json
{
  "_id": "home",
  "tenant": "sem",
  "title": "Inicio",
  "slug": "/",
  "status": "published",
  "template": "institutional",
  "seo": { "title": "...", "description": "..." },
  "blocks": [
    {
      "id": "hero-123",
      "type": "hero",
      "visible": true,
      "order": 0,
      "settings": { "institutionName": "...", "motto": "..." }
    }
  ],
  "versions": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### cms_blocks

Biblioteca de bloques disponibles en el constructor.

### cms_templates

Plantillas con secuencia de bloques inicial (Home, Landing, Contacto).

---

## Bloques disponibles

| Tipo | Componente | Categoría |
|------|-----------|-----------|
| hero | HeroInstitutional | Portada |
| text | TextSection | Contenido |
| presentation | InstitutionPresentation | Contenido |
| programs | ProgramsGrid | Académico |
| teachers | TeachersGrid | Académico |
| news | NewsGrid | Contenido |
| events | EventsGrid | Contenido |
| library | LibraryGrid | Académico |
| cta | CTASection | Conversión |
| testimonials | Testimonials | Contenido |
| gallery | InstitutionGallery | Medios |
| stats | StatsInstitution | Contenido |
| video | VideoSection | Medios |
| verse | VerseBlock | Contenido |
| contact | ContactForm | Conversión |
| divider | Divider | Layout |
| html | HtmlBlock | Avanzado (admin) |
| markdown | MarkdownBlock | Avanzado (admin) |

---

## APIs

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cms/pages` | Listar páginas (`?tenant=`) |
| POST | `/api/cms/pages` | Crear página |
| GET | `/api/cms/pages/[id]` | Obtener página |
| PUT | `/api/cms/pages/[id]` | Actualizar / duplicar / publicar |
| DELETE | `/api/cms/pages/[id]` | Eliminar |
| GET | `/api/cms/blocks` | Biblioteca (`?seed=true`) |
| GET | `/api/cms/templates` | Plantillas (`?seed=true`) |

### Publicar con versionado

`PUT` con `{ publish: true }` guarda una versión del estado anterior en `versions[]` antes de publicar.

---

## Constructor (`/admin/pages`)

### Funcionalidades

- Listado de páginas con estado
- Crear / editar / duplicar / eliminar
- Drag & Drop para reordenar bloques
- Duplicar / eliminar / ocultar bloques
- Panel de configuración por bloque
- Vista previa Desktop / Tablet / Mobile
- Publicar / guardar borrador
- Aplicar plantillas
- Programar publicación (`scheduledAt`)

### Componentes

- `PageBuilder` — Editor principal
- `SortableBlocks` — Lista ordenable
- `BlockPalette` — Agregar bloques
- `BlockEditor` — Panel de settings
- `BlockRenderer` — Render público
- `PreviewDevice` — Marcos responsive

---

## Renderizado público

```tsx
// Home: slug "/"
const page = await getPublishedPageBySlug("/", tenant);
return <BlockRenderer blocks={page.blocks} config={config} />;
```

Solo páginas con `status: "published"` son visibles. Filtrado por `tenant` para multi-tenant.

---

## Seguridad

- Validación de esquema por bloque (`page-validation.ts`)
- HTML/Markdown sanitizados (`sanitize.ts`) — sin `<script>`, sin `javascript:`, sin event handlers
- Sin ejecución de JavaScript embebido
- Versionado antes de publicar

---

## Caché

- Lectura con `unstable_cache` (60s) + tags `cms-pages`
- `revalidateTag` en cada escritura
- Componentes lazy: `VideoSection`, `HtmlBlock`, `MarkdownBlock`

---

## Multi-tenant

Cada página incluye `tenant` (desde `config.institution.tenant`). Las consultas públicas filtran por tenant.

---

## Integración Design System

Los bloques en `src/components/blocks/` mapean `settings` → props de componentes en `@/components/institutional` y `@/components/ui`.

Nunca usar estilos propios — solo tokens CSS y clases institucionales.

---

## Inicialización

1. Ir a `/admin/pages`
2. Clic en **Inicializar CMS** (si no hay páginas, se hace automáticamente)
3. Se crean `cms_blocks`, `cms_templates` y página `home` publicada

---

*Documentación generada como parte de OT-SEM-CMS-003.*
