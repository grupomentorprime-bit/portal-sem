# Evidencia 02 — Inventario de rutas

Tenant-awareness: **instancia** = un `cms_config._id = "site"` → `institution.tenant` (hoy `seminario-ipn` en docs/scripts). No hay resolución por host.

Leyenda tenant-aware: `YES` filtra por tenant; `PARTIAL` campo existe pero lookup por `_id` o singleton; `NO` sin tenant; `INSTANCE` usa el tenant activo de la instancia.

## Portal público (`src/app/(site)`)

| Ruta | Archivo | Dominio | Dependencia principal | Tenant-aware |
|------|---------|---------|----------------------|--------------|
| `/` | `(site)/page.tsx` | CMS home | `loadHomePage` + Portal Engine | INSTANCE |
| `/programas` | `programas/page.tsx` | Catálogo editorial | `fetchPrograms(tenant)` | YES |
| `/programas/[slug]` | `programas/[slug]/page.tsx` | Catálogo editorial | content engine | YES |
| `/equipo` | `equipo/page.tsx` | Personas | content + metadata SEM | YES / copy HARDCODE |
| `/admision` | `admision/page.tsx` | Admisión editorial | `portal_admission_config` | YES |
| `/noticias`, `/noticias/[slug]` | `noticias/*` | Comunicaciones | `content_news` | YES |
| `/eventos`, `/eventos/[slug]` | `eventos/*` | Comunicaciones | `content_events` | YES |
| `/agenda-academica`, `/[slug]` | `agenda-academica/*` | Comunicaciones | `content_academic_agenda` | YES |
| `/avisos`, `/avisos/[slug]` | `avisos/*` | Comunicaciones | `content_institutional_notices` | YES |
| `/biblioteca` | `biblioteca/page.tsx` | Biblioteca editorial | `content_library` | YES |
| `/institucion` | `institucion/page.tsx` | Institucional | CMS page o fallback | INSTANCE |
| `/contacto` | `contacto/page.tsx` | Contacto | CMS `/contacto` o `cms_config.contact` | INSTANCE |
| `/formularios` | `formularios/page.tsx` | Formularios | `listPublicExperienceForms` | YES |
| `/formularios/[id]` | `formularios/[id]/page.tsx` | Formularios | experience forms | YES |
| `/formularios/convocatorias/[slug]` | `formularios/convocatorias/[slug]/page.tsx` | Convocatorias | roster + form | YES |
| `/asistencia/justificar/[submissionId]` | `asistencia/justificar/[submissionId]/page.tsx` | Event attendance | submissions + token | YES (por token) |
| `/postulacion/enviada` | `postulacion/enviada/page.tsx` | Admisión | confirmación handoff | INSTANCE |
| `/[slug]` | `[slug]/page.tsx` | CMS dinámico | `loadPublishedPage` | YES |
| `/ingresar` | `app/ingresar/page.tsx` | Auth | redirect `/admin/login` | N/A |

Rutas especiales hardcodeadas (no solo CMS): `/programas`, `/admision`, `/noticias`, `/eventos`, `/biblioteca`, `/formularios*`, `/asistencia/*`. El catch-all CMS no cubre esos segmentos.

## Backoffice `/admin`

| Ruta | Dominio |
|------|---------|
| `/admin`, `/admin/login` | Dashboard / auth |
| `/admin/config` | Institución + branding + features |
| `/admin/pages`, `/admin/pages/[id]` | CMS páginas / Experience Studio |
| `/admin/experience-studio` | Visual builder |
| `/admin/content`, `/admin/content/[section]`, `.../edit/[id]` | Content Engine |
| `/admin/media` | Medios |
| `/admin/menus`, `/admin/menus/[id]` | Navegación |
| `/admin/portal/admission` | CMS admisión |
| `/admin/portal/forms`, `/admin/portal/forms/[id]` | Formularios |
| `/admin/portal/forms/convocatorias/[slug]` | Convocatoria (editor) |
| `/admin/portal/convocatorias`, `.../configuracion` | Centro convocatorias |
| `/admin/portal/asuntos-estudiantiles`, `[formId]`, `equipo` | Operación jornadas |
| `/admin/experience/forms`, `[id]` | Alias experience forms |
| `/admin/settings/team`, `users`, `roles`, `profile`, `security`, `activity`, `notifications`, `integrations`, `help` | IAM / plataforma |
| `/admin/workflows`, `/admin/events` | Workflow / event bus |
| `/admin/design-system`, `/admin/aek` | Design system / kit |

## APIs (`src/app/api`, 80 route.ts)

### CMS

| Método implícito | Ruta | Tenant |
|------------------|------|--------|
| GET/PUT | `/api/cms/config` | INSTANCE (doc `site`) |
| CRUD | `/api/cms/pages`, `/api/cms/pages/[id]` | PARTIAL (`getPageById` sin tenant) |
| CRUD | `/api/cms/menus`, `/api/cms/menus/[id]` | PARTIAL (filtro `$or` sin tenant) |
| CRUD | `/api/cms/media`, `[id]`, replace, duplicate, bulk, search, stream | YES en listado; `getMediaById` NO |
| GET | `/api/cms/blocks` | registry |
| GET | `/api/cms/templates` | templates |
| POST | `/api/cms/content-query`, `content-items`, `content-seed` | YES + tenant-guard |
| GET/PUT | `/api/cms/admission-config` | YES |
| GET/PUT | `/api/cms/form-experience/[formId]` | YES |
| GET | `/api/cms/programs-hub` | cuenta `portal_interesados` |

### Formularios / convocatorias / student-affairs

Ver `src/app/api/experience/forms/**` y `src/app/api/student-affairs/**`. Repositorios filtran `{ tenant }` en submissions; APIs usan `ctx.tenantId` de `requireAuth` (tenant de sesión = tenant de instancia).

### Identity / auth

`/api/identity/login|logout|register|me|team|roles|invitations|members|notifications|permissions`  
`/api/identity/auth/keycloak/{login,callback,session}`  
`/api/identity/auth/providers`

Sesión lleva `tenantId`; no hay switch de tenant. Login se ata al tenant activo de `cms_config`.

### Otros

| Ruta | Dominio | Tenant |
|------|---------|--------|
| `/api/admission/apply` | Postulación | INSTANCE + adapter |
| `/api/workflows/*` | Workflow | PARTIAL |
| `/api/events/*` | Event bus | body `tenantId` |
| `/api/admin/integrations/storage` | S3 | singleton `platform_integrations` |
| `/api/test` | Diagnóstico | **NO AUTH** — expone `databaseName` y `cms_config` |

Detalle fila a fila de APIs: cada archivo es un `route.ts` Next.js; métodos GET/POST/PATCH/DELETE varían por handler. Inventario de archivos: 80 rutas bajo `src/app/api/**/route.ts`.
