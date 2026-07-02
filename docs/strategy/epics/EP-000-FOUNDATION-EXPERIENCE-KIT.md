# EP-000 — Foundation / Experience Kit

| Atributo | Valor |
| --- | --- |
| Código | EP-000 |
| Nombre | Foundation / Experience Kit |
| Estado | ✅ **COMPLETADA** |
| Fecha cierre | 2026-07-01 |
| Versión referencia | v2.5.2 |

---

## Objetivo

Establecer la base visual y técnica compartida de AprendeHoy: tokens corporativos, componentes reutilizables, Design System documentado, catálogo interno, gobernanza de desarrollo y validación automática en CI — preparada para múltiples instituciones (multi-tenant).

---

## OTs asociadas

| OT | Título | Estado |
| --- | --- | --- |
| [OT-BRANDING-001](../ot/OT-BRANDING-001.md) | Auditoría corporativa de branding | ✅ |
| [OT-BRANDING-002](../ot/OT-BRANDING-002.md) | Infraestructura de tokens y validador | ✅ |
| [OT-BRANDING-003](../ot/OT-BRANDING-003.md) | Migración portal público | ✅ |
| [OT-BRANDING-004](../ot/OT-BRANDING-004.md) | Migración panel administrativo (CMS) | ✅ |
| [OT-BRANDING-005](../ot/OT-BRANDING-005.md) | Gobernanza Design System & Experience Kit | ✅ |

> OT-BRANDING-001: ver [AUDIT-CORPORATE-BRANDING-001](../audits/AUDIT-CORPORATE-BRANDING-001.md)

---

## Hito alcanzado

Con estas cinco OTs el proyecto dispone de:

| Capacidad | Evidencia |
| --- | --- |
| Sistema de tokens corporativos | `src/styles/tokens/brand.css`, `colors.css` |
| Componentes reutilizables | `src/components/ui/` |
| Design System documentado | `docs/design/INTRODUCTION.md` y familia Experience Kit |
| Catálogo visual interno | `/internal/design-system` |
| Gobernanza para nuevos desarrollos | `CONTRIBUTING.md`, `PULL_REQUEST_CHECKLIST.md` |
| Validación automática en CI | `npm run check:branding`, `.github/workflows/branding.yml` |
| Cero deuda conocida de branding | Baseline 0, modo estricto |
| Arquitectura multi-tenant por tokens | Documentado en `INTRODUCTION.md` |

---

## Dependencias

| Dependencia | Estado |
| --- | --- |
| Platform Core (Foundation v2.0) | ✅ [FOUNDATION-COMPLETE.md](../FOUNDATION-COMPLETE.md) |
| Manual de marca SEM | ✅ `docs/design/MANUAL-DE-MARCA.md` |

---

## Criterios de cierre

| Criterio | Estado |
| --- | --- |
| 100 % plataforma en tokens `--sem-*` / `--color-*` | ✅ |
| Validador estricto en build y CI | ✅ |
| Documentación Experience Kit completa | ✅ |
| Catálogo visual funcional | ✅ |
| Política de contribución y versionado publicada | ✅ |
| Sin regresiones visuales críticas | ✅ |

---

## Declaración de cierre

La épica **EP-000 — Foundation / Experience Kit** queda oficialmente **cerrada**.

Cualquier desarrollo futuro debe apoyarse en esta base en lugar de crear nuevas reglas visuales. Los colores, componentes y patrones documentados son el estándar obligatorio del proyecto.

---

## Cambio de etapa

A partir de julio 2026:

1. **No** se abren nuevas OTs de infraestructura de branding.
2. Las OTs de producto usan nomenclatura orientada a experiencia y negocio (`OT-PORTAL-*`, `OT-CRM-*`, etc.).
3. El foco pasa a **funcionalidades y experiencias de usuario** sobre el Core ya establecido.

**Siguiente épica recomendada:** [EP-001 — Portal Institucional Premium](./EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)

---

## Referencias

| Documento | Enlace |
| --- | --- |
| Roadmap producto | [PRODUCT-ROADMAP-2026-2028.md](../PRODUCT-ROADMAP-2026-2028.md) |
| Branding System | [BRANDING-SYSTEM.md](../design/BRANDING-SYSTEM.md) |
| Auditoría cierre | [AUDIT-BRANDING-005](../audits/AUDIT-BRANDING-005.md) |
| Platform Core | [FOUNDATION-COMPLETE.md](../FOUNDATION-COMPLETE.md) |

---

> **"La identidad visual dejó de ser una tarea de migración. Es un estándar permanente del proyecto."**
