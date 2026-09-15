# OT-GROWTH-SEM-LEGACY-AUDIT-001 — Auditoría de identidad heredada Portal SEM

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SEM-LEGACY-AUDIT-001 |
| Tipo | Auditoría / operatividad (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | Arquitectura Growth OS multi-tenant; [OT-GROWTH-PLATFORM-HOST-ISOLATION-001](./OT-GROWTH-PLATFORM-HOST-ISOLATION-001.md); [OT-GROWTH-DOMAIN-PLATFORM-001](./OT-GROWTH-DOMAIN-PLATFORM-001.md); [OT-GROWTH-LEGAL-PLATFORM-001](./OT-GROWTH-LEGAL-PLATFORM-001.md) |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Detectar y clasificar dónde SEM / Portal SEM / Seminario actúa como identidad global de plataforma |
| Fuera de alcance | DNS · Cloudflare · Dokploy · Meta · WhatsApp · datos productivos · implementación de correcciones · reemplazos masivos · nuevo motor/app |

**Restricciones cumplidas:** sin tocar DNS/infra externa; sin modificar datos productivos; sin alterar identidad legítima SEM/ADL; sin implementar fixes en esta OT.

---

## Gate final

**APTO CON AJUSTES**

El literal **«Portal SEM»** ya **no** aparece en el HTML de las superficies críticas comprobadas en local (`/`, `/admin/login`, `/legal`). La identidad de producto de plataforma en UI es **Growth OS** (`PLATFORM_DISPLAY_NAME`).

Sigue habiendo **acoplamientos operativos** donde SEM actúa como default/fallback de plataforma o contamina superficies de plataforma vía resolución de host / metadata raíz. No bloquean por sí solos el go-live de `growthos.mentorprime.cl` **si** se cumple el aislamiento Host→Tenant (HOST-ISOLATION) y **no** existe Domain que mapee ese host a T001. Sí conviene corregir antes o en paralelo los ajustes mínimos de la §7.

---

## 1. Dónde todavía aparece Portal SEM / SEM

### 1.1 Literal «Portal SEM»

| Ubicación | Runtime visible | Clase |
| --- | --- | --- |
| `.env` local `EMAIL_FROM="Portal SEM <…>"` | No como display name (el motor extrae solo buzón) | **C** (higiene env) |
| `src/core/branding/display.ts` → `rewriteLegacyPlatformProductName` | Defensivo; reescribe a Growth OS | **C** |
| Tests (`saas-email-identity`, `saas-platform-credits`, `smoke-e2e`) | No productivo | **D** |
| Docs históricas (`docs/ot/*`, `CHANGELOG`, `RELEASES`, prototipos UX) | No productivo | **D** |
| `package.json` / lock `name: "portal-sem"` | Nombre npm interno | **C** / **D** |

**Evidencia runtime (localhost:3000, 2026-09-11):**

| Ruta | `<title>` | Contiene «Portal SEM» | Contiene «Growth OS» | Contiene «Seminario» |
| --- | --- | --- | --- | --- |
| `/` | Seminario Eclesiástico Mayor | No | Sí (créditos plataforma) | Sí |
| `/admin/login` | Seminario Eclesiástico Mayor | No | Sí (ProductMark) | No en body |
| `/legal` | Legales \| Growth OS | No | Sí | No |

### 1.2 SEM / Seminario / T001 / S001 (código y runtime)

| Área | Hallazgo | Clase |
| --- | --- | --- |
| `sem-site-identity.ts`, `migrate-sem.ts`, `ensureSemTenantFoundation` | Pack e identidad T001/S001 | **A** |
| `SEM_DEFAULT_MENUS`, `createSemDefaultForms` (gated `isSemTenant`) | Seeds solo T001 | **A** |
| Assets `logo-sem-*`, favicon SEM en pack T001 | Branding del tenant | **A** |
| `sem-app-url-compat` + loopback | Compat dev Host→T001 | **C** (acotado post HOST-ISOLATION) |
| Singleton `cms_config` + mirror `site_config` SEM | Bootstrap/legacy 1:1 | **C** |
| Root `generateMetadata` → `getSiteMetadata()` | Metadata del Espacio resuelto por Host en **toda** la app | **B** en superficies de plataforma |
| `/admin/login` tab title = SEO del tenant | Body Growth OS; title SEM en loopback | **B** |
| `updateSiteConfig` fallback `SEM_TENANT_ID` | Default arquitectónico a SEM | **B** |
| `getSiteConfig` / scripts sin Host → singleton SEM | Compat fuera de HTTP | **C** |
| `MenuListClient` default `seedMenus = DEFAULT_MENUS` (= SEM) | Fallback UI admin a menús SEM | **B** |
| `form-experience-defaults` `buildFromLanding` | Copyright / `contacto@sem.cl` SEM en plantilla de landings | **B** (si se usa fuera de T001) |
| `ClosingSeal` hardcode `logo-sem-icon.svg` | Admisión closing SEM | **A** si solo SEM; **B** si se reutiliza en otro Espacio |
| PDF handoff `logo-sem-isotype-line.png` | Logo SEM fijo en reporte | **B** (o **A** si el handoff es solo SEM) |
| Admission `source: "portal-sem"` | Enum/histórico de origen | **C** |
| Crypto salt / S3 test key `portal-sem-*` | Identificadores internos | **C** (no renombrar a la ligera) |
| `MONGODB_DB=SeminarioIPN` (env local) | Nombre de DB histórico | **C** |
| Keycloak realm/client `seminario-ipn*` | IdP del primer tenant | **A** / **C** (compartido plataforma) |
| Docs/prototipos «Centro SEM», «Portal SEM» | Solo documentación | **D** |

---

## 2. Qué es legítimo del tenant SEM (no cambiar)

Clasificación **A** — pertenece a T001 / `seminario-ipn` / S001:

- `SEM_SITE_IDENTITY` (nombre, shortName SEM, IPN, logos, SEO, contacto).
- Foundation/migración `ensureSemTenantFoundation` y migración `006-saas-foundation`.
- Menús «El Seminario» / pack IPN vía `isSemTenant`.
- Formularios base `createSemDefaultForms` / convocatorias Talca cuando `isSemTenant`.
- Contenido editorial, admisión, closing defaults, seeds de contenido SEM.
- Archivos estáticos `public/images/logo-sem-*` referenciados por `site_config` de SEM.
- Datos CMS productivos del Espacio SEM (nombre institucional, SEO, branding).

**Regla:** SEM solo cuando `tenantId === seminario-ipn` (T001) o el Host resuelve Domain→Site→Tenant a ese Espacio.

---

## 3. Qué es legacy global de plataforma

Clasificación **B** — SEM usado como identidad/default de plataforma:

1. **Metadata HTML raíz** (`src/app/layout.tsx` → `getSiteMetadata`) aplica el SEO del Espacio resuelto a rutas de plataforma (`/admin/login`, etc.). En loopback, el Host cae en `sem-app-url-compat` → title «Seminario Eclesiástico Mayor» aunque el chrome diga Growth OS.
2. **`updateSiteConfig`**: si falta tenant, fuerza `SEM_TENANT_ID`.
3. **`MenuListClient`**: default de seeds = menús SEM si el caller no pasa `seedMenus`.
4. **Plantillas form experience** (`buildFromLanding`): copyright y email SEM embebidos en código compartido.
5. **Nombres internos** que aún dicen «portal-sem» en artefactos de plataforma (npm package, salts, source enum) — no son copy visible, pero refuerzan el acoplamiento mental/operativo.

Clasificación **C** — compatibilidad aún útil:

- `source: "sem-app-url-compat"` (solo loopback tras HOST-ISOLATION).
- `cms_config` singleton + mirror a `site_config` SEM.
- `rewriteLegacyPlatformProductName` (créditos/fallbacks).
- `EMAIL_FROM` con display name legado (ignorado por transporte; confunde ops).
- Salts/keys `portal-sem-*` (cambiar rompería secretos cifrados).

---

## 4. Qué afecta al usuario

| Superficie | Efecto hoy | Severidad para `growthos.mentorprime.cl` |
| --- | --- | --- |
| Portal SEM en body/HTML | **No** observado en `/`, login, legales | Baja (ya desacoplado) |
| Title / favicon del portal SEM en host SEM | Correcto: identidad del Espacio | N/A (legítimo) |
| Title de `/admin/login` en loopback | Muestra Seminario aunque el mark sea Growth OS | Media en dev; en host de plataforma **sin** Domain SEM → debería ser Growth OS |
| `/legal/*` | Growth OS | OK |
| Emails | From visible = `institution.name` del Espacio; buzón = `EMAIL_FROM` parseado | Baja si mailbox correcto; higiene env pendiente |
| Favicon | Del `site_config` del Espacio resuelto; sin tenant → sin icon tenant | En host plataforma sin Domain: sin favicon SEM (correcto) |
| Créditos footer | `PLATFORM_CREDITS` = Growth OS (defaults) | OK |

### Origen del nombre visible «Portal SEM»

**Conclusión:** el string «Portal SEM» **no** se está sirviendo hoy desde hardcode de UI, CMS ni metadata de producto. Donde aún vive:

1. **Variable de entorno** `EMAIL_FROM` (display name legado; **no** llega al From visible).
2. **Capa defensiva** `rewriteLegacyPlatformProductName` (por si créditos/DB traen el string).
3. **Documentación / package name / tests**.

Lo que el usuario **sí** ve como identidad SEM en local es **«Seminario Eclesiástico Mayor» / SEM**, obtenido de:

```text
Host (localhost)
  → resolvePublicTenantByHost
  → source: sem-app-url-compat (loopback)
  → T001 / S001
  → site_config / cms_config (seo.title / institution.name)
  → getSiteMetadata() / PortalShell
```

No viene de `APP_NAME` / `SITE_NAME` (esas variables **no existen**).  
`PLATFORM_DISPLAY_NAME = "Growth OS"` es el nombre de plataforma hardcodeado en branding.

---

## 5. Qué afecta arquitectura / runtime

| Mecanismo | Rol | Estado |
| --- | --- | --- |
| Host → Domain → Site → Tenant | Identidad de Espacio | Correcto |
| APP_URL / NEXT_PUBLIC_APP_URL | Origen canónico de **plataforma** | Correcto post HOST-ISOLATION |
| `sem-app-url-compat` | Solo loopback → T001 | Compat temporal (**C**) |
| `ensureSemTenantFoundation` | Bootstrap T001; hosts bootstrap solo loopback | Correcto / **C** |
| Root metadata acoplada al tenant del Host | Contamina login/plataforma cuando Host = SEM | **B** |
| Defaults vacíos `createDefaultSiteConfig` | Sin SEM | Correcto |
| Pack SEM vs PLATFORM_DEFAULT_MENUS | Bifurcado por `isSemTenant` | Correcto en provision; fallback UI débil en MenuListClient |

---

## 6. Qué corregir antes de publicar `growthos.mentorprime.cl`

### Bloqueantes operativos (humanos / config; fuera de código de esta OT)

1. **DNS/TLS** del host (ya tratado en DOMAIN-PLATFORM; no tocar aquí).
2. **Confirmar** que **no** existe fila en `domains` con host `growthos.mentorprime.cl` → T001/S001.
3. **Env productivo:** `APP_URL` / `NEXT_PUBLIC_APP_URL` = origen plataforma; `EMAIL_FROM` = **solo buzón** (sin «Portal SEM»).
4. Desplegar build que incluya **HOST-ISOLATION** (APP_URL público ≠ elegible SEM).

### Ajustes de código recomendados antes o en OT inmediata (mínimos)

| Prioridad | Ajuste | Por qué |
| --- | --- | --- |
| P0 UX plataforma | Metadata propia en `/admin/login` (y auth frames) → `Growth OS` | Evita title del Espacio en superficie de plataforma |
| P1 | No default `SEM_TENANT_ID` en `updateSiteConfig` sin tenant | Evita escritura accidental a SEM |
| P1 | `MenuListClient` → `PLATFORM_DEFAULT_MENUS` o seed obligatorio | Evita sembrar menús SEM en otro Espacio |
| P2 | Neutralizar copyright/email en `buildFromLanding` o gate `isSemTenant` | Evita copy SEM en experiencias nuevas |
| P2 | Higiene env documentada (EMAIL_FROM, nombres DB) | Ops claros |
| P3 | Docs título «Portal SEM» | Solo claridad (**D**) |

**No** hace falta reemplazar «SEM» por «Growth OS» en pack T001, assets, ni foundation.

---

## 7. Propuesta de cambio mínimo (reutilizar lo existente)

Sin nuevo motor ni app:

1. **Metadata auth:** en `admin/login` (y rutas `ProductAuthFrame`) exportar `generateMetadata` con `PLATFORM_DISPLAY_NAME`, igual que `/legal` y `/platform/layout` ya hacen para plataforma.
2. **Config write:** exigir `tenantId` explícito; eliminar fallback silencioso a `SEM_TENANT_ID`.
3. **Menús admin:** pasar siempre `getDefaultMenusForTenant(tenant)` (la página admin ya puede; endurecer el default del client).
4. **Form experience:** en `buildFromLanding`, footer vacío o `institution`-driven; mover copy SEM a seed T001 (`sem-content` / `isSemTenant`).
5. **Env:** alinear `.env.example` (ya mailbox-only) con env real; no tocar salts `portal-sem-*` sin plan de re-cifrado.
6. **Mantener:** `ensureSemTenantFoundation`, `sem-app-url-compat` loopback, `SEM_SITE_IDENTITY`, rewrite legacy de créditos.

---

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Domain humano mapea `growthos…` → SEM | Host de plataforma sirve T001 | Checklist ops; tests HOST-ISOLATION |
| Quitar `sem-app-url-compat` ya | Rompe local multi-puerto sin Domain | Mantener loopback hasta Domain local |
| Renombrar salt crypto | Invalida secretos de integraciones | No renombrar en esta fase |
| Reemplazo ciego SEM→Growth OS | Destruye identidad T001 | Solo superficies plataforma / defaults |
| Cambiar `MONGODB_DB` name | Operación de infra | Fuera de alcance; cosmético |
| Keycloak realm SEM como IdP único | Acoplamiento IdP–primer cliente | OT futura de identidad plataforma |

---

## 9. Clasificación consolidada (índice)

| ID | Hallazgo | A | B | C | D |
| --- | --- | --- | --- | --- | --- |
| H1 | Pack `SEM_SITE_IDENTITY` / logos / SEO SEM | ✓ | | | |
| H2 | `ensureSemTenantFoundation` + migrate-sem | ✓ | | ✓ | |
| H3 | `sem-app-url-compat` (loopback) | | | ✓ | |
| H4 | Metadata raíz hereda tenant en login | | ✓ | | |
| H5 | Literal «Portal SEM» en UI | — ausente — | | | |
| H6 | `EMAIL_FROM` display name legado | | | ✓ | |
| H7 | `rewriteLegacyPlatformProductName` | | | ✓ | |
| H8 | `updateSiteConfig` → SEM default | | ✓ | | |
| H9 | `MenuListClient` DEFAULT_MENUS = SEM | | ✓ | | |
| H10 | Form landing copyright SEM compartido | | ✓ | | |
| H11 | ClosingSeal / PDF logo-sem | ✓* | ✓* | | |
| H12 | `source: "portal-sem"` / salts / package name | | | ✓ | |
| H13 | Docs/prototipos Portal SEM | | | | ✓ |
| H14 | Tests anti–Portal SEM | | | | ✓ |
| H15 | `/legal` + ProductMark Growth OS | ✓ plataforma | | | |
| H16 | Defaults `createDefaultSiteConfig` neutros | ✓ plataforma | | | |

\*H11: **A** si el flujo es exclusivo SEM; tratar como **B** si se reutiliza en Espacios nuevos.

---

## 10. Acta / veredicto

| Pregunta | Respuesta |
| --- | --- |
| ¿«Portal SEM» sigue como nombre de producto en UI? | **No** (evidencia local). |
| ¿De dónde sale el nombre SEM que sí se ve? | Tenant T001 vía Host (loopback compat) + `site_config` / SEO CMS. |
| ¿Growth OS es la identidad de plataforma? | **Sí** (`PLATFORM_DISPLAY_NAME`, login mark, legales, créditos default). |
| ¿Listo para publicar el host de plataforma? | **APTO CON AJUSTES**: aislamiento host ya tratado; falta checklist Domain/env + metadata auth + defaults residuales. |
| ¿Abrir otra OT automáticamente? | **No.** |

**GATE: APTO CON AJUSTES**

---

## Apéndice — Superficies revisadas

Código: `src/core/branding`, `src/core/tenant/*`, `src/core/seo`, `src/lib/cms/{metadata,config,defaults,menu-defaults,form-experience-defaults,asset-paths}`, `src/lib/notifications/{identity,transport}`, `src/app/layout.tsx`, `src/app/admin/login`, `src/app/legal/*`, `src/app/platform/*`, emails, roles (códigos neutros), seeds SEM.

Config: `.env.example`, env local (solo claves de identidad; sin secretos en acta).

Runtime local: GET `/`, `/admin/login`, `/legal`.

Docs: auditorías HOST-ISOLATION / DOMAIN / LEGAL; glosario; README.
