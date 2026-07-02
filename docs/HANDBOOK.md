# Handbook — Portal Institucional SEM

Punto de entrada oficial del proyecto. Toda persona que se incorpore al desarrollo debe leer este documento antes de escribir código.

> El repositorio es la **única fuente de verdad** para arquitectura, UX, diseño y desarrollo. No debe existir documentación duplicada fuera de la estructura oficial en [`/docs`](./README.md).

### Estrategia de entrega (2026)

| Etapa | Objetivo | Estado |
| --- | --- | --- |
| **I — Foundation** | Platform Core (Identity, Workflow, Events, Portal Engine) | ✅ [Cierre oficial](./strategy/FOUNDATION-COMPLETE.md) v2.0.0 |
| **II — Business Platform** | CRM, Admisiones, Académico, Finanzas | 🟡 [EP-001](./strategy/epics/EP-001-CRM-ADMISSIONS.md) en diseño |
| **Tenant SEM** | Portal premium en producción | 🟡 v2.4.0 — pendientes footer y producción |

Prioridad actual: **cerrar portal SEM** y **iniciar dominios de negocio** sobre el Core ya estable.

---

## 1. Filosofía

El Portal SEM es el sitio institucional del **Seminario Eclesiástico Mayor**, integrado al ecosistema **AprendeHoy** con separación estricta entre:

- **Portal Web** — Información institucional, CMS, contenido público.
- **Core Académico** — Gestión académica vía AprendeHoy (integración futura).

Principios rectores:

1. Una sola fuente de verdad documental en el repositorio.
2. Ningún desarrollo sin OT y sin revisión de documentación obligatoria.
3. Identidad visual institucional por encima de plantillas genéricas.
4. Datos siempre a través de API Routes; nunca acceso directo a MongoDB desde componentes.

---

## 2. Arquitectura

```
Usuario
   ↓
Portal SEM (Next.js — App Router)
   ↓
API Routes (/api/*)
   ↓
MongoDB (SeminarioIPN)
   ↓
AprendeHoy (integración futura)
```

Documentación oficial:

| Documento | Descripción |
| --- | --- |
| [ARQ-001](./architecture/ARQ-001.md) | Arquitectura general |
| [ARQ-002](./architecture/ARQ-002.md) | Arquitectura de integración |
| [ARQ-003](./architecture/ARQ-003.md) | Arquitectura de desarrollo |

Documentación técnica de infraestructura (migración pendiente a OT): [legacy/INFRAESTRUCTURA.md](./legacy/INFRAESTRUCTURA.md)

---

## 3. Principios de desarrollo

- Toda lectura/escritura de datos ocurre en **API Routes** del servidor.
- Los componentes React **no** acceden directamente a MongoDB.
- La información institucional proviene del CMS (`cms_config`, Content Engine, Media Library).
- No se almacena información académica en este portal.
- Conexión MongoDB reutilizable (singleton en desarrollo).

Detalle operativo: [Guía de Desarrollo](./development/DEVELOPER-GUIDE.md) · [Estándares de código](./development/CODING-STANDARDS.md)

---

## 4. Flujo de Órdenes de Trabajo (OT)

Toda funcionalidad nueva se implementa mediante una **OT** documentada.

1. Revisar documentación obligatoria ([DEVELOPER-GUIDE](./development/DEVELOPER-GUIDE.md)).
2. Consultar o crear la OT en [`docs/ot/`](./ot/).
3. Seguir la estructura de [OT-STANDARD](./development/OT-STANDARD.md).
4. Implementar, documentar y cerrar con criterios de aceptación verificables.
5. Actualizar [CHANGELOG](../CHANGELOG.md), [RELEASES](../RELEASES.md) y [README](../README.md) cuando corresponda.

Índice de OT: [docs/ot/](./ot/)

---

## 5. Manual de Marca

La identidad visual del SEM es obligatoria en todo el portal.

- [Manual de Marca](./design/MANUAL-DE-MARCA.md)
- [Moodboard](./design/MOODBOARD.md)

---

## 6. UX

Experiencia de usuario gobernada por estándares institucionales.

- [UX-SEM-001](./ux/UX-SEM-001.md)

---

## 7. Diseño

Sistema visual y lenguaje de interfaz del portal.

| Documento | Descripción |
| --- | --- |
| [CORE-UI-CANON](./frontend/CORE-UI-CANON.md) | **Canon oficial Core UI v1.0** — componentes autorizados y estados |
| [DOC-002 — Design Tokens](./frontend/DOC-002-DESIGN-TOKENS.md) | **Tokens oficiales** — colores, tipografía, spacing, motion |
| [UI-INVENTORY](./frontend/UI-INVENTORY.md) | Inventario de componentes (OT-CORE-UI-001) |
| [Design System](./design/DESIGN-SYSTEM.md) | Componentes, tokens y catálogo visual |
| [Design Language](./design/DESIGN-LANGUAGE.md) | Lenguaje visual del portal público |

Catálogo en vivo: `/internal/design-system`

### Reglas Core UI (obligatorias)

1. **Ningún desarrollo nuevo** podrá utilizar componentes marcados como `DEPRECATED` (`institutional/`, `navigation/`, `blocks/`).
2. **Todo desarrollo público** (`src/app/(site)/`) debe usar únicamente componentes **CANONICAL** o **LOCKED** definidos en [CORE-UI-CANON](./frontend/CORE-UI-CANON.md).
3. Estados oficiales: `CANONICAL` · `LOCKED` · `INTERNAL` · `EXPERIMENTAL` · `DEPRECATED`.

### Experience Action Rule (obligatoria)

**Ningún componente público del Portal** ejecutará navegación, aperturas de ventanas o lógica específica de acciones de forma directa. Todas las acciones interactivas (enlaces, formularios, modales, WhatsApp, descargas, flujos de postulación, etc.) **deben resolverse mediante el [Experience Actions Engine](./core/CORE-EXPERIENCE-ACTIONS-v1.md)** (`src/core/experience/actions/`).

### Contact Hub Rule (obligatoria)

**Ningún componente público** almacenará teléfonos, correos, WhatsApp, direcciones u horarios propios. Toda la información de contacto institucional **debe obtenerse desde Institution Config → [Experience Contact Hub](./core/CORE-CONTACT-HUB-v1.md)**.

### Footer Rule (obligatoria)

**El Footer no podrá contener datos institucionales propios.** Toda la información debe provenir de Institution Config, [Navigation](./core/PORTAL-ENGINE.md) y [Experience Contact Hub](./core/CORE-CONTACT-HUB-v1.md), renderizada por [Footer Premium](./core/CORE-FOOTER-PREMIUM-v1.md) (`PortalFooterPremium`).

El Footer, CTA Premium, Hero y futuros módulos consumen Contact Hub — no duplican datos.

### Experience Forms Rule (obligatoria)

**Ningún componente público** implementará formularios de captura propios. Toda experiencia de formulario (contacto, postulación, asistencia, inscripción, etc.) **debe usar [Experience Forms](./core/CORE-EXPERIENCE-FORMS-v1.md)** (`PortalExperienceForm` + motor en `src/core/experience/forms/`). Las aperturas modales se resuelven vía Experience Actions `type=form` → `ExperienceFormHost`.

### Home Experience Rule (obligatoria)

La **Home Premium** no se diseña bloque a bloque. Toda mejora visual de la Home debe aplicarse vía la **capa de composición** documentada en [EP-UX-001](./ux/EP-UX-001-PORTAL-EXPERIENCE-DESIGN.md) — sin modificar módulos LOCKED del Experience Kit. Cada sección responde: emoción, acción esperada y conexión con la siguiente.

Componentes UI usan `ExperienceActionButton` / `FooterExperienceLink` — nunca `window.open`, `mailto:` ni `<Link href>` ad hoc para acciones configurables desde CMS.

Épica activa: **EP-CORE-001** — ver [OT-CORE-UI-002](./ot/OT-CORE-UI-002.md) · [OT-CORE-EXP-001](./ot/OT-CORE-EXP-001.md).

---

## 8. Coding standards

- [CODING-STANDARDS](./development/CODING-STANDARDS.md)
- [GIT-WORKFLOW](./development/GIT-WORKFLOW.md)

---

## 9. CMS

Módulos de gestión de contenido documentados en [`docs/cms/`](./cms/):

| Documento | Módulo |
| --- | --- |
| [CMS-CONFIGURACION](./cms/CMS-CONFIGURACION.md) | Configuration Hub |
| [CMS-MENUS](./cms/CMS-MENUS.md) | Menu Engine |
| [PAGE-BUILDER](./cms/PAGE-BUILDER.md) | Page Builder |
| [CONTENT-ENGINE](./cms/CONTENT-ENGINE.md) | Content Engine |
| [MEDIA-LIBRARY](./cms/MEDIA-LIBRARY.md) | Media Library |

---

## 10. Releases

Historial oficial de versiones:

- [CHANGELOG.md](../CHANGELOG.md) — Registro de cambios por versión
- [RELEASES.md](../RELEASES.md) — Historial de releases

---

## 11. Documentación legacy

Documentos históricos pendientes de migración a la estructura oficial: [`docs/legacy/`](./legacy/)

---

## Lectura obligatoria antes de desarrollar

Ver regla completa en [DEVELOPER-GUIDE](./development/DEVELOPER-GUIDE.md).

| Documento | Enlace |
| --- | --- |
| Handbook | Este documento |
| ARQ correspondiente | [architecture/](./architecture/) |
| UX correspondiente | [UX-SEM-001](./ux/UX-SEM-001.md) |
| Manual de Marca | [MANUAL-DE-MARCA](./design/MANUAL-DE-MARCA.md) |
| Moodboard | [MOODBOARD](./design/MOODBOARD.md) |
| OT correspondiente | [ot/](./ot/) |
| OT Standard | [OT-STANDARD](./development/OT-STANDARD.md) |
