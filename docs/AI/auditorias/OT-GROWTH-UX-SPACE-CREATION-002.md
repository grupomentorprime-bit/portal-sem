# OT-GROWTH-UX-SPACE-CREATION-002 — Cierre funcional Crear Espacio universal

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-SPACE-CREATION-002 |
| Tipo | Cierre funcional / backend |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-UX-SPACE-CREATION-001](./OT-GROWTH-UX-SPACE-CREATION-001.md) (APTO VISUAL · handoff) |
| Estado | **CERRADA · APTO** |
| Alcance | Integrar handoff Agente 1: categorías universales, `siteName` default, host `PLATFORM_BASE_DOMAIN`, slug/colisiones, aislamiento multi-tenant |
| Fuera de alcance | Redesign UI · packs por rubro · onboarding paralelo · lógica educativa especial · migración legacy · IAM · Growth Core · Mensajes · Ventas |

**Restricciones cumplidas:** sin rediseñar la pantalla; sin migrar `institution`/`academy`; tipo no oculta ni crea módulos distintos; sin hardcodear dominios de producto.

---

## Gate final

# CREAR ESPACIO UNIVERSAL · CERRADO · APTO

Un operador de Growth OS puede crear Espacios de cualquier categoría base (`business` · `education` · `social` · `community` · `independent` · `other`), con identificador normalizado, Sitio por defecto = nombre del Espacio, y dirección inicial desde `PLATFORM_BASE_DOMAIN` en producción (localhost en dev). SEM/ADL no se alteran.

---

## 1. Handoff Agente 1 — resuelto

| # | Pendiente | Resolución |
| --- | --- | --- |
| 1 | Labels legacy | **Sin migración** — `institution`/`academy` siguen legibles vía `labelTenantType` |
| 2 | `siteName` vacío | **Servidor:** `siteName = input.siteName?.trim() \|\| name` |
| 3 | Host con `PLATFORM_BASE_DOMAIN` | UI propone `{id}.{base}` vía prop servidor; API también resuelve host vacío con `buildPlatformSubdomainHost` |
| 4 | Packs por categoría | **No** — mismo `createDefaultSiteConfig` / mismos módulos |
| 5 | Filtro catálogo | Sin cambios; labels nuevas aparecen al crear |

---

## 2. Cambios

| Archivo | Rol |
| --- | --- |
| `src/lib/platform/propose-space-host.ts` | Propuesta de host inicial (base o localhost) |
| `src/core/tenant/create-platform-space.ts` | Default `siteName`; host vacío → `PLATFORM_BASE_DOMAIN` |
| `src/components/platform/PlatformCreateSpacePanel.tsx` | Usa `proposeInitialSpaceHost` + prop `platformBaseDomain` |
| `src/components/platform/PlatformSpacesCatalog.tsx` | Propaga `platformBaseDomain` |
| `src/app/platform/page.tsx` | `resolvePlatformBaseDomain()` → catálogo |
| `src/app/api/platform/spaces/route.ts` | `siteName` opcional en body |
| `tests/baseline/growth-ux-space-creation-002.test.ts` | Cierre funcional + Mongo |
| `tests/baseline/growth-ux-space-creation-001.test.ts` | Regresión UX alineada |
| `tests/baseline/platform-create-space.test.ts` | Timeout Mongo |

---

## 3. Matriz de verificación

| Criterio | Resultado |
| --- | --- |
| `business` / `education` / `social` / `community` / `independent` / `other` crean, guardan y leen por tenant | **OK** |
| Lectura legacy `institution` / `academy` | **OK** (sin migrar) |
| Categoría no bloquea ni crea módulos distintos | **OK** (fingerprint `modules` idéntico) |
| `siteName` ausente → nombre del Espacio | **OK** |
| Host prod vía `PLATFORM_BASE_DOMAIN` (sin hardcode) | **OK** |
| Slug con acentos | Mentor Capacitación → `mentor-capacitacion` · Panadería Central → `panaderia-central` |
| Colisión slug | `slug_taken` |
| Aislamiento SEM / ADL | `updatedAt`/`type` intactos |
| Sin packs / onboarding / lógica educativa | **OK** |

---

## 4. Pruebas (2026-09-15)

```bash
npx tsx --test tests/baseline/growth-ux-space-creation-001.test.ts
npx tsx --test tests/baseline/growth-ux-space-creation-002.test.ts
npx tsx --test tests/baseline/platform-create-space.test.ts
```

| Suite | Resultado |
| --- | --- |
| `growth-ux-space-creation-001` | **5/5 PASS** |
| `growth-ux-space-creation-002` | **6/6 PASS** (contrato + provisión Mongo) |
| `platform-create-space` | **8/8 PASS** |
| **Total** | **19 PASS / 0 FAIL** |

---

## 5. Fuera de alcance (no tocado)

Redesign del modal · migración SEM/ADL a `education` · packs por rubro · onboarding paralelo · IAM · Growth Core · Mensajes · Ventas · DNS/TLS real.

---

## 6. Veredicto

**CREAR ESPACIO UNIVERSAL · CERRADO · APTO**

Growth OS crea Espacios para cualquier organización con el mismo motor (`createPlatformSpace` → `provisionTenantFoundation`), clasificación horizontal y defaults de Sitio/host seguros para producción.
