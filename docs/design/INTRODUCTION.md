# Experience Kit — Introducción

**Código:** OT-BRANDING-005  
**Versión del sistema:** v1.0  
**Estado:** Activo

---

## Qué es el Experience Kit

El **Experience Kit** es el conjunto oficial de tokens, patrones y componentes visuales de **Growth OS**. Garantiza que la plataforma y los Espacios compartan la misma gramática de UI sin duplicar implementaciones ni mezclar marcas.

No es solo una biblioteca de UI: es la **política obligatoria** de cómo se construye cualquier interfaz en el proyecto.

**Identidad:** Growth OS tiene paleta Master (`--growth-os-*` / `/platform`). Cada Espacio (SEM, ADL, futuros) tiene la suya en `site_config`. Ver [BRANDING-SYSTEM.md](./BRANDING-SYSTEM.md).

La **identidad editorial del SEM** como cliente — cómo debe *sentirse* su portal público — está en [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md). No es la marca de Growth OS.

---

## Cuándo usar este sistema

| Situación | Acción |
| --- | --- |
| Nueva pantalla o feature | Consultar [COMPONENTS.md](./COMPONENTS.md) antes de crear markup |
| Nuevo color o estilo | **No** agregar HEX; extender tokens solo con justificación ([COLORS.md](./COLORS.md)) |
| Componente similar ya existe | Reutilizar `@/components/ui` ([CONTRIBUTING.md](./CONTRIBUTING.md)) |
| Pull Request con UI | Completar [PULL_REQUEST_CHECKLIST.md](./PULL_REQUEST_CHECKLIST.md) |
| Revisión visual | Seguir [VISUAL_QA.md](./VISUAL_QA.md) |

---

## Arquitectura multi-tenant

Un nuevo Espacio **nunca modifica componentes** ni la paleta Master. Solo define identidad en `site_config` (edición: `/admin/config?section=branding`).

```
Growth OS Master (--growth-os-*)     Espacio (site_config → --brand-*)
        │                                      │
        └──────────┬───────────────────────────┘
                   ↓
        Semantic Tokens (--color-*, --gray-*, --state-*)
                   ↓
        Experience Kit + UI (@/components/ui)
                   ↓
        /platform (Master)  |  /admin + portal (Espacio)
```

| Capa | Responsabilidad | Quién cambia |
| --- | --- | --- |
| Master `--growth-os-*` | Identidad de producto | Solo plataforma |
| `site_config.branding` | Logo/colores del Espacio | Admin del Espacio |
| Semantic Tokens | Alias y estados UI | Arquitectura |
| Experience Kit / UI | Tipografía, motion, componentes | Producto (compartido) |

Ver [BRANDING-SYSTEM.md](./BRANDING-SYSTEM.md) y [COLORS.md](./COLORS.md).

---

## Estructura de documentación

| Documento | Contenido |
| --- | --- |
| [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md) | Identidad editorial SEM — fotografía, lenguaje, storytelling |
| [DESIGN-PRINCIPLES.md](./DESIGN-PRINCIPLES.md) | Principios de decisión |
| [COLORS.md](./COLORS.md) | Paleta y cuándo usar cada token |
| [TYPOGRAPHY.md](./TYPOGRAPHY.md) | Escalas y jerarquía |
| [SPACING.md](./SPACING.md) | Sistema 8pt |
| [LAYOUT.md](./LAYOUT.md) | Grid, contenedores, breakpoints |
| [ICONS.md](./ICONS.md) | Lucide y convenciones |
| [MOTION.md](./MOTION.md) | Duraciones y animaciones |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG AA, foco, teclado |
| [COMPONENTS.md](./COMPONENTS.md) | Catálogo y especificaciones |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Flujo de nuevos componentes |
| [PULL_REQUEST_CHECKLIST.md](./PULL_REQUEST_CHECKLIST.md) | Checklist obligatorio |
| [VISUAL_QA.md](./VISUAL_QA.md) | Procedimiento QA visual |
| [VERSIONING.md](./VERSIONING.md) | Política de evolución v1.0 |

---

## Catálogo visual interno

Renderizado en vivo de todos los componentes:

**URL:** `/internal/design-system`

Incluye variantes, tamaños, estados, código recomendado y tokens utilizados.

---

## Validación automática

```bash
npm run check:branding   # 0 incidencias — modo estricto
npm run build            # incluye validación de branding
```

CI: `.github/workflows/branding.yml`

---

## Referencias

- [BRANDING-SYSTEM.md](./BRANDING-SYSTEM.md) — tokens corporativos SEM
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — índice histórico del sistema
- [MANUAL-DE-MARCA.md](./MANUAL-DE-MARCA.md) — identidad institucional
- OT: [OT-BRANDING-005](../ot/OT-BRANDING-005.md)
