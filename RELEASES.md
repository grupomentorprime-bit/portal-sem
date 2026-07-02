# Releases — Portal SEM / AprendeHoy Learning OS

Historial oficial de versiones.

---

## Foundation Complete — v2.0.0 (Platform Core)

| Atributo | Valor |
| --- | --- |
| Versión | 2.0.0 |
| Alcance | AprendeHoy Learning OS — Etapa I |
| Fecha | Junio 2026 |
| Tag | `v2.0.0-portal-engine` |

**Incluye:** Cierre oficial de Foundation & Platform Core — Multi-Tenant, CMS, Asset Engine, Identity, Workflow, Event Bus (`v1.9.0-event-bus`), Portal Engine.

**Documentación:** [FOUNDATION-COMPLETE](./docs/strategy/FOUNDATION-COMPLETE.md) · [PRODUCT-ROADMAP](./docs/strategy/PRODUCT-ROADMAP-2026-2028.md)

---

## v2.0.0 — Portal Engine

| Atributo | Valor |
| --- | --- |
| Versión | 2.0.0 |
| OT principal | OT-CORE-PORTAL-001 |
| Tag | v2.0.0-portal-engine |

**Incluye:** Portal Engine CMS-driven, Block Registry, visibility/conditions, resolvers, PortalRenderer, SEO consolidado, eventos analytics.

**Documentación:** [PORTAL-ENGINE.md](./docs/core/PORTAL-ENGINE.md) · [ADR-007](./docs/architecture/ADR-007.md) · [CHANGELOG](./CHANGELOG.md)

---

## v2.5.0 — Footer Premium Institucional

| Atributo | Valor |
| --- | --- |
| Versión | 2.5.0 |
| OT principal | OT-SEM-PORTAL-007 |
| Dependencias | OT-SEM-PORTAL-001–006 |

**Incluye:** Footer Premium CMS-driven, programas destacados, menú jerárquico Recursos/Admisión, contacto completo, redes condicionales, botón volver arriba, portalCopy ampliado.

**Documentación:** [OT-SEM-PORTAL-007](./docs/ot/OT-SEM-PORTAL-007.md) · [HOME-PREMIUM-SEM](./docs/ux/HOME-PREMIUM-SEM.md) · [CHANGELOG](./CHANGELOG.md)

---

## v2.4.0 — Conversión y Admisión

| Atributo | Valor |
| --- | --- |
| Versión | 2.4.0 |
| OT principal | OT-SEM-PORTAL-006 |
| Dependencias | OT-SEM-PORTAL-001–005, OT-SEM-UX-AUDIT-001 |

**Incluye:** Home CMS-driven, bloques de conversión (proceso admisión, becas, FAQ, contacto rápido, CTA), correcciones P0 auditoría UX, página `/admision`, SEO JSON-LD.

**Documentación:** [OT-SEM-PORTAL-006](./docs/ot/OT-SEM-PORTAL-006.md) · [HOME-PREMIUM-SEM](./docs/ux/HOME-PREMIUM-SEM.md) · [CHANGELOG](./CHANGELOG.md)

---

## v2.4.0 — Conversión y Gobernanza CMS

| Atributo | Valor |
| --- | --- |
| Versión | 2.4.0 |
| OT principal | OT-SEM-PORTAL-006 |
| Dependencias | UX-AUDIT-001, OT-SEM-PORTAL-001–005 |

**Incluye:** Home gobernada por Page Builder, flujo de conversión completo, correcciones P0 de auditoría UX.

**Documentación:** [OT-SEM-PORTAL-006](./docs/ot/OT-SEM-PORTAL-006.md) · [UX-AUDIT-001](./docs/audits/UX-AUDIT-001.md)

---

## v2.3.0 — Ecosistema Académico

| Atributo | Valor |
| --- | --- |
| Versión | 2.3.0 |
| OT principal | OT-SEM-PORTAL-005 |
| Dependencias | OT-SEM-PORTAL-001–004, Content Engine, Page Builder, Media Library |

**Incluye:** Sección Ecosistema Académico (noticias, eventos, biblioteca, recursos destacados), integración exclusiva vía Content Engine, diseño responsive premium.

**Documentación:** [OT-SEM-PORTAL-005](./docs/ot/OT-SEM-PORTAL-005.md) · [HOME-PREMIUM-SEM](./docs/ux/HOME-PREMIUM-SEM.md) · [CHANGELOG](./CHANGELOG.md)

---

## v2.2.0 — Confianza Institucional

| Atributo | Valor |
| --- | --- |
| Versión | 2.2.0 |
| OT principal | OT-SEM-PORTAL-004 |

**Incluye:** Sección de confianza institucional (6 bloques CMS), `InstitutionSection`, testimonios y galería premium.

**Documentación:** [OT-SEM-PORTAL-004](./docs/ot/OT-SEM-PORTAL-004.md) · [HOME-PREMIUM-SEM](./docs/ux/HOME-PREMIUM-SEM.md)

---

## v2.1.0 — Programas Premium

| Atributo | Valor |
| --- | --- |
| Versión | 2.1.0 |
| OT principal | OT-SEM-PORTAL-003 |
| Dependencias | OT-SEM-PORTAL-001, OT-SEM-PORTAL-002, Content Engine, Media Library |

**Incluye:** Sección Programas Destacados premium, `ProgramCard` de referencia, integración CMS vía Content Engine, estados empty/error/loading.

**Documentación:** [OT-SEM-PORTAL-003](./docs/ot/OT-SEM-PORTAL-003.md) · [HOME-PREMIUM-SEM](./docs/ux/HOME-PREMIUM-SEM.md) · [CHANGELOG](./CHANGELOG.md)

---

## v1.4.0 — Portal UX

| Atributo | Valor |
| --- | --- |
| Versión | 1.4.0 |
| Tag Git | `v1.4.0-portal-ux` |
| Fecha | 2026 |
| OT principal | OT-SEM-PORTAL-UX-001, OT-SEM-DOC-001 |

**Incluye:** Portal público con rutas institucionales, componentes portal, normalización documental completa.

**Documentación:** [CHANGELOG](./CHANGELOG.md) · [HANDBOOK](./docs/HANDBOOK.md)

---

## v1.3.0 — Media Library

| Atributo | Valor |
| --- | --- |
| Versión | 1.3.0 |
| Tag Git | `v1.3.0-media-library` |
| OT | OT-SEM-CMS-005 |

**Incluye:** Biblioteca de medios, upload S3, integración con Content Engine.

**Documentación:** [MEDIA-LIBRARY](./docs/cms/MEDIA-LIBRARY.md)

---

## v1.2.0 — Content Engine

| Atributo | Valor |
| --- | --- |
| Versión | 1.2.0 |
| Tag Git | `v1.2-content-engine` |
| OT | OT-SEM-CMS-004 |

**Incluye:** Motor de contenido institucional (programas, noticias, eventos, equipo).

**Documentación:** [CONTENT-ENGINE](./docs/cms/CONTENT-ENGINE.md)

---

## v1.1.0 — Menu Engine

| Atributo | Valor |
| --- | --- |
| Versión | 1.1.0 |
| Tag Git | `v1.1-menu-engine` |
| OT | OT-SEM-CMS-002 |

**Incluye:** Motor de menús dinámicos para header, footer y navegación móvil.

**Documentación:** [CMS-MENUS](./docs/cms/CMS-MENUS.md)

---

## v1.0.0 — Base

| Atributo | Valor |
| --- | --- |
| Versión | 1.0.0 |
| Tag Git | `v1.0-base` |
| OT | OT-SEM-INFRA-001, OT-SEM-CMS-001, OT-SEM-CMS-003 |

**Incluye:** Infraestructura Next.js + MongoDB, Configuration Hub, Design System, Page Builder.

**Documentación:** [legacy/INFRAESTRUCTURA](./docs/legacy/INFRAESTRUCTURA.md) · [CMS-CONFIGURACION](./docs/cms/CMS-CONFIGURACION.md)

---

## Próximo release planificado

**OT-SEM-PORTAL-005 — Noticias / Eventos premium** (propuesta)

Secciones dinámicas al mismo nivel visual que Programas y Confianza Institucional.
