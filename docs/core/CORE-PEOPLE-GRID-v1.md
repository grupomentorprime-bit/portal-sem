# CORE PEOPLE GRID v1.0

**Estado:** LOCKED

Módulo oficial de Personas de AprendeHoy. No es un listado de «Docentes» ni exclusivo del SEM; consume `content_people` con el campo `personRole` y es reutilizable para cualquier tenant.

## Principio

Un único People Module para toda la plataforma. Las variantes (docentes, autoridades, conferencistas, tutores, relatores, equipo) son solo contenido — el mismo componente.

## Casos de uso

| Contexto | Ejemplos |
| --- | --- |
| SEM | Equipo docente, directivo, coordinadores |
| Universidad | Académicos, investigadores, decanos, autoridades |
| OTEC | Relatores, instructores |
| Empresa | Consultores, equipo ejecutivo, expertos |

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalPeopleGrid` | Sección con header + grid responsive |
| `PortalPersonCard` | Tarjeta de persona |
| `PortalPersonImage` | Fotografía con lazy, skeleton, alt obligatorio |
| `PortalPersonMeta` | Nombre, cargo, especialidad, badge de estado |
| `PortalPersonSocial` | Redes sociales y contacto opcional |
| `PortalPeopleSkeleton` | Loading idéntico al grid |

Ruta: `src/components/portal/experience/people-grid/`

## Contrato CMS — bloque `people`

### Sección

| Campo | Tipo |
| --- | --- |
| `overline` | string (eyebrow) |
| `title` | string |
| `description` | string |
| `showButton` | boolean |
| `buttonLabel` | string |
| `buttonHref` | string |
| `cardCtaLabel` | string (default: «Conocer más») |
| `query` | BlockContentQuery → `content_people` |

### Query (`content_people`)

| Filtro | Descripción |
| --- | --- |
| `status: published` | Solo publicados (resolver) |
| `personRole` | Opcional: `teacher`, `authority`, `speaker`, `coach`, `mentor`, `staff` |
| `featured` | Opcional |
| `limit` | Cantidad (default 4) |
| `sort` | `order` asc |

El resolver excluye registros con `visible: false` o `personStatus: historical`.

### Registro de persona (CMS)

| Campo | Descripción |
| --- | --- |
| `name` | Nombre |
| `role` | Cargo (posición) |
| `specialty` | Especialidad |
| `summary` | Biografía corta |
| `image` | Fotografía |
| `email` | Correo |
| `phone` | Teléfono (opcional) |
| `linkedin` | LinkedIn |
| `facebook` | Facebook |
| `instagram` | Instagram |
| `order` | Orden |
| `visible` | Visible en portal |
| `featured` | Destacado |
| `personRole` | Tipo: teacher, authority, speaker, etc. |
| `personStatus` | `active`, `featured`, `guest`, `historical` |
| `href` / `slug` | Enlace «Conocer más» |

## Layout responsive

| Breakpoint | Columnas |
| --- | --- |
| Mobile (&lt;768px) | 1 |
| Tablet (≥768px) | 2 |
| Notebook (≥1024px) | 3 |
| Desktop (≥1280px) | 4 |

Rango soportado: 360px – 2560px (política Core UI).

## Performance

- `next/image` con lazy loading
- Skeleton de carga (`PortalPeopleSkeleton`)
- Dimensiones fijas en media (aspect-ratio 4/5) → CLS = 0

## Accesibilidad

- `alt` obligatorio en imagen (nombre de la persona)
- Navegación por teclado en enlaces sociales y CTA
- Focus visible (`focusRing`)
- Contraste AA
- `aria-labelledby`, `role="list"`, etiquetas en redes

## Deprecaciones

Delegar a `PortalPeopleGrid` / `PortalPersonCard`:

| Componente legacy | Reemplazo |
| --- | --- |
| `TeachersGrid` | `PortalPeopleGrid` |
| `TeachersSectionContent` | `PortalPeopleGrid` |
| `TeamCard` | `PortalPersonCard` (variante `compact`) |
| `TeacherCard` | `PortalPersonCard` |
| `FacultyCard` | `PortalPeopleGrid` |
| `InstructorCard` | `PortalPersonCard` |

El bloque `teachers` sigue soportado por compatibilidad y delega internamente al módulo canónico.

## Integración

- Bloque CMS: `people` (Experiencia)
- Colección: `content_people`
- Estilos: `src/styles/people-grid.css`
- Seed: `content_people` en `src/lib/content/seed.ts`
- Admin: `/admin/content/people`

## Experience Kit v1.0

Con People Grid, el catálogo de Experience Modules cubre ~80% de un portal institucional:

Foundation: Hero Premium, Catalog Card, Feature Grid, Timeline, News Grid, **People Grid**
