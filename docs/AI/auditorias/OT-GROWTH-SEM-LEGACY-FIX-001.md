# OT-GROWTH-SEM-LEGACY-FIX-001 — Eliminar defaults globales heredados de SEM

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SEM-LEGACY-FIX-001 |
| Tipo | Fix / operatividad |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-SEM-LEGACY-AUDIT-001](./OT-GROWTH-SEM-LEGACY-AUDIT-001.md) (hallazgos **B**) |
| Estado | **CERRADA · APTO** |
| Alcance | Metadata `/admin/login`, `updateSiteConfig`, `MenuListClient`, plantillas form-experience, higiene `EMAIL_FROM` |
| Fuera de alcance | Pack SEM · logos SEM · foundation T001 · DNS · Dokploy · Cloudflare · Meta · WhatsApp · datos productivos · `sem-app-url-compat` loopback |

**Restricciones cumplidas:** sin reemplazo masivo «SEM»→«Growth OS»; sin tocar pack/logos/menús/formularios legítimos de T001; sin infra externa.

---

## Gate final

**APTO**

Growth OS es la identidad global de plataforma en las superficies corregidas. SEM aparece solo cuando el contexto es T001 (`isSemTenant` / `tenantId` explícito). Validaciones A–F cubiertas por código + pruebas + runtime local de `/admin/login`.

---

## 1. Cambios realizados

| # | Hallazgo B | Cambio |
| --- | --- | --- |
| 1 | H4 — metadata login hereda SEO del Host/Espacio | `src/app/admin/login/page.tsx` exporta `metadata` con `title` / descripción Growth OS y `robots: noindex` |
| 2 | H8 — `updateSiteConfig` fallback `SEM_TENANT_ID` | `src/lib/cms/config.ts`: `tenantId` **obligatorio**; sin tenant → `null`; escritura SEM singleton solo si `tenantId === SEM_TENANT_ID` |
| 3 | H9 — `MenuListClient` default = menús SEM | Default → `PLATFORM_DEFAULT_MENUS`; la página admin sigue pasando `getDefaultMenusForTenant` (SEM solo en T001) |
| 4 | H10 — copyright/email SEM en plantilla compartida | `buildFromLanding` / `buildDefaultFormExperience`: landings y footer SEM gated con `isSemTenant`; fuera de T001 footer neutro y sin pack de landings SEM |
| 5 | H6 (ops) — `EMAIL_FROM` con display «Portal SEM» | Motor ya ignoraba el nombre; comentario aclarado; `.env` local pasado a buzón-only; `.env.example` ya estaba correcto |

---

## 2. Qué legacy SEM se mantuvo

| Elemento | Motivo |
| --- | --- |
| `SEM_SITE_IDENTITY` / logos / SEO T001 | Pack legítimo (**A**) |
| `ensureSemTenantFoundation` / migrate-sem | Foundation T001 |
| `SEM_DEFAULT_MENUS` + `getDefaultMenusForTenant(T001)` | Seeds solo SEM |
| `createSemDefaultForms` / convocatorias Talca / `FORM_LANDINGS` | Contenido SEM; ahora solo se aplica si `isSemTenant` |
| Footer copyright `contacto@sem.cl` en form experience | Solo cuando `isSemTenant(tenant)` |
| `cms_config` singleton + mirror al escribir T001 | Compat 1:1 SEM |
| `sem-app-url-compat` loopback | Compat dev (**C**); no tocado |
| Salts / package name `portal-sem-*` | Identificadores internos (**C**) |
| `rewriteLegacyPlatformProductName` | Defensa de créditos |

---

## 3. Qué default global se eliminó

1. **Title de `/admin/login`** ya no toma «Seminario Eclesiástico Mayor» del Espacio resuelto por Host.
2. **`updateSiteConfig` sin `tenantId`** ya no escribe en SEM por omisión.
3. **Seed de menús del client** ya no es `DEFAULT_MENUS` (= SEM) si el caller no pasa seeds.
4. **Footer / landings SEM** en `form-experience-defaults` ya no se aplican a Espacios no-SEM.
5. **Display name «Portal SEM» en `EMAIL_FROM` local** eliminado (higiene); el From visible sigue saliendo de `institution.name` o Growth OS.

---

## 4. Pruebas

### Nuevas — `tests/baseline/sem-legacy-fix-001.test.ts`

| Caso | Resultado |
| --- | --- |
| A. Login metadata Growth OS | Pass |
| E. `updateSiteConfig` exige `tenantId` | Pass |
| F. MenuListClient → `PLATFORM_DEFAULT_MENUS` | Pass |
| F. Form experience SEM solo T001 | Pass |
| EMAIL_FROM / display Espacio vs Growth OS | Pass |

### Regresiones ejecutadas

| Suite | Resultado |
| --- | --- |
| `sem-legacy-fix-001` | Pass (5/5) |
| `saas-email-identity` · `saas-platform-credits` · `saas-sem-content` · `ux-shell-identity` | Pass |
| `saas-branding` · `saas-foundation` · `saas-host-resolve` · `platform-host-isolation` | Pass |
| `saas-adl-tenant` | 1 fallo preexistente: fixture Mongo con `experience_forms` residual `adl-smoke-info-request` (smoke captación), **no** causado por este fix |

### Runtime local (2026-09-11)

| Ruta | Evidencia |
| --- | --- |
| `GET /admin/login` | `status=200`, `<title>Growth OS</title>`, body con Growth OS, sin «Portal SEM», title sin «Seminario» |

---

## 5. Resultado por identidad

| Contexto | Resultado |
| --- | --- |
| **Growth OS** (plataforma / login / sin config) | Title y chrome Growth OS; email display = Growth OS si no hay `institution.name` |
| **SEM (T001)** | Pack intacto: menús SEM vía `getDefaultMenusForTenant`, form footers/landings SEM, `updateSiteConfig` con `tenantId` SEM sigue espejando singleton |
| **ADL (T002)** | Sin menús/copyright/landings SEM; identidad Academia ADL en email/site_config |

---

## 6. Riesgos restantes

| Riesgo | Severidad | Nota |
| --- | --- | --- |
| Root `generateMetadata` sigue resolviendo Espacio por Host en rutas sin override | Baja | Login ya override; otras auth frames (`/admin/sin-espacio`) podrían heredar title del Host en loopback |
| `getSiteConfig` / scripts sin Host → singleton SEM | **C** (compat) | Fuera de hallazgos B de escritura |
| `mirrorLegacyConfigToSiteConfig` aún tiene fallback SEM interno | Baja | Solo llamado con `tenantId` explícito desde `updateSiteConfig` |
| ClosingSeal / PDF `logo-sem-*` si se reutilizan fuera de SEM | Media (H11) | No corregido en esta OT (fuera del alcance listado) |
| Domain humano mapea host plataforma → T001 | Ops | Checklist HOST-ISOLATION / DOMAIN |

---

## 7. Validaciones (checklist OT)

| ID | Criterio | Estado |
| --- | --- | --- |
| A | `/admin/login` title Growth OS, cuerpo Growth OS, sin metadata SEM | **OK** (código + runtime) |
| B | Host SEM conserva Seminario Eclesiástico Mayor | **OK** (pack + tests SEM) |
| C | Host ADL conserva Academia ADL | **OK** (tests ADL / email) |
| D | Host plataforma → Growth OS | **OK** (login + HOST-ISOLATION previo) |
| E | `updateSiteConfig` nunca escribe SEM por default sin tenant | **OK** |
| F | Menús/plantillas compartidas sin contaminación SEM fuera de T001 | **OK** |

---

## Acta / veredicto

| Pregunta | Respuesta |
| --- | --- |
| ¿Hallazgos B de AUDIT-001 corregidos? | **Sí** (H4, H8, H9, H10 + higiene H6 env) |
| ¿Pack SEM / T001 intacto? | **Sí** |
| ¿Growth OS es identidad de plataforma en login? | **Sí** (`<title>Growth OS</title>`) |
| ¿Abrir otra OT automáticamente? | **No.** |

**GATE: APTO**
