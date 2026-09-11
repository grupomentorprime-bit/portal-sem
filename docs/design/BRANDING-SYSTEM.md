# BRANDING-SYSTEM.md — Identidad multi-tenant Growth OS

**Estado:** Activo  
**Contrato:** Growth OS tiene su identidad. Cada Espacio tiene la suya.  
**Dependencias:** ADR-008, ADR-009, OT-GROWTH-SAAS-006, OT-GROWTH-UX-SHELL-002

---

## Contrato de identidad (obligatorio)

| Capa | Superficie | Fuente | Independiente de |
| --- | --- | --- | --- |
| **Growth OS Master** | `/platform`, login global, sin Espacio, consola dueño/operador | `--growth-os-*` + `PlatformNeutralTheme` | Espacio activo / `site_config` |
| **Espacio** | `/admin`, portal del Site | `site_config.branding` → `--brand-*` | Paleta Master y otros Espacios |

Reglas:

1. La paleta Master **no** depende del Espacio activo.
2. SEM, ADL y futuros clientes tienen identidad propia en su `site_config`.
3. Cambiar colores de un Espacio **no** cambia otro Espacio ni `/platform`.
4. Cambiar `--growth-os-*` **no** sobrescribe `site_config` de ningún cliente.
5. Edición: reutilizar `/admin/config?section=branding` (`BrandingPanel`) — **no** crear otro motor.
6. El administrador del Espacio edita su identidad con `settings.update`; no requiere Platform Admin.

### Prohibido

- Hardcodes por SEM/ADL en UI o CSS de producto
- Una paleta global compartida por todos los clientes
- Guardar branding de cliente en configuración global de plataforma
- Duplicar el motor de branding
- Permitir que `--brand-*` del Espacio contamine `/platform`

---

## Arquitectura de tokens

```
brand.css
  ├── --growth-os-*     ← paleta Master (plataforma)
  └── --sem-*           ← alias legacy → Master en :root (no = tenant SEM)

layout.tsx (host del Site)
  └── body style --brand-* desde site_config.branding

design-tokens.css (body)
  └── --brand-* → --color-* / alias --sem-* (siguen el Site)

PlatformNeutralTheme (/platform, auth)
  └── remapea --brand-* / --color-* / --sem-* → --growth-os-*
```

### Cadena de consumo

```
Espacio activo:
  site_config.branding → buildBrandThemeStyle → --brand-* → --color-* → componentes

Growth OS Master:
  brand.css (--growth-os-*) → PlatformNeutralTheme → --color-* locales → /platform + auth
```

Los componentes consumen tokens semánticos (`--color-primary`, `bg-primary`, etc.), nunca HEX de cliente.

---

## Growth OS Master

Definidos en `src/styles/tokens/brand.css`:

| Variable | Rol |
| --- | --- |
| `--growth-os-primary` | Primario de producto |
| `--growth-os-secondary` | Secundario |
| `--growth-os-accent` | Acento |
| `--growth-os-success` | Éxito |
| `--growth-os-light` | Acento cálido / warning |

`PlatformNeutralTheme` aísla `/platform` y frames de auth. Los nombres `--sem-*` en `:root` son **alias legacy** hacia Master; en `body` se remapean al Theme del Site.

---

## Identidad por Espacio (`site_config`)

Campos de marca soportados (edición en `BrandingPanel`):

| Campo | Uso |
| --- | --- |
| logo / favicon (media) | Marca visible |
| `primaryColor` | `--brand-primary` |
| `secondaryColor` | `--brand-secondary` |
| `backgroundColor` | `--brand-background` |
| `textColor` | `--brand-text` |

Packs de bootstrap (dato, no runtime):

| Espacio | Código | Pack |
| --- | --- | --- |
| SEM | T001 | `SEM_SITE_IDENTITY` / `semSiteBrandColors` |
| ADL | T002 | `ADL_SITE_IDENTITY` / `adlSiteBrandColors` |

La plantilla `createDefaultSiteConfig()` usa `colorDefaults` (Master) solo como semilla vacía. SEM/ADL materializan su pack en foundation; valores ya guardados **no** se pisan.

Persistencia: `PUT /api/cms/config` con `tenantId` de la sesión (`settings.update`) → `site_config` de ese Espacio únicamente.

---

## Alias semánticos

`colors.css` + `design-tokens.css` traducen marca → semántica. En superficies de Espacio, `--color-primary` sigue `--brand-primary` del Site. En `/platform`, `PlatformNeutralTheme` fuerza Master.

---

## Escala neutra y estados UI

Usar `--gray-50` … `--gray-900` y `--state-*` / `--color-danger`. No `zinc-*` / `slate-*` / paletas Tailwind genéricas de marca.

---

## Validador

```bash
npm run check:branding
```

Script: `scripts/check-branding.ts` — bloquea HEX no autorizados en componentes (HEX de marca viven en tokens / `site_config`).

Baseline de aislamiento: `tests/baseline/saas-branding.test.ts`, `ux-shell-identity.test.ts`, `saas-adl-tenant.test.ts`.

---

## Estado

| OT / ADR | Alcance | Estado |
| --- | --- | --- |
| OT-BRANDING-001→005 | Tokens + gobernanza | ✅ (histórico; docs SEM-first) |
| OT-GROWTH-SAAS-006 | Branding por Site | ✅ |
| OT-GROWTH-SAAS-009 | SEM + ADL aislados | ✅ |
| OT-GROWTH-UX-SHELL-002 | Master en `/platform` | ✅ |
| Este contrato | Master ≠ Espacio | ✅ Activo |

---

## Referencias

- [ADR-009](../architecture/ADR-009.md) — contrato de producto
- [OT-GROWTH-SAAS-006](../validation/OT-GROWTH-SAAS-006/README.md)
- [OT-GROWTH-UX-SHELL-002](../validation/OT-GROWTH-UX-SHELL-002/README.md)
- [OT-GROWTH-IDENTITY-MT-001](../validation/OT-GROWTH-IDENTITY-MT-001/README.md)
- Código: `src/core/branding/`, `PlatformNeutralTheme`, `BrandingPanel`, `src/styles/tokens/brand.css`
