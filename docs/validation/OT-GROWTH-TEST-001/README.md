# OT-GROWTH-TEST-001 — Baseline funcional SEM

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-TEST-001 |
| Tipo | Congelamiento de comportamiento (tests + inventario) |
| Fecha | 2026-09-03 |
| Criterio APTO | Línea base reproducible que detecte si la transformación SaaS rompe SEM |

## Objetivo

Congelar el comportamiento funcional actual de SEM antes de la transformación multi-tenant. **No** tenantiza, **no** cambia modelos, UX ni corrige hallazgos fuera de alcance.

## Recorridos críticos identificados

| Recorrido | Superficie | Contrato SEM a preservar |
| --- | --- | --- |
| Portal público | `/`, `/programas`, `/admision`, `/noticias`, `/eventos`, `/biblioteca`, `/equipo`, `/contacto`, `/institucion`, CMS `/{slug}` | Home y páginas publicadas desde CMS + Content Engine; tenant de instancia (`cms_config`) |
| CMS y publicación | `/admin/pages*`, `/api/cms/*`, workflows `cms.page` | Editar → publicar; branding/config institucionales |
| Formularios públicos | `/formularios`, `/formularios/[id]`, submit/public APIs | Defaults SEM + landings; testimonio privado |
| Identidad / admin | `/admin/login`, Keycloak callback/session, `proxy` gate | Cookie `ah_session`; sin sesión → redirect login; Identity siempre enforced |
| Convocatorias / asistencia | Talca Aurora `talca-aurora-jul-2026`, roster, check-in, justificación | Event attendance (no académica); scope AE por `formIds` + `generationCodes` |
| Aprende Hoy | `POST /api/admission/apply` + adapter | Default `local`; `ADMISSION_ADAPTER=aprendehoy` opcional → `POST {API}/v1/leads` |

## Configuración necesaria

| Variable / recurso | Uso |
| --- | --- |
| `MONGODB_URI`, `MONGODB_DB` | Persistencia única de instancia |
| `SESSION_SECRET`, cookie `ah_session` | Sesiones admin |
| `AUTH_BACKEND=keycloak` + `KEYCLOAK_*` | Login institucional SEM |
| `NEXT_PUBLIC_APP_URL` / `APP_URL` | URLs públicas, OAuth, cookies Secure |
| `RESEND_API_KEY`, `EMAIL_FROM` | Correos de convocatorias / invitaciones |
| Storage S3 (Integraciones o `S3_*`) | Adjuntos / media |
| `ADMISSION_ADAPTER` (+ `APRENDEHOY_API_*`) | Handoff; default local sin Aprende Hoy |
| Documento `cms_config` (`_id: site`) | Tenant activo, branding, features |

## Cobertura previa

- **No** existía suite `*.test.ts` / Playwright de producto (confirmado en OT-PORTAL-SAAS-000).
- Cobertura operativa previa: `npm run check:branding` (parte de `build`), scripts manuales de roster/Keycloak, capturas Playwright ad hoc.

## Cobertura mínima agregada

| Suite | Qué congela |
| --- | --- |
| `tests/baseline/proxy-admin-gate.test.ts` | Gate `/admin` sin sesión; público sin auth |
| `tests/baseline/admission-adapter.test.ts` | Adapter local vs Aprende Hoy |
| `tests/baseline/sem-contracts.test.ts` | Roles, forms SEM, convocatoria activa, generaciones, workflows, rutas críticas en disco |
| `tests/baseline/ensure-write-on-get.test.ts` | Inventario `ensure*` que escriben en GET |

Comando: `npm run test:baseline`

## ensure* que escriben en GET / lectura

| Ubicación | ensure | Riesgo multi-tenant |
| --- | --- | --- |
| `GET /api/identity/roles` | `ensureTenantRoles` | Auto-seed/sync de roles al listar; en SaaS puede mutar tenant equivocado o ocultar drift |
| `GET /api/identity/team` | `ensureTenantRoles` (×2) | Idem; side-effect en carga de equipo |
| `GET /api/identity/roles/[roleId]/permissions` | `ensureTenantRoles` | Idem |
| `GET /api/admin/integrations/storage` | `ensureTenantRoles` | Escritura de roles al leer integración (singleton storage) |
| `GET /api/workflows/definitions` | `ensureSystemDefinitions` | Inserta defs globales/plantilla si faltan; filtro `$or` sin tenant estricto |

**No en render público del portal** (`page.tsx` / `PortalHome` / `loadHomePage`).

Otros ensure (no GET público):

- Login / Keycloak → `ensureTenantRoles` + `ensureSuperAdminMembership*`
- `POST` seed forms → `ensureDefaultExperienceForms`
- Publicación CMS → `ensureEntityWorkflow` → `ensureSystemDefinitions`
- Mutations members/invitations/scope AE → `ensureTenantRoles`

**No refactorizados en esta OT.** Riesgo: side-effects en lectura dificultan instancias multi-tenant idempotentes y tests deterministas.

## Comportamiento SEM a preservar

1. Instancia única = un DB + un `cms_config`.
2. Portal público sin login; admin exige cookie.
3. Convocatoria activa Talca Aurora jul-2026 y catálogo G-2023…G-2026.
4. Admisión termina en `interesado`; handoff Aprende Hoy off por defecto.
5. Asuntos estudiantiles = asistencia a jornada, no ERP académico.
6. Ocho roles portal; Identity enforce siempre on.
7. Branding/check institucional vía `check:branding` en build.

## Deudas / riesgos (fuera de alcance de fix)

- Smoke HTTP E2E: ver **OT-GROWTH-TEST-002** (`tests/smoke`, incluido en `npm run test:baseline` cuando hay app viva).
- `ensure*` en GET admin.
- Lookups por `_id` sin tenant (audit SAAS-000).
- Seeds/copy SEM en código (`createSemDefaultForms`, `FORM_CONVOCATORIAS`).
- Integración Aprende Hoy runtime nula salvo env.

## Verificación (2026-09-03)

| Comando | Resultado |
| --- | --- |
| `npm run test:baseline` | **23/23 pass** |
| `npx tsc --noEmit` | **OK** |
| `npm run build` | **OK** (branding 0 incidencias; warnings NFT Turbopack preexistentes en media-storage) |

## Criterios de aceptación

- [x] Recorridos críticos documentados
- [x] Inventario ensure* en GET
- [x] Cobertura mínima ejecutable y reproducible
- [x] Sin tenantización / cambio de modelos / UX

**Veredicto: APTO** — hay línea base reproducible para detectar regresiones SEM ante la transformación SaaS.
