# Evidencia 05 — Acoplamientos SEM (muestra no exhaustiva)

Clasificación: CONFIGURABLE | TENANT DATA | HARDCODE | INFRASTRUCTURE | SECURITY | LEGACY.

## Identidad institucional

| Hallazgo | Ubicación | Clase |
|----------|-----------|-------|
| Tenant default `seminario-ipn` | `scripts/sync-tenant-roles.ts`, `bootstrap-super-admin.ts`, docs CMS | INFRASTRUCTURE / TENANT DATA |
| DB histórica `SeminarioIPN` | README, HANDBOOK, INFRAESTRUCTURA.md; `.env.example` usa `portal_sem` | INFRASTRUCTURE |
| Realm Keycloak `seminario` | `.env.example` `KEYCLOAK_REALM` | INFRASTRUCTURE |
| Client default `seminario-ipn-web` | `scripts/setup-keycloak-client.ts` | INFRASTRUCTURE |
| Nombre «Seminario Eclesiástico Mayor» como fallback UI | footer, emails, metadata páginas, FormFocusedShell, ui/footer | HARDCODE |
| «Centro SEM» | `AdminInstitutionalHeader.tsx` | HARDCODE |
| Logos `logo-sem-*`, `logo-ipn.svg` | `src/lib/cms/asset-paths.ts`, `public/images/` | HARDCODE |
| Paleta `#002A47` / `#246AA1` / `#10BCE2` | `src/design/tokens/colors.ts` (defaults de plataforma = SEM) | CONFIGURABLE en CMS; HARDCODE fallback |
| Contacto placeholder `contacto@seminarioipn.cl`, redes seminarioipn | `src/lib/cms/defaults.ts`, footer-content, institutional-demo | HARDCODE / TENANT DATA |
| Campus `https://campus.aprendehoy.cl` | defaults topBar, menu-defaults | HARDCODE (LMS externo) |
| Super Admin `soporte@mentorprime.cl` | `src/lib/identity/iam-guard.ts` | SECURITY |
| EMAIL_FROM default «Portal SEM» | `src/lib/notifications/email.ts` | HARDCODE |
| Cookie sesión `ah_session` | `src/core/identity/auth/config.ts` | LEGACY (marca AprendeHoy) |
| Tipografía Manrope global | `src/app/layout.tsx` | CONFIGURABLE futuro TenantTheme |

## Dominio convocatorias (dato SEM en código)

| Hallazgo | Ubicación | Clase |
|----------|-----------|-------|
| `CONVOCATORIA_GENERATIONS` G-2023…G-2026 + staff | `src/lib/experience/forms/generations.ts` | HARDCODE / TENANT DATA debería ser |
| Form default `convocatoria-talca-aurora-jul-2026` | `src/core/experience/forms/defaults.ts` | TENANT DATA en código |
| Opciones diploma teología en `program-application` | mismo archivo | TENANT DATA |
| `createSemDefaultForms` | mismo archivo | HARDCODE naming |
| Scripts `compare-g2023`…`g2026`, `fix-jose-gonzalez-staff`, PII operativa | `scripts/` | LEGACY / ops SEM |
| Copy «jornada presencial del seminario» | defaults forms | HARDCODE |

## Producto AprendeHoy (no es SEM, pero acopla identidad de plataforma)

| Hallazgo | Clase |
|----------|-------|
| Docs «AprendeHoy Learning OS», roadmap ERP | LEGACY / EXTRACT producto |
| `AprendeHoyAdmissionAdapter` + env `APRENDEHOY_API_*` | ADAPTER (no hay llamada si adapter=local) |
| Permisos `academic.*`, roles TEACHER/FINANCE/STUDENT | EXTRACT |
| Feature flags comment «BackOffice AprendeHoy» | LEGACY |

Búsqueda en `src/` de «Seminario Eclesiástico Mayor», `seminarioipn`, `seminario-ipn`, `Centro SEM`, `logo-sem` produce decenas de hits; la lista anterior cubre las clases de riesgo, no cada línea.
