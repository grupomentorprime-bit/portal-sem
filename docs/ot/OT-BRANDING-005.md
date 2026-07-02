# OT-BRANDING-005 — Design System Governance & Experience Kit (Final)

| Campo | Valor |
| --- | --- |
| **Tipo** | Fundación / Gobernanza |
| **Prioridad** | Alta |
| **Estado** | ✅ Completada |
| **Versión DS** | v1.0 |

## Dependencias

- ✅ OT-BRANDING-001 — Tokens corporativos
- ✅ OT-BRANDING-002 — Migración portal
- ✅ OT-BRANDING-003 — Componentes base
- ✅ OT-BRANDING-004 — Migración admin y validación estricta

## Objetivo

Institucionalizar el Design System como política obligatoria de AprendeHoy: reglas de desarrollo, documentación, catálogo de componentes y validación para consistencia visual en tenants actuales y futuros.

## Entregables

| # | Entregable | Ubicación | Estado |
| --- | --- | --- | --- |
| 1 | Experience Kit (documentación) | `docs/design/` | ✅ |
| 2 | Catálogo visual interno | `/internal/design-system` | ✅ |
| 3 | Especificaciones de componentes | `src/components/design-system/component-specs.ts` | ✅ |
| 4 | Guía de incorporación | `docs/design/CONTRIBUTING.md` | ✅ |
| 5 | Checklist PR obligatorio | `docs/design/PULL_REQUEST_CHECKLIST.md` | ✅ |
| 6 | Guía Visual QA | `docs/design/VISUAL_QA.md` | ✅ |
| 7 | Arquitectura multi-tenant | `docs/design/INTRODUCTION.md`, `BRANDING-SYSTEM.md` | ✅ |
| 8 | Convenciones formales | `docs/design/CONTRIBUTING.md`, `DESIGN-PRINCIPLES.md` | ✅ |
| 9 | Política de versionado | `docs/design/VERSIONING.md` | ✅ |

### Documentación Experience Kit

| Archivo | Propósito |
| --- | --- |
| [INTRODUCTION.md](../design/INTRODUCTION.md) | Qué es, cuándo usar, arquitectura multi-tenant |
| [DESIGN-PRINCIPLES.md](../design/DESIGN-PRINCIPLES.md) | Principios de decisión |
| [COLORS.md](../design/COLORS.md) | Paleta y tokens |
| [TYPOGRAPHY.md](../design/TYPOGRAPHY.md) | Escalas y jerarquía |
| [SPACING.md](../design/SPACING.md) | Sistema 8pt |
| [LAYOUT.md](../design/LAYOUT.md) | Grid y breakpoints |
| [ICONS.md](../design/ICONS.md) | Lucide |
| [MOTION.md](../design/MOTION.md) | Duraciones y animaciones |
| [ACCESSIBILITY.md](../design/ACCESSIBILITY.md) | WCAG AA |
| [COMPONENTS.md](../design/COMPONENTS.md) | Catálogo y specs |
| [CONTRIBUTING.md](../design/CONTRIBUTING.md) | Flujo de nuevos componentes |
| [PULL_REQUEST_CHECKLIST.md](../design/PULL_REQUEST_CHECKLIST.md) | Checklist PR |
| [VISUAL_QA.md](../design/VISUAL_QA.md) | Procedimiento QA visual |
| [VERSIONING.md](../design/VERSIONING.md) | v1.0 → deprecación → eliminación |

### Catálogo visual

**URL:** `/internal/design-system`  
**Redirect legacy:** `/admin/design-system` → `/internal/design-system`

Componentes renderizados: Button, Badge, Card, Input, Select, Switch, Modal, Drawer, Tabs, Table (patrón), CTA, Hero, Footer, Empty State, Skeleton, Loader, Toast (Alert), Timeline y piezas institucionales de referencia.

Cada bloque con spec muestra: variantes, tamaños, estados, cuándo usar, tokens, accesibilidad, props y código recomendado.

## Criterios de aceptación

- [x] Toda la documentación disponible y coherente en `docs/design/`
- [x] Catálogo visual funcional en `/internal/design-system`
- [x] Checklist incorporado al flujo (`PULL_REQUEST_CHECKLIST.md`)
- [x] Guía de incorporación publicada (`CONTRIBUTING.md`)
- [x] Convenciones multi-tenant documentadas (`INTRODUCTION.md`)
- [x] Sin cambios visuales respecto a OT-BRANDING-004 (solo gobernanza y catálogo)
- [x] `npm run check:branding` y `npm run build` aprueban sin incidencias

## Validación

```bash
npm run check:branding
npm run build
```

## Cierre de línea Branding

Con esta OT, la etapa de **identidad visual / branding** queda cerrada. Las siguientes OTs deben enfocarse en producto y experiencia:

- Portal público (perfil postulante, metodología, equipo, testimonios, admisión, FAQ, footer)
- Experiencia de postulación (wizard, seguimiento, comunicación)
- Experiencia académica (dashboard estudiante, aula, biblioteca, expediente)

No reabrir debates de diseño sin justificación arquitectónica y actualización del Experience Kit.

## Referencias

- [AUDIT-BRANDING-004.md](../audits/AUDIT-BRANDING-004.md)
- [BRANDING-SYSTEM.md](../design/BRANDING-SYSTEM.md)
- [DESIGN-SYSTEM.md](../design/DESIGN-SYSTEM.md)
