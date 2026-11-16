# NELZURI — Baseline 19 fails vs master (condiciones equivalentes)

Fecha: 2026-11-16  
Rama: `feat/escritorio-mentor-prime` @ `2099ae4` (+ fixes de regresión NELZURI)  
Checkout principal comparado: worktree `master-baseline` @ `12ac89c` (merge-base / master local)  
Suite: `npm run test:baseline` (`tests/baseline/**/*.test.ts` + `tests/smoke/**/*.test.ts`)

## Resultado comparado

| Checkout | Tests | Pass | Fail |
| --- | ---: | ---: | ---: |
| feat (`tmp-baseline-feat.txt`) | 995 | 976 | **19** |
| master (`tmp-baseline-master.txt`) | 877 | 841 | **12** |

Los 12 de master ⊆ los 19 de feat. Diferencia bruta: **7 solo-feat**. Re-ejecución fair en master de esos candidatos (`tmp-master-fair.txt`): **4 siguen fallando** (entorno/dominio); **3 pasan en master** → regresiones de esta rama.

## Clasificación de los 19

### A. Preexistentes (12) — fallan igual en master

No tocar en NELZURI. Deuda ajena / portal SEM / smoke.

| # | Caso | Suite / archivo |
| --- | --- | --- |
| 1 | el tema de plataforma nombra Growth OS y el tema SEM no | `keycloak-platform-identity.test.ts` |
| 2 | F. MenuListClient… getDefaultMenusForTenant | `sem-legacy-fix-001.test.ts` (página menús retirada → `notFound`) |
| 3 | la home publicada no pasa por el fallback… /admision/2027 | contratos SEM públicos |
| 4 | home abre con branding institucional SEM | `sem-public-integration` / smoke |
| 5 | rutas de producto SEM responden 200 | smoke / integración |
| 6 | home expone navegación institucional SEM | smoke / integración |
| 7 | contenido CMS catch-all: 200/404 (got 307) | smoke |
| 8 | formulario público Talca Aurora carga por API (503) | `smoke-e2e.test.ts` |
| 9 | formulario inexistente responde 404 (503) | `smoke-e2e.test.ts` |
| 10 | admisión rechaza payload vacío con 422 (503) | `smoke-e2e.test.ts` |
| 11 | convocatoria rechaza registro vacío con 422 (503) | `smoke-e2e.test.ts` |
| 12 | página del formulario público renderiza HTML (307≠200) | `smoke-e2e.test.ts` |

Notas: varios smoke reciben **503/307** → runtime/servidor o datos locales, no regresiones del escritorio NELZURI.

### B. Entorno (4) — solo-feat en full run, pero fallan también en master bajo el mismo env

Dominio real del `.env` (`mentorprime.cl`) vs expectativa de test (`portales.test.example` / `localhost:3000`).

| # | Caso | Evidencia |
| --- | --- | --- |
| 13 | crea business/education… colisión… | actual `*.mentorprime.cl` ≠ `*.portales.test.example` |
| 14 | SEM con localhost pelado… | actual `*.mentorprime.cl` ≠ `*.localhost:3000` |
| 15 | conserva un dominio propio… | `platform_subdomain` undefined / dominio env |
| 16 | crear Espacio registra platform_subdomain | mismo mismatch de base domain |

Archivos: `growth-ux-space-creation-002.test.ts`, `platform-default-domains.test.ts`.  
Acción: fijar `PLATFORM_BASE_DOMAIN` (u equiv.) en el entorno de test; **no** cambiar provisión NELZURI.

### C. Regresiones NELZURI (3) — pasan en master fair; fallan en feat @ 2099ae4

| # | Caso | Causa raíz | Corrección |
| --- | --- | --- | --- |
| 17 | UI Entrar al Espacio… `/admin` | `PlatformEnterSpacePanel` redirige a `/escritorio` (commit `8a5a361`) | Actualizar guarda en `platform-enter-space.test.ts` |
| 18 | código runtime… sin if tenant===adl | Label hardcodeado `tenantId === "adl"` en `MentorDesktop.tsx` | Quitar rama ADL; copy uniforme “Entrar como soporte” |
| 19 | E. updateSiteConfig exige tenantId… | Firma pasó a `SiteConfigPatch` + `{ok:false,code:"missing"}` (mesa NELZURI) | Actualizar guarda en `sem-legacy-fix-001.test.ts` |

**Alcance de fix:** solo esos tres archivos. Sin tocar módulos SEM/smoke/dominios.

## Fuera de alcance (explícito)

- No merge a master / no despliegue.
- Commit de cierre UX `2099ae4` se mantiene.
- Problemas A y B documentados aquí; no se “arreglan” ensuciando otros módulos.
