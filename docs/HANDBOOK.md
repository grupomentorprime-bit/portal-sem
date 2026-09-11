# Handbook — Growth OS

Punto de entrada oficial del repositorio. Toda persona o agente que se incorpore debe leer esto antes de escribir código o proponer cambios.

> **Growth OS** es el producto de este repo. **Espacio** = cliente en UI. **Tenant** = término técnico. SEM (T001) y ADL (T002) son clientes. Educación es la vertical. **Aprende Hoy** es otro producto (sistema académico), con handoff opt-in.
>
> Brújula: *atraer personas, no perder oportunidades y convertirlas en clientes, alumnos o participantes.*
>
> Principio: **Simple por fuera. Potente por dentro.**

El repositorio es la **única fuente de verdad** vigente. Índice: [`docs/README.md`](./README.md). Glosario: [`GLOSSARY.md`](./GLOSSARY.md).

Contratos vigentes:

| Documento | Qué fija |
| --- | --- |
| [ADR-008](./architecture/ADR-008.md) | Fundación multi-tenant (Tenant ≡ Espacio, Site, Domain) |
| [ADR-009](./architecture/ADR-009.md) | Contrato de producto Growth OS |
| [ADR-010](./architecture/ADR-010.md) | Contrato mínimo Growth Core V1 (Persona → … → Próxima acción) |
| [ADR-011](./architecture/ADR-011.md) | Contrato mínimo Automatizaciones V1 (Evento → … → Resultado; ≠ Workflow) |

---

## 1. Mapa rápido

```text
Growth OS                          ← este repositorio (producto)
├── Platform Core                  ← Identity, Tenant, CMS, Media, Workflow, Events
├── Productization                 ← nombre, chrome, correo, docs de entrada (cerrada en V1)
├── Growth Core                    ← V1 cerrada (ADR-010 · CORE-001→007 · CLOSE-001); Personas en /admin
└── Vertical educación
      ├── Cliente SEM (T001)
      ├── Cliente ADL (T002)
      └── Handoff opt-in → Aprende Hoy
```

| Hoy | No asumir listo |
| --- | --- |
| Core multi-tenant, CMS, portal, formularios, interesados | CRM completo / recorridos / automatizaciones |
| Chrome y créditos = Growth OS | Planes, self-serve completo |
| Operador de Growth OS ≠ Owner de un Espacio (`requirePlatformOperator`) | UI de gestión de operadores / alta self-serve |
| Platform Admin V1 + patrón visual `/platform` congelado ([UX-SHELL-003](./validation/OT-GROWTH-UX-SHELL-003/README.md)) | Más estilo en Platform Admin; Growth Core en `/platform` |
| Patrón maestro Inicio Espacio + `/admin` productivo congelados ([UX-ADMIN-MASTER-001](./validation/OT-GROWTH-UX-ADMIN-MASTER-001/README.md) · [001A](./validation/OT-GROWTH-UX-ADMIN-MASTER-001A/README.md) · [SHELL-002](./validation/OT-GROWTH-UX-ADMIN-SHELL-002/README.md) · [002A](./validation/OT-GROWTH-UX-ADMIN-SHELL-002A/README.md) · **CERRADAS · APTO**) · **GROWTH OS ADMIN SHELL V1 cerrado** | Búsqueda global; módulos Crecer funcionales; más microajustes salvo OT explícita |
| Identidad Master ≠ Espacio ([IDENTITY-MT-001](./validation/OT-GROWTH-IDENTITY-MT-001/README.md)) | Reabrir branding / tokens / Shell |
| Adapter Aprende Hoy opt-in | ERP académico dentro de este repo |
| Growth Core V1 ([CLOSE-001](./validation/OT-GROWTH-CORE-CLOSE-001/README.md) · [ADR-010](./architecture/ADR-010.md)) · **CERRADO · APTO** | CRM paralelo, Mensajes/Campañas/IA/Analítica, CORE-008, UI Growth en `/platform` — [CORE-001](./validation/OT-GROWTH-CORE-001/README.md)→[007](./validation/OT-GROWTH-CORE-007/README.md) (**CERRADAS**; 007 **APTO VISUAL**) |
| Automatizaciones — runtime + WAIT + historial ([AUTOMATION-003](./validation/OT-GROWTH-AUTOMATION-003/README.md) · [005](./validation/OT-GROWTH-AUTOMATION-005/README.md) · [006](./validation/OT-GROWTH-AUTOMATION-006/README.md) · [007](./validation/OT-GROWTH-AUTOMATION-007/README.md) · [ADR-011](./architecture/ADR-011.md)) · **003 CERRADA** · **005–007 entregadas** | Pendiente validación visual humana 006/007; sin siguiente OT abierta |

---

## 2. Filosofía

1. Una sola fuente de verdad documental en el repo.
2. Ningún desarrollo sin OT y sin revisión de documentación obligatoria.
3. Branding visible = datos del **Espacio** / Site; chrome de plataforma = **Growth OS**.
4. Datos siempre vía API Routes; nunca MongoDB directo desde componentes.
5. Este producto **no** almacena alumnos, matrículas, pagos, expedientes ni campus — eso es Aprende Hoy.

---

## 3. Arquitectura

```
Usuario / operador
        ↓
Growth OS (Next.js — App Router)
        ↓
API Routes (/api/*) + TenantContext
        ↓
MongoDB (aislamiento por tenantId)
        ↓
Aprende Hoy (integración opt-in)
```

| Documento | Descripción |
| --- | --- |
| [ADR-008](./architecture/ADR-008.md) | Multi-tenant (fundación) |
| [ADR-009](./architecture/ADR-009.md) | Producto Growth OS |
| [ADR-010](./architecture/ADR-010.md) | Growth Core V1 (contrato; V1 cerrada · [CLOSE-001](./validation/OT-GROWTH-CORE-CLOSE-001/README.md)) |
| [ADR-011](./architecture/ADR-011.md) | Automatizaciones V1 (contrato + persistencia + runtime mínimo; sin WAIT/editor) |
| [TENANT-GUIDELINES](./core/TENANT-GUIDELINES.md) | Tenant / Site / Domain operativos |
| [GROWTH-OS-HANDOFF-APRENDE-HOY](./architecture/GROWTH-OS-HANDOFF-APRENDE-HOY.md) | Corte portal → académico |
| [ARQ-001](./architecture/ARQ-001.md) · [002](./architecture/ARQ-002.md) · [003](./architecture/ARQ-003.md) | ARQ generales (legado; priorizar ADR-008/009) |

---

## 4. Principios de desarrollo

- Lectura/escritura en **API Routes** del servidor.
- Componentes React **no** acceden a MongoDB.
- Configuración de portal desde `site_config` / CMS del Site activo.
- Identidad: Growth OS Master (`/platform`) ≠ branding del Espacio (`site_config`); ver [BRANDING-SYSTEM](./design/BRANDING-SYSTEM.md).
- Sin lógica `if (cliente === …)` como identidad de producto; `isSemTenant` solo gate del **pack SEM**.
- Conexión MongoDB reutilizable (singleton en desarrollo).

Detalle: [Guía de Desarrollo](./development/DEVELOPER-GUIDE.md) · [CODING-STANDARDS](./development/CODING-STANDARDS.md)

---

## 5. Flujo de Órdenes de Trabajo (OT)

1. Revisar documentación obligatoria ([DEVELOPER-GUIDE](./development/DEVELOPER-GUIDE.md)).
2. Consultar o crear la OT (`docs/ot/` o `docs/validation/` según el frente).
3. Seguir [OT-STANDARD](./development/OT-STANDARD.md).
4. Implementar, documentar y cerrar con criterios verificables.
5. Actualizar changelog / releases cuando corresponda a un release.

Validaciones Growth recientes: [`docs/validation/`](./validation/).

---

## 6. Diseño y UX

- Canon UI: [CORE-UI-CANON](./frontend/CORE-UI-CANON.md)
- Tokens: [DOC-002](./frontend/DOC-002-DESIGN-TOKENS.md)
- Design System: [DESIGN-SYSTEM](./design/DESIGN-SYSTEM.md)
- Catálogo en vivo: `/internal/design-system`

**Marca del cliente SEM (T001):** [Manual de Marca](./design/MANUAL-DE-MARCA.md) y [Moodboard](./design/MOODBOARD.md) aplican al pack SEM, no al nombre del producto Growth OS.

**UX histórica SEM:** [UX-SEM-001](./ux/UX-SEM-001.md) — estándares del portal del cliente SEM.

### Reglas Core UI (obligatorias)

1. Ningún desarrollo nuevo con componentes `DEPRECATED` (`institutional/`, `navigation/`, `blocks/`).
2. Todo desarrollo público (`src/app/(site)/`) usa solo componentes **CANONICAL** o **LOCKED**.
3. Estados: `CANONICAL` · `LOCKED` · `INTERNAL` · `EXPERIMENTAL` · `DEPRECATED`.

### Experience Action Rule

Ningún componente público ejecuta navegación o lógica de acción ad hoc. Resolver vía [Experience Actions](./core/CORE-EXPERIENCE-ACTIONS-v1.md).

### Contact Hub Rule

Contacto institucional solo desde [Experience Contact Hub](./core/CORE-CONTACT-HUB-v1.md).

### Footer Rule

Footer sin datos institucionales propios — Institution Config, Navigation y Contact Hub vía [Footer Premium](./core/CORE-FOOTER-PREMIUM-v1.md).

### Experience Forms Rule

Formularios de captura vía [Experience Forms](./core/CORE-EXPERIENCE-FORMS-v1.md).

### Home Experience Rule

Mejoras de Home vía composición en [EP-UX-001](./ux/EP-UX-001-PORTAL-EXPERIENCE-DESIGN.md), sin romper módulos LOCKED.

---

## 7. CMS

| Documento | Módulo |
| --- | --- |
| [CMS-CONFIGURACION](./cms/CMS-CONFIGURACION.md) | Configuration Hub |
| [CMS-MENUS](./cms/CMS-MENUS.md) | Menu Engine |
| [PAGE-BUILDER](./cms/PAGE-BUILDER.md) | Page Builder |
| [CONTENT-ENGINE](./cms/CONTENT-ENGINE.md) | Content Engine |
| [MEDIA-LIBRARY](./cms/MEDIA-LIBRARY.md) | Media Library |

---

## 8. Coding standards y releases

- [CODING-STANDARDS](./development/CODING-STANDARDS.md)
- [GIT-WORKFLOW](./development/GIT-WORKFLOW.md)
- [CHANGELOG](../CHANGELOG.md) · [RELEASES](../RELEASES.md)

---

## 9. Legacy e historia

Documentos históricos (incl. OTs SEM, auditorías, actas): [`docs/legacy/`](./legacy/), [`docs/ot/`](./ot/), [`docs/audits/`](./audits/). **No se reescriben** solo para renombrar el producto. La orientación vigente es este Handbook + ADR-008/009 + Glosario.

---

## Lectura obligatoria antes de desarrollar

| Documento | Enlace |
| --- | --- |
| Handbook | Este documento |
| Glosario | [GLOSSARY](./GLOSSARY.md) |
| ADR-008 / ADR-009 | [architecture/](./architecture/) |
| Guía de desarrollo | [DEVELOPER-GUIDE](./development/DEVELOPER-GUIDE.md) |
| OT correspondiente | [validation/](./validation/) o [ot/](./ot/) |
| OT Standard | [OT-STANDARD](./development/OT-STANDARD.md) |
