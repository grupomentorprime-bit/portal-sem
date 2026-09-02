# OT-PORTAL-SAAS-000 — Auditoría técnica del Portal SEM para evolución multi-tenant

| Campo | Valor |
| --- | --- |
| OT | OT-PORTAL-SAAS-000 |
| Tipo | Auditoría de solo lectura |
| Fecha | 2026-09-02 |
| Código inspeccionado | Working tree local `portal-sem` (incluye `src/proxy.ts`; `src/middleware.ts` ausente — convención Next.js 16) |
| Versión `package.json` | 2.5.0 |
| Stack | Next.js 16.2.9 · React 19.2.4 · MongoDB Driver 7 · Node 20 |
| Evidencia | [OT-PORTAL-SAAS-000-evidence/](./OT-PORTAL-SAAS-000-evidence/) |

**Restricciones cumplidas:** no se modificó código de producto, no hay commit/push/deploy, no se escribieron datos en MongoDB, no se tocó Keycloak, no se enviaron correos, no se ejecutaron migraciones, no se rotaron secretos, no se imprimen valores secretos.

---

# Resumen ejecutivo

## 1. Veredicto

El Portal SEM es un **producto single-tenant bien estructurado, con un núcleo de plataforma reutilizable y un campo `tenant` extendido**, que **aún no es un SaaS multi-tenant**. La documentación interna lo presenta a menudo como «AprendeHoy Learning OS»; el runtime es **una instancia = una base = un `cms_config`**.

**Clasificación §4 (tenant-awareness): D — multi-tenant parcial/inconsistente.**  
**Clasificación §25 (producto): B — single-tenant bien estructurado que puede tenantizarse.**  
**Aptitud para iniciar la transformación SaaS: APTO CON AJUSTES.**

No hace falta reescribir el CMS, el motor de formularios ni Identity. Sí hace falta **cerrar el modelo de instancia**, **aislar lookups por `_id`**, **sacar copy/datos SEM del código** y **tratar SEM como Tenant 001 contractual**.

## 2. Arquitectura encontrada

```
Browser
  → Next.js App Router (src/app)
       ├── (site)  portal público
       ├── /admin  CMS + operación
       └── /api    Route Handlers
  → src/proxy.ts   cookie ah_session si IDENTITY_ENFORCE=true
  → src/core/*     TenantContext, Identity, Portal Engine, Experience, Workflow, Events
  → src/lib/*      MongoDB (un MONGODB_DB) + S3 + Resend + Keycloak
  → MongoDB        colecciones con tenant | tenantId | singletons
```

Capas reales:

- **Core** (`src/core`): contratos de plataforma.
- **Persistencia** (`src/lib`): repositorios Mongo; no hay un único repository layer obligatorio.
- **UI**: portal renderer + admin kit + page-builder / Experience Studio.

## 3. Nivel real de preparación multi-tenant

| Dimensión | Estado |
|-----------|--------|
| Campo `tenant` / `tenantId` en documentos de negocio | Alto |
| Membresías usuario↔tenant en Identity | Alto (modelo) |
| Resolución de tenant por host / dominio | Nulo |
| Más de un `cms_config` | Nulo (`_id: "site"`) |
| Guardia cruzada `assertActiveTenant` | Impide *otro* tenant; no habilita *varios* |
| Lookups por `_id` sin tenant | Presentes (pages, media, workflows, invitations) |
| Branding CMS + CSS variables | Alto |
| Fallbacks SEM / IPN / generaciones en código | Alto acoplamiento |
| Integración runtime Aprende Hoy | Nula (adapter local por defecto) |

Preparación: **núcleo ~1/3 reutilizable tal cual; ~1/4 hay que tenantizar de verdad; el resto es generalizar SEM o corregir seguridad.**

## 4. Componentes reutilizables

Portal Engine, Content Engine, Media (prefijo `{tenant}/`), Experience Actions, Contact Hub, motor de formularios (definiciones/submissions), Page Builder / Experience Studio, Identity (users globales + memberships), catálogo de permisos de portal, Workflow, Event Bus, almacenamiento S3 abstracto, check-in/justificación como **asistencia a evento** (no académica).

## 5. Acoplamientos SEM

Tenant documental `seminario-ipn`; logos `logo-sem-*` / IPN; copy «Seminario Eclesiástico Mayor» y «Centro SEM»; generaciones G-2023…G-2026; form/roster Talca Aurora 2026; defaults de contacto `seminarioipn.cl`; paleta SEM como default de plataforma; scripts operativos con roster real. Ver [evidencia 05](./OT-PORTAL-SAAS-000-evidence/05-acoplamientos-sem.md).

## 6. Modelo de datos actual

Un DB por proceso. Contenido y forms filtran `tenant`. Identity está diseñado multi-org. **Configuración institucional y storage son singletons.** Detalle: [evidencia 03](./OT-PORTAL-SAAS-000-evidence/03-colecciones.md).

## 7. CMS / bloques

37 tipos registrados; bloques embebidos en `cms_pages`; versionado en `versions[]`; query-driven a Content Engine. Puede evolucionar a Definition→Instance→Page→Site→Tenant **sin reescribir** el renderer. Bloque claramente SEM: `seminarios_home`. [Evidencia 04](./OT-PORTAL-SAAS-000-evidence/04-bloques-cms.md).

## 8. Formularios y convocatorias

Motor genérico + **catálogo de generaciones y seeds SEM en código**. Flujo operativo completo: roster → invitación → respuesta → check-in → ausencia → justificación con adjunto → seguimiento → cierre/export. Eso es **EVENT ATTENDANCE (Portal SaaS)**, no asistencia académica de Aprende Hoy.

## 9. Auth / permisos

Keycloak (realm único de env) + sesiones Mongo + 8 roles de portal. Un usuario *puede* tener varias membresías en el modelo; el runtime **elige el tenant de la instancia**, no hay switch. `IDENTITY_ENFORCE` puede dejar escrituras en modo compat. Scope de asuntos estudiantiles por `formIds` + `generationCodes`.

## 10. Aislamiento

`TenantContext` hoy = leer `cms_config`. Punto natural futuro: resolver tenant **antes** de `getSiteConfig` (host/header) y exigir `tenant` en todo `findOne({ _id })` de recursos tenantizados. Huecos: pages/media/menus/workflows/integrations.

## 11. Dominios / branding

Una `APP_URL` / `NEXT_PUBLIC_APP_URL`. Branding de colores/logo en CMS inyectado en `layout.tsx`. Fallbacks de archivo SEM. Tipografía Manrope fija. No hay `TenantTheme` ni custom domain.

## 12. Integración con Aprende Hoy

**No hay acceso a otra base de datos.** Existe `AprendeHoyAdmissionAdapter` (`POST {API}/v1/leads`) desactivado salvo `ADMISSION_ADAPTER=aprendehoy`. Acoplamiento real: naming, campus URL, permisos ERP, docs de Learning OS.

## 13. Seguridad

P0: `/api/test` sin auth; modo compat IAM; lookups IDOR potenciales en SaaS; secretos de entorno local (no versionados) a rotar fuera de esta OT. No se copian valores.

## 14. Baseline de no regresión SEM

Rutas públicas listadas en §29, flujo admisión, formularios/convocatoria Talca, check-in/justificación, CMS home, login Keycloak. Hoy **no hay tests automatizados** que fijen ese contrato.

## 15. Mapa P0/P1/P2/P3

Ver §27.

## 16. Estimación de reutilización

Sobre **55 filas** de la matriz §24 (componentes, no LOC):

| Canasta | Filas | % |
|---------|------:|--:|
| REUSE | 20 | **36%** |
| GENERALIZE | 10 | **18%** |
| TENANTIZE | 13 | **24%** |
| REFACTOR/EXTRACT (EXTRACT + ADAPTER + SECURITY_REVIEW) | 8 | **15%** |
| DEPRECATE | 2 | **4%** |
| UNKNOWN | 2 | **4%** |

## 17. Secuencia propuesta de OTs

Ver §28. Primero aislamiento y Tenant 001 SEM; Tenant 002 solo al final.

## 18. Veredicto final de aptitud

**APTO CON AJUSTES** para iniciar la transformación SaaS.  
No es APTO «como si ya fuera SaaS». No es NO APTO (no requiere reescritura).

---

# 1. Mapa físico del proyecto

Ver [evidencia 01](./OT-PORTAL-SAAS-000-evidence/01-arbol-proyecto.md).

Hallazgos extra:

- No hay `pages/` (Pages Router).
- Tests unitarios/E2E: **cero archivos**.
- Deploy: `Dockerfile` (Dokploy). Sin Nginx/PM2 en repo.
- `npm run build` exige `check:branding` + `build:institutional-media`.

# 2. Inventario de rutas

Ver [evidencia 02](./OT-PORTAL-SAAS-000-evidence/02-inventario-rutas.md).

Patrón: **rutas especiales de producto** (programas, admisión, noticias, formularios) + **CMS catch-all** `/{slug}` + **home CMS-driven**.

# 3. Modelo real de datos

Ver [evidencia 03](./OT-PORTAL-SAAS-000-evidence/03-colecciones.md).

Atención:

- **Institución** vive en `cms_config.institution`, no en colección `tenants`.
- **No hay `siteId`.** `tenant` / `tenantId` son el único eje.
- Relaciones convocatorias: `experience_forms` ↔ `convocatoria_rosters` (slug) ↔ `experience_form_submissions` ↔ `student_affairs_form_operations`.
- Identity: usuarios globales; autorización por membresía.

# 4. Tenant-awareness actual

## Abstracciones existentes

| Nombre | Dónde | Qué hace hoy |
|--------|--------|--------------|
| `tenant` / `tenantId` | docs y colecciones | Etiqueta de documentos |
| `institution` | `cms_config` | Nombre, status, **un** tenant string |
| `TenantContext` | `src/core/tenant/context.ts` | Lee **el** site config; no recibe host |
| `assertActiveTenant` | `src/core/security/tenant-guard.ts` | Niega cualquier tenant ≠ el de la instancia |
| `organization` / `workspace` / `site` | — | No existen como entidades |

Cómo se sabe que los datos son del SEM: **el string configurado en `cms_config.institution.tenant`** (docs/scripts: `seminario-ipn`) más copy y seeds hardcodeados. No hay tabla de tenants.

## Veredicto §4: **D — multi-tenant parcial/inconsistente**

No es A: hay abstracción `tenant` e Identity con memberships.  
No es B puro: hay guardias y campos, pero también singletons y filtros leaky.  
No es C: no se puede hospedar un segundo tenant en la misma instancia sin colisión de `cms_config`, storage y lookups.

Evidencia:

```16:23:src/core/tenant/context.ts
export async function getTenantContext(): Promise<TenantContext | null> {
  const config = await getSiteConfig();
  if (!config?.institution.tenant) return null;
  const tenantId = config.institution.tenant;
```

```8:12:src/types/cms.ts
export const SITE_CONFIG_ID = "site" as const;
```

```7:13:src/lib/cms/menus.ts
function menuTenantFilter(tenant?: string) {
  if (!tenant) return {};
  return {
    $or: [{ tenant }, { tenant: { $exists: false } }, { tenant: "" }],
  };
}
```

```16:23:src/core/security/tenant-guard.ts
  if (trimmed !== config.institution.tenant) {
    return { ok: false, error: "Acceso denegado entre tenants.", status: 403 };
  }
```

# 5. Búsqueda de acoplamientos SEM

Inventario clasificado: [evidencia 05](./OT-PORTAL-SAAS-000-evidence/05-acoplamientos-sem.md).

Supuestos institucionales en código (además de strings): Chile (`es-CL`, teléfono +56), «generación» como eje de autorización, jornada presencial, alianza IPN, Aula Virtual AprendeHoy, Super Admin de Mentor Prime.

# 6. CMS y los bloques

[Evidencia 04](./OT-PORTAL-SAAS-000-evidence/04-bloques-cms.md).

**Puede evolucionar** al modelo SaaS pedido sin reescribir el CMS: falta `Site` y resolución de tenant; las instancias de bloque ya viven en la página.

# 7. Páginas y navegación

| Superficie | Origen |
|------------|--------|
| Home `/` | CMS (`loadHomePage`); seed demo si no hay programas |
| `/{slug}` | CMS publicado |
| `/contacto`, `/institucion` | CMS si hay bloques; si no, fallback código |
| `/programas`, `/noticias`, `/eventos`, `/biblioteca`, `/agenda-academica`, `/avisos`, `/equipo` | **Rutas fijas** + Content Engine |
| `/admision` | **Ruta fija** + `portal_admission_config` |
| `/formularios*` | Motor experience |
| Header/footer | Menús CMS (`main`, `mobile`, `footer`, `legal`, `quick-links`) + fallbacks SEM |
| Metadata | `cms_config.seo` + SEO de página; branding en root layout |
| Sitemap | paths estáticos + forms públicos; base `getAppBaseUrl()` |
| Robots | allow `/`; disallow `/admin`, `/api`, form testimonio |
| Canonical | no hay motor de canonical por tenant/dominio |
| Redirects | `/ingresar` → `/admin/login`; resto no inventariado como tabla CMS de redirects |

**Debe pasar a configuración tenant:** menús, SEO, robots/sitemap host, páginas especiales (qué rutas existen), fallbacks de header/footer, metadata de rutas fijas (hoy copy SEM en `generateMetadata`).

# 8. Experience Actions + Contact Hub

**Ubicación:** `src/core/experience/actions/*`, tipos `src/types/experience-action.ts`, Contact Hub `src/types/contact-hub.ts` + `src/components/portal/experience/contact-hub/`.

**Tipos de acción:** url, form, modal, whatsapp, email, phone, download, calendar, video, application, enrollment, program, workflow, api, custom.  
**Implementados como link/handler v1:** url, form, whatsapp, email, phone, download.

**Datos:** canales/locations/actions en settings del bloque; opción `useInstitutionDefaults` desde `cms_config.contact`.

**Dependencia institucional:** valores de teléfono/mail/WhatsApp salen de config o del bloque. Fallbacks SEM en defaults. CTAs `application`/`enrollment` están en el contrato; el handoff académico real es el adapter de admisión, no el action runtime.

**SaaS:** el motor **ya es una abstracción compartida**. Hay que alimentar canales desde Tenant, no desde defaults SEM.

# 9. Oferta académica pública

## Editorial / pública (Portal — debe quedarse)

- `academy_programs` (+ categorías): catálogo CMS, cards, home, `/programas`.
- Admisión: requisitos, fechas, becas, FAQ, perfiles, fees **declarativos** en `portal_admission_config`.
- Autoridades / equipo: `content_people` / `academy_team`.
- Copy de «por qué estudiar»: bloques + `src/lib/portal/sem-why-study-content.ts` (nombre SEM).

## Operacional académica (Aprende Hoy — no debe entrar al Portal)

No hay notas, aula, pagos de arancel, contratos, matrícula completa ni certificación académica **persistidos como sistema de registro**.  
Hay **precios editoriales** (`sem-program-pricing.ts`) y **campus URL** configurable (default AprendeHoy).

## Dependencia Aprende Hoy

Solo el adapter de handoff Interesado→Lead y el enlace de aula virtual. **No hay sync de programas desde otro producto.**

# 10. Formularios

Motor: `src/core/experience/forms/*` + `src/lib/experience/forms/repository.ts`.

| Pieza | Estado |
|-------|--------|
| Definiciones | `experience_forms`, campo `tenant` |
| Campos | 12 tipos (text…hidden) |
| Versiones de definición | no hay versionado formal de schema; update in-place |
| Submissions | `experience_form_submissions` + índices tenant+formId |
| Estados | active/visible/private/archived; destinos; postSubmit |
| Adjuntos | API `.../attachments`; S3 |
| Validación | engine + UI |
| Permisos | IAM + `studentAffairsScope` |
| Workflows | destino + workflow engine paralelo (no es BPM de cada envío) |
| Exportación | CSV operaciones / roster |
| Integración | convocatorias, testimonios, admisión, emails |

**Genérico y reutilizable:** ~80% del motor.  
**No genérico:** `createSemDefaultForms`, generaciones, destinos copiados del SEM, IDs de form conocidos.

# 11. Convocatorias / jornadas

## Flujo reconstruido

1. **Convocatoria** = `experience_forms` (a menudo destination `attendance_confirmation`) + experiencia visual `experience_form_experience`.
2. **Audiencia** = `convocatoria_rosters` (alumnos, generación, contacto).
3. **Invitación / outreach** = APIs `roster/.../outreach` + emails follow-up.
4. **Respuesta** = submission pública `/formularios/convocatorias/[slug]` o form id.
5. **Check-in** = `POST .../check-in` + roster-arrival / event-day.
6. **Ausencia** = attendance=no + absence-review + absence-contact.
7. **Justificación** = participant-justification + `/asistencia/justificar/[submissionId]` + adjunto.
8. **Seguimiento** = operations-state, contact-info, closure, handoff-validation email.
9. **Cierre / export** = operations CSV, reopen restringido.

**UI:** `/admin/portal/asuntos-estudiantiles`, `/admin/portal/convocatorias`.  
**Permisos:** `student-affairs.*` / `convocations.*` / `participants.*` + scope por formulario y generación.

**¿Puede vivir sin «generación»?** El *motor* sí (roster es una lista de participantes). La *autorización operativa SEM* no: `StudentAffairsScope.generationCodes` está en el modelo. SaaS debería generalizar a **cohort / segment / group**, con Tenant 001 mapeando generaciones.

**EVENT ATTENDANCE (Portal SaaS):** roster, RSVP, check-in físico, inasistencia a jornada, respaldo, cierre operativo.  
**ACADEMIC ATTENDANCE (Aprende Hoy):** no implementada aquí; no confundir con este dominio.

# 12. Usuarios, auth y Keycloak

| Pieza | Hallazgo |
|-------|----------|
| Proxy | `src/proxy.ts` — protege `/admin` y `/internal` solo si `IDENTITY_ENFORCE=true` |
| Sesión | cookie `ah_session`, TTL 30 días, `identity_sessions.tenantId` |
| Login local | deshabilitable con `AUTH_BACKEND=keycloak` |
| Keycloak | un `KEYCLOAK_URL` + un `REALM` + un `CLIENT_ID`; redirect `APP_URL` |
| Callbacks | `/api/identity/auth/keycloak/*` |
| Roles | 8 de portal + 3 ERP deshabilitados |
| Permisos | catálogo granular OT-IAM-002 + overrides membresía |
| Scopes | `PermissionScopeContext` **no aplica restricciones** (stub) |
| Operadores AE | formIds + generationCodes |
| Auditoría | `identity_audit` si no hay compatMode |
| Multi-org usuario | **modelo sí, runtime no** (sesión = tenant de instancia) |

Acoplamiento: **realm SEM de infraestructura**, no el código del cliente OIDC. Un SaaS multi-tenant exigirá realm-per-tenant, IdP por tenant, o un realm plataforma con claims `tenant`.

**No se modificó Keycloak en esta OT.**

# 13. Aislamiento de datos

Vías de acceso:

1. `src/lib/*` repositorios (preferido).
2. Route handlers con `getDatabase()` directo (`student-affairs` updates, `programs-hub`, `api/test`, register count).
3. Scripts `scripts/*` (ops SEM).
4. `ensureHomeInstitutionalContent` puede **escribir seed** al renderizar Home si no hay programas.

No hay acceso Mongo desde Client Components (patrón server-only en core).

**Dónde introducir `TenantContext` después (sin hacerlo ahora):**

1. Resolución en `proxy.ts` / layout (Host → tenantId).
2. `getDatabase()` sin cambio de DB, o DB-per-tenant más adelante.
3. Wrapper `col.find({ ...query, tenant })` en lib.
4. Prohibir `findOne({ _id })` en recursos tenantizados.

**Lookups por `_id` de riesgo SaaS (acceso cruzado si un día hay varios tenants en la misma DB):**

| API/lib | Riesgo |
|---------|--------|
| `getPageById` / `cms_pages.findOne({ _id })` | alto |
| `getMediaById` (lib/cms/media) vs `findMediaById(tenant, id)` en core | **inconsistente** |
| `cms_menus.findOne({ _id })` + filtro leaky | alto |
| `workflow_*` findOne `_id` | medio |
| `identity_invitations` / memberships by `_id` | medio (deben chequear `tenantId`) |
| `cms_config` `_id: site` | bloquea multi-tenant en misma DB |
| submissions student-affairs | en general `{ _id, tenant: ctx.tenantId }` — **bien** |

# 14. Media y archivos

- Proveedor: S3 compatible (B2/R2) vía `platform_integrations` o env `S3_*`; local solo dev.
- Clave: `buildStorageKey` → `{tenant}/{mediaId}/{filename}` (ya aislable).
- URLs: públicas `S3_PUBLIC_URL/media/{key}` o proxy `/api/cms/media/stream?key=`.
- Adjuntos de forms/justificaciones: mismo stack S3 (Dockerfile: sin S3 no hay justificativos).
- Límites: processing Sharp; SVG sanitizado.
- Metadata: `cms_media` con `tenant`.

Aislamiento futuro `tenant/{tenantId}/...`: **el path ya es así**. Migración de objetos no es necesaria para el *prefijo*; sí lo es si se parte a buckets por tenant. No se ejecutó migración.

# 15. Dominios y URLs

`getAppBaseUrl()`: `NEXT_PUBLIC_APP_URL` → `APP_URL` → `VERCEL_URL` → localhost.

Usos: emails, OAuth redirect Keycloak, sitemap, robots, media público, invitaciones.

**No hay** virtual host ni `tenant.producto.cl`. Custom domain exigiría: tabla de dominios, SSL en proxy (fuera del repo), cookie `Domain`, canonical/OG por host, Keycloak redirect URIs N, `next.config` `images.remotePatterns` dinámicos.

# 16. Branding / theming

| Elemento | Clasificación |
|----------|----------------|
| Nombre / tagline / shortName | DB CONFIG (`cms_config.institution`) |
| Logo / favicon / hero media | DB CONFIG (mediaIds) + HARDCODE fallbacks `logo-sem-*` |
| Colores CMS | DB CONFIG → `--brand-*` en `layout.tsx` |
| Fallback cromático | CSS/THEME = paleta SEM en tokens |
| Tipografía | HARDCODE Manrope |
| Header/footer | CMS menús + HARDCODE «Centro SEM» / copyright |
| Favicon archivos | HARDCODE paths |

**Punto natural de `TenantTheme`:** `resolveBrandingAssets` + root layout (ya inyecta colores). Extender a font, favicon file, radius, y **prohibir** `PLATFORM_ASSET_FALLBACKS` SEM en runtime SaaS (usar placeholder de plataforma).

# 17. Emails

- Proveedor: Resend (`RESEND_API_KEY`).
- From: `EMAIL_FROM` o **«Portal SEM &lt;onboarding@resend.dev&gt;»**.
- Layout: `renderTransactionalEmail` con colores **tokens SEM**, nombre de institución inyectable.
- Usos: invitaciones CMS, confirmación/follow-up convocatoria, handoff validation, justificación.
- URLs: `getAppBaseUrl()`.
- Logo en mail: no hay asset tenant; badge de texto con institutionName.
- Fallback copy convocatoria: «Equipo académico — Seminario Eclesiástico Mayor».

Configurable por tenant: from, dominio, logo, colores, URL, copy. No se enviaron correos.

# 18. Integraciones

| Integración | Tipo | Aprende Hoy |
|-------------|------|-------------|
| MongoDB | DB propia | no compartida |
| Keycloak | IdP | no |
| Resend | email | no |
| S3/B2 | storage | no |
| `AprendeHoyAdmissionAdapter` | HTTP leads | **explícita, off por defecto** |
| Campus URL | hipervínculo | default campus.aprendehoy.cl |
| WhatsApp/tel/mailto | cliente | no |
| Webhooks genéricos | action `api` no implementada como producto | no |

No hay imports de colecciones de otro producto. No hay sync batch Aprende Hoy.

# 19. Feature flags

| Flag | Definición | Consumo | Alcance | Futuro entitlement |
|------|------------|---------|---------|--------------------|
| `ADMIN_SHELL_V2` | env, default ON | admin layout/config | instancia | capability `admin.shell.v2` |
| `IDENTITY_ENFORCE` | env | proxy + guards | instancia (seguridad, no feature) | debe ser **siempre on** en SaaS |
| `AUTH_BACKEND` | env | login | instancia | IdP por tenant |
| `ADMISSION_ADAPTER` | env | admission-adapter | instancia | integración opcional |
| `SiteConfig.features` | DB | nav, módulos (news, library, forms…) | **un** tenant de instancia | entitlements SaaS ideales |

No hay LaunchDarkly ni flags por tenant distintos del documento `cms_config`.

# 20. Seguridad y secretos (arquitectura)

**No se imprimen valores.** `.env*` está en `.gitignore` salvo `.env.example`.

| Archivo | Tipo de secreto | Riesgo |
|---------|-----------------|--------|
| `.env` / `.env.local` (máquina de desarrollo; no git) | URI Mongo, SESSION_SECRET, Resend, Keycloak, S3 | Si esas credenciales siguen activas en producción, **considerarlas comprometidas y rotarlas fuera de esta OT** (estaciones de trabajo, backups, chat). |
| `.env.example` | placeholders | bajo |
| `src/core/identity/auth/config.ts` | fallback `SESSION_SECRET` de desarrollo | alto si se despliega sin env |
| `platform_integrations` en Mongo | access keys S3 cifradas con SESSION_SECRET | alto si el secreto de sesión cambia o se filtra |
| `src/app/api/test/route.ts` | no es secreto; **expone nombre de DB y cms_config** sin auth | alto (recon + fuga de config) |
| `SUPER_ADMIN_BOOTSTRAP_EMAIL` | identidad de cuenta privilegiada en código | medio (enumeración) |
| Logs `console.info` adapter admisión (email postulante en dev) | PII | bajo/dev |
| `scripts/set-storage-secret.ts` | escribe secreto storage | ops |

No se encontraron client secrets hardcodeados en `src/` (se leen de env).  
`IDENTITY_ENFORCE` apagado = **backoffice y APIs de escritura en modo compat** (ADR-004).

# 21. Tests

No hay `*.test.ts`, `*.spec.ts` ni proyectos Playwright configurados pese a dependencia `playwright`.

Existe: `npm run check:branding`, checklists `docs/validation/*`, scripts `audit-*` / `compare-g20xx` (ops de datos SEM, no contrato de producto), capturas visuales.

**Baseline contractual futuro:** hay que **crear** tests; no hay suite que preservar. Candidatos: smoke público, admisión submit local, form convocatoria, check-in autorizado, CMS publish, login deny sin sesión.

# 22. Deploy e infraestructura

| Pieza | En repo / evidencia |
|-------|---------------------|
| Build | `next build`; Docker usa `build:docker` (sin check branding) |
| Start | `next start` puerto 3000 |
| Servidor | contenedor Node; comentarios Dokploy |
| Proxy/SSL/CDN | no en repo — restricción multi-domain está **fuera** de la app |
| MongoDB | `MONGODB_DB` único (docs históricas: SeminarioIPN) |
| Keycloak | URL/realm env |
| Storage | S3 obligatorio en producción para uploads |

Restricción SaaS: **un proceso = un tenant efectivo**. Multi-tenant en un proceso exige cambiar `cms_config` y resolución. Multi-tenant por instancia (un deploy SEM, otro Academia) es viable **hoy** con costo operativo, no de código.

# 23–24. Matriz de clasificación

Leyenda estado: ST = single-tenant efectivo; MT-field = campo tenant; ST-core = núcleo reusable.

| Componente | Archivo/Ruta | Dominio | Estado actual | Acoplamiento SEM | Tenant-aware | Dependencia Aprende Hoy | Clasificación | Riesgo | Acción futura |
|------------|--------------|---------|---------------|------------------|--------------|-------------------------|---------------|--------|---------------|
| App Router Next 16 | `src/app` | plataforma | ST-core | bajo | INSTANCE | no | REUSE | P3 | Mantener |
| Conexión Mongo una DB | `src/lib/mongodb.ts` | datos | ST | db name histórico | NO | no | TENANTIZE | P1 | TenantContext; no compartir DB sin filtros |
| cms_config singleton | `src/lib/cms/config.ts` | institución | ST | datos SEM en doc | PARTIAL | campus URL | TENANTIZE | P0 | N docs o colección tenants |
| TenantContext | `src/core/tenant/context.ts` | plataforma | ST | no | INSTANCE | naming docs | TENANTIZE | P0 | Resolver por host |
| tenant-guard | `src/core/security/tenant-guard.ts` | seguridad | 1 tenant | no | deny-other | no | TENANTIZE | P1 | Allow-list N tenants |
| Identity memberships | `src/lib/identity/*` | IAM | MT-field | Super Admin email | YES | docs Learning OS | REUSE | P2 | Switch de membresía |
| Sesión un tenant | `identity_sessions` | IAM | ST | cookie `ah_session` | PARTIAL | no | TENANTIZE | P1 | Tenant en sesión elegible |
| Keycloak 1 realm | `src/core/identity/auth/keycloak.ts` | IAM | ST | realm seminario | NO | no | TENANTIZE | P1 | IdP/realm por tenant |
| Proxy enforce | `src/proxy.ts` | seguridad | flag | no | cookie only | no | SECURITY_REVIEW | P0 | Enforce siempre on |
| Catálogo permisos portal | `permissions/catalog.ts` | IAM | reusable | labels | n/a | no | REUSE | P3 | — |
| Permisos academic/ERP | mismo + `ROLE_CODES` | IAM | híbrido | no | n/a | sí (futuro ERP) | EXTRACT | P2 | Fuera de Portal SaaS |
| CMS pages engine | `src/lib/cms/pages.ts` | CMS | MT-field | no | PARTIAL | no | REUSE | P1 | Tenant en getById |
| getPageById sin tenant | `pages.ts` | CMS | IDOR futuro | no | NO | no | SECURITY_REVIEW | P0 | Añadir tenant |
| Registry bloques | `page-defaults.ts` | CMS | reusable | copy default SEM | n/a | no | GENERALIZE | P2 | Defaults neutros |
| Experience Studio | `src/lib/experience-studio` | CMS | reusable | no | VIA PAGE | no | REUSE | P3 | — |
| Content Engine | `src/lib/content/*` | catálogo | MT-field | seed demo SEM | YES | no | REUSE | P2 | Seed opcional |
| Media prefix tenant/ | `buildStorageKey` | medios | MT-field | no | YES | no | REUSE | P3 | Bucket opcional |
| getMediaById | `src/lib/cms/media.ts` | medios | IDOR futuro | no | NO | no | SECURITY_REVIEW | P0 | Usar findMediaById |
| Menús filtro $or | `src/lib/cms/menus.ts` | nav | leaky | no | PARTIAL | no | TENANTIZE | P0 | Exigir tenant |
| Branding CMS+CSS | `layout.tsx` + `branding/resolve` | theme | ST-core | fallbacks | INSTANCE | no | REUSE | P2 | TenantTheme |
| Fallbacks logo-sem | `asset-paths.ts` | theme | HARDCODE | alto | NO | IPN | GENERALIZE | P1 | Placeholder plataforma |
| Tokens color default | `design/tokens/colors.ts` | theme | SEM=plataforma | alto | NO | docs AH | GENERALIZE | P2 | Tokens neutros + SEM data |
| Experience Actions | `src/core/experience/actions` | UX | reusable | no | n/a | enrollment stub | REUSE | P3 | — |
| Contact Hub | `types/contact-hub.ts` | UX | reusable | defaults contacto | VIA CONFIG | no | REUSE | P3 | — |
| Forms engine | `core/experience/forms` + repository | forms | MT-field | seeds SEM | YES | no | REUSE | P2 | Quitar seeds de código |
| Generaciones / default forms | `generations.ts`, `defaults.ts` | forms | SEM | alto | n/a | no | GENERALIZE | P1 | Catálogo tenant |
| Convocatorias+roster | `roster.ts`, student-affairs | eventos | SEM ops | generaciones | YES | no | GENERALIZE | P1 | Cohort genérico |
| Scope AE | `student-affairs/scope.ts` | authz | reusable pattern | generationCodes | YES | no | GENERALIZE | P2 | groups[] |
| Admisión CMS | `admission-config.ts` | admisión | editorial | copy SEM | YES | no | REUSE | P2 | — |
| Admission adapter | `admission-adapter.ts` | admisión | stub | no | payload.tenant | **sí (opt-in)** | ADAPTER | P2 | Contrato explícito |
| portal_interesados | `interesado-repository.ts` | admisión | MT-field | no | YES | handoff | REUSE | P3 | — |
| Workflow | `src/core/workflow` | plataforma | PARTIAL | no | PARTIAL | no | REUSE | P2 | Tenant en findById |
| Event bus | `src/core/events` | plataforma | MT-field | no | tenantId | no | REUSE | P3 | — |
| Email Resend | `lib/notifications/email.ts` | comms | ST | Portal SEM from | APP_URL | no | TENANTIZE | P1 | From/dominio tenant |
| ADMIN_SHELL_V2 | `feature-flags.ts` | admin | instancia | no | NO | naming AH | GENERALIZE | P3 | Entitlement |
| features cms_config | `types/cms.ts` FeatureFlags | producto | 1 doc | no | INSTANCE | store/payments | TENANTIZE | P1 | Entitlements |
| Rutas públicas fijas | `(site)/programas` etc. | portal | híbrido | metadata SEM | YES data | no | GENERALIZE | P2 | Site routes config |
| CMS `[slug]` | `(site)/[slug]/page.tsx` | CMS | MT-field | no | YES | no | REUSE | P3 | — |
| Sitemap/robots | `sitemap.ts` `robots.ts` | SEO | 1 host | form ids | APP_URL | no | TENANTIZE | P1 | Por dominio |
| GET `/api/test` | `api/test/route.ts` | ops | abierto | no | expone DB | no | DEPRECATE | P0 | Autenticar o eliminar |
| Super Admin email | `iam-guard.ts` | IAM | HARDCODE | Mentor Prime | n/a | no | SECURITY_REVIEW | P1 | Config plataforma |
| platform_integrations | `storage-config.ts` | storage | singleton | no | NO | no | TENANTIZE | P1 | Credenciales por tenant |
| Docker/Dokploy | `Dockerfile` | infra | 1 app | no | 1 URL | no | TENANTIZE | P1 | Multi-domain en proxy |
| Suite tests | — | calidad | ausente | — | — | no | UNKNOWN | P0 | Crear baseline SEM |
| Scripts roster G-20xx | `scripts/compare-g*` | ops SEM | LEGACY | PII | NO | no | DEPRECATE | P2 | Fuera del producto SaaS |
| Seed home on GET | `ensure-home-content.ts` | CMS | side-effect | demo SEM | tenant | no | SECURITY_REVIEW | P1 | Nunca en prod SaaS |
| Naming AprendeHoy | docs + comments | producto | híbrido | n/a | n/a | **marca** | EXTRACT | P1 | Portal SaaS ≠ Learning OS |
| Fallbacks footer/header | footer, FormFocusedShell | UX | HARDCODE | alto | NO | no | GENERALIZE | P2 | Solo CMS |
| Analytics/search core | `src/core/analytics` `search` | plataforma | poco uso visible | no | ? | no | UNKNOWN | P3 | Auditar uso |
| Notifications IAM | `identity_notifications` | IAM | MT-field | no | YES | no | REUSE | P3 | — |
| Adjuntos forms | attachments route | forms | MT-field | no | YES | no | REUSE | P3 | prefix tenant |
| Justificación jornada | asistencia + AE | eventos | reusable | copy SEM | YES | no | REUSE | P2 | Event attendance only |
| 8 roles portal | `roles/codes.ts` | IAM | reusable | nombres OT-SEM | YES | ERP codes | REUSE | P3 | — |
| Cookie ah_session | `auth/config.ts` | IAM | naming AH | no | n/a | marca | GENERALIZE | P3 | Renombrar con cuidado |
| Fuente Manrope | `app/layout.tsx` | theme | HARDCODE | no | NO | no | TENANTIZE | P3 | TenantTheme.font |

# 25. Veredicto final (producto)

## ¿Qué tenemos realmente hoy?

**B. Producto single-tenant bien estructurado que puede tenantizarse.**

Justificación: hay Core, CMS, forms, identity y media de calidad de producto, con `tenant` en la mayoría de colecciones de negocio. No es A (no requiere reescritura del Portal Engine). No es C (no se puede activar Tenant 002 en la misma instancia). Se acerca a D solo en **identidad de producto** (docs AprendeHoy vs Portal) y en **módulos ERP fantasma**; eso se separa por gobernanza, no por un split de monolito de datos.

# 26. Estimación de reutilización

Método: **55 componentes de la matriz §24**, un voto por fila. No es % de líneas ni de archivos.

| Canasta OT | % | Cómo se obtuvo |
|------------|--:|----------------|
| REUSE | 36% | 20 filas |
| GENERALIZE | 18% | 10 filas |
| TENANTIZE | 24% | 13 filas |
| REFACTOR/EXTRACT | 15% | 2 EXTRACT + 1 ADAPTER + 5 SECURITY_REVIEW |
| DEPRECATE | 4% | 2 filas |
| (UNKNOWN, no pedido) | 4% | 2 filas |

Interpretación: **más de un tercio se conserva**; casi un cuarto es aislamiento real; el resto es sacar SEM del código o pagar deuda de seguridad **antes** de mezclar tenants.

# 27. Mapa de riesgo

### 🔴 P0 — bloquea SaaS / seguridad / fuga

- `/api/test` público (nombre DB + `cms_config`).
- `IDENTITY_ENFORCE` no obligatorio → escrituras CMS sin sesión real.
- Singletons `cms_config` + `platform_integrations` impiden N tenants/DB.
- Lookups `cms_pages` / `cms_media` / menús sin tenant estricto.
- Ausencia total de tests de no regresión SEM.
- Credenciales del entorno local: rotar fuera de esta OT si coinciden con producción.

### 🟠 P1 — arquitectura / aislamiento / dependencia crítica

- Sin resolución por dominio.
- Keycloak un realm; APP_URL única.
- Generaciones y seeds SEM en código.
- Logos/fallbacks SEM en runtime.
- Email from / branding mail.
- Seed de contenido al visitar Home.
- Super Admin email en código.
- Producto documentado como AprendeHoy Learning OS.

### 🟡 P2 — deuda técnica

- Bloques/copy default SEM; rutas fijas con metadata SEM.
- Permisos academic.* en Portal.
- Workflow findById; scripts PII; dual registry bloques.
- Cookie `ah_session`; compat roles legacy.

### 🟢 P3 — posterior

- Renombrar cookie; TenantTheme.font; entitlements finos; analytics/search; extraer BlockInstance.

# 28. Propuesta de secuencia de OTs

**No implementar en esta OT.** Orden tentativo para no romper Tenant 001:

1. **OT-SAAS-001 — Contrato de producto** — Portal SaaS ≠ Aprende Hoy; glosario; prohibir ERP en este repo.
2. **OT-SAAS-002 — Seguridad de instancia** — quitar/autenticar `/api/test`; `IDENTITY_ENFORCE=true` contractual; seed Home off en prod.
3. **OT-SAAS-003 — Baseline no regresión SEM** — smoke + E2E de §29 **antes** de tenantizar.
4. **OT-SAAS-004 — Arquitectura multi-tenant** — ADR: instancia-por-tenant vs DB compartida; decidir `tenants` collection.
5. **OT-SAAS-005 — TenantContext de runtime** — Host/header → tenantId; dejar de leer un único `site`.
6. **OT-SAAS-006 — Aislamiento MongoDB** — tenant obligatorio en findById pages/media/menus/workflows; índices; menús sin `$or` leaky.
7. **OT-SAAS-007 — Tenant 001 SEM** — migrar `cms_config` al registro de tenants **sin cambiar UX**; freeze de datos SEM.
8. **OT-SAAS-008 — Identidad / memberships** — switch de tenant; no atar sesión al único cms_config; Keycloak plan (sin ejecutar aquí).
9. **OT-SAAS-009 — Branding TenantTheme** — quitar fallbacks `logo-sem`; SEM como datos de T001.
10. **OT-SAAS-010 — Dominios** — `tenant.producto.cl` y custom domain; APP_URL por tenant.
11. **OT-SAAS-011 — Media** — confirmar prefijos; política bucket vs prefix.
12. **OT-SAAS-012 — Email** — from, DNS, templates por tenant.
13. **OT-SAAS-013 — CMS** — defaults de bloques neutros; Site routes.
14. **OT-SAAS-014 — Catálogo** — programas como entidad editorial tenant; sin LMS.
15. **OT-SAAS-015 — Formularios** — extraer seeds SEM a datos T001.
16. **OT-SAAS-016 — Convocatorias** — cohort genérico; map generaciones T001.
17. **OT-SAAS-017 — Integraciones** — adapter Aprende Hoy opt-in; LMS URL tenant.
18. **OT-SAAS-018 — Analytics / flags** — features → entitlements.
19. **OT-SAAS-019 — Tenant 002** — academia piloto **después** de verde en baseline T001.

# 29. Protección del Portal actual — baseline de no regresión SEM

Principio: **el Portal SEM operativo no puede degradarse al convertirse en Tenant 001.**

### Rutas públicas

`/`, `/programas`, `/programas/[slug]`, `/admision`, `/noticias`, `/eventos`, `/biblioteca`, `/equipo`, `/contacto`, `/institucion`, `/formularios`, `/formularios/[id]`, `/formularios/convocatorias/[slug]`, `/asistencia/justificar/[submissionId]`, `/postulacion/enviada`, CMS `/{slug}` publicado.

### Workflows

- Home CMS + menús + branding.
- Postulación admisión → `portal_interesados` (adapter local).
- Convocatoria jornada (Talca Aurora / form id de producción SEM): RSVP, roster, check-in, ausencia, justificación+PDF, emails, cierre.
- Testimonio (privado).
- Login Keycloak `/admin/login`, equipo, roles, scope AE por generación.

### APIs a congelar comportamentalmente

`/api/cms/config`, pages, media, menus, content-query, admission-config, experience forms submit/public, student-affairs check-in/justification/closure, identity me/login/logout/keycloak callback.

### Tests a crear (hoy no existen)

1. Smoke HTTP 200 de rutas públicas con tenant SEM.
2. Home render con `cms_pages` slug `/`.
3. Submit admisión local sin llamar Aprende Hoy.
4. Submit convocatoria + aislamiento por `tenant`.
5. Check-in requiere permiso; operador limitado por generación.
6. CMS publish round-trip.
7. 401 en `/admin` con enforce on y sin cookie.
8. Branding: CSS vars desde `cms_config` (regresión OT branding).

# 30. Entregables

- Este documento.
- [OT-PORTAL-SAAS-000-evidence/](./OT-PORTAL-SAAS-000-evidence/) (árbol, rutas, colecciones, bloques, acoplamientos SEM).

---

**No se modificó código ni estado productivo durante esta auditoría.**  
(Los únicos archivos nuevos son este informe y sus anexos de evidencia.)
