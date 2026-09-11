# Documentación Oficial — Growth OS

Índice central de gobierno documental.

**Comienza aquí:** [HANDBOOK.md](./HANDBOOK.md) · [GLOSSARY.md](./GLOSSARY.md)

Este repositorio es **Growth OS**. SEM (T001) y ADL (T002) son clientes. Aprende Hoy es un sistema académico separado. Contratos: [ADR-008](./architecture/ADR-008.md) · [ADR-009](./architecture/ADR-009.md).

---

## Gobierno / entrada

- [Handbook — Punto de entrada](./HANDBOOK.md)
- [Glosario de producto](./GLOSSARY.md)
- [Guía de Desarrollo](./development/DEVELOPER-GUIDE.md)
- [Estándar de OT](./development/OT-STANDARD.md)
- [CHANGELOG](../CHANGELOG.md)
- [RELEASES](../RELEASES.md)

### Estrategia (histórico / roadmap)

- [Foundation Complete — Cierre Etapa I](./strategy/FOUNDATION-COMPLETE.md) — histórico Foundation
- [Product Roadmap 2026–2028](./strategy/PRODUCT-ROADMAP-2026-2028.md) — puede mezclar nombres legados; priorizar ADR-009 para producto
- [EP-001 — CRM & Admissions](./strategy/epics/EP-001-CRM-ADMISSIONS.md) — **roadmap / diseño**, no capacidad actual de Growth OS

## Arquitectura

### Decisiones vigentes (empezar aquí)

- [ADR-008 — Fundación multi-tenant](./architecture/ADR-008.md)
- [ADR-009 — Contrato de producto Growth OS](./architecture/ADR-009.md)
- [ADR-010 — Contrato mínimo Growth Core V1](./architecture/ADR-010.md)
- [ADR-011 — Contrato mínimo Automatizaciones Growth OS V1](./architecture/ADR-011.md)
- [TENANT-GUIDELINES](./core/TENANT-GUIDELINES.md)
- [GROWTH-OS-HANDOFF-APRENDE-HOY — Corte → Aprende Hoy](./architecture/GROWTH-OS-HANDOFF-APRENDE-HOY.md)
- [PORTAL-HANDOFF-LEARNING-OS.md](./architecture/PORTAL-HANDOFF-LEARNING-OS.md) — stub → documento vigente

### ARQ (legado)

- [ARQ-001 — Arquitectura general](./architecture/ARQ-001.md)
- [ARQ-002 — Arquitectura de integración](./architecture/ARQ-002.md)
- [ARQ-003 — Arquitectura de desarrollo](./architecture/ARQ-003.md)

### ADR anteriores (siguen vigentes como contratos técnicos)

- [ADR-003 — Media Library](./architecture/ADR-003.md)
- [ADR-004 — Identity Core (IAM)](./architecture/ADR-004.md)
- [ADR-005 — Workflow Engine](./architecture/ADR-005.md)
- [ADR-006 — Event Bus](./architecture/ADR-006.md)
- [ADR-007 — Portal Engine](./architecture/ADR-007.md)

### Core

- [EVENTS.md](./core/EVENTS.md) — Event Bus
- [PORTAL-ENGINE.md](./core/PORTAL-ENGINE.md) — Portal Engine CMS-driven
- [IDENTITY.md](./core/IDENTITY.md) — Identity (título histórico; contrato = ADR-004)
- [WORKFLOW.md](./core/WORKFLOW.md)

## Validación Growth (Productization / SaaS)

- [OT-GROWTH-PROD-ADR-001](./validation/OT-GROWTH-PROD-ADR-001/README.md) — Contrato ADR-009
- [OT-GROWTH-PROD-002](./validation/OT-GROWTH-PROD-002/README.md) — Correo por Espacio
- [OT-GROWTH-PROD-003](./validation/OT-GROWTH-PROD-003/README.md) — Créditos de plataforma
- [OT-GROWTH-PROD-004](./validation/OT-GROWTH-PROD-004/README.md) — Docs de entrada
- [OT-GROWTH-PROD-005](./validation/OT-GROWTH-PROD-005/README.md) — Operador de Growth OS / Platform Admin
- [OT-GROWTH-PLATFORM-ADMIN-002](./validation/OT-GROWTH-PLATFORM-ADMIN-002/README.md) — Catálogo y ficha de Espacios
- [OT-GROWTH-PLATFORM-ADMIN-003](./validation/OT-GROWTH-PLATFORM-ADMIN-003/README.md) — Crear Espacio
- [OT-GROWTH-PLATFORM-ADMIN-004](./validation/OT-GROWTH-PLATFORM-ADMIN-004/README.md) — Entrar a Espacio · **Platform Admin V1 cerrada**
- [OT-GROWTH-UX-SHELL-003](./validation/OT-GROWTH-UX-SHELL-003/README.md) — Platform Admin visual · **CERRADA · APTO VISUAL**
- [OT-GROWTH-UX-ADMIN-MASTER-001](./validation/OT-GROWTH-UX-ADMIN-MASTER-001/README.md) — Maqueta maestra `/admin` · **CERRADA · APTO VISUAL**
- [OT-GROWTH-UX-ADMIN-MASTER-001A](./validation/OT-GROWTH-UX-ADMIN-MASTER-001A/README.md) — Refinamiento visual final · **CERRADA · APTO VISUAL** · patrón maestro Espacio congelado
- [OT-GROWTH-UX-ADMIN-SHELL-002](./validation/OT-GROWTH-UX-ADMIN-SHELL-002/README.md) — Aplicar patrón maestro al `/admin` real · **CERRADA · APTO VISUAL** · GROWTH OS ADMIN SHELL V1 cerrado
- [OT-GROWTH-UX-ADMIN-SHELL-002A](./validation/OT-GROWTH-UX-ADMIN-SHELL-002A/README.md) — Origen humano en Personas · **CERRADA · APTO**
- [OT-GROWTH-IDENTITY-MT-001](./validation/OT-GROWTH-IDENTITY-MT-001/README.md) — Master ≠ Espacio · **CERRADA · APTO**
- [OT-GROWTH-CORE-AUDIT-001](./validation/OT-GROWTH-CORE-AUDIT-001/README.md) — Auditoría previa Growth Core
- [OT-GROWTH-CORE-001](./validation/OT-GROWTH-CORE-001/README.md) — Contrato mínimo Growth Core V1 ([ADR-010](./architecture/ADR-010.md)) · **CERRADA · APTO**
- [OT-GROWTH-CORE-002](./validation/OT-GROWTH-CORE-002/README.md) — Persona + Origen + dedupe · **CERRADA · APTO**
- [OT-GROWTH-CORE-003](./validation/OT-GROWTH-CORE-003/README.md) — Oportunidad + Workflow + nextAction · **CERRADA · APTO**
- [OT-GROWTH-CORE-004](./validation/OT-GROWTH-CORE-004/README.md) — Actividad + Event Bus · **CERRADA · APTO**
- [OT-GROWTH-CORE-005](./validation/OT-GROWTH-CORE-005/README.md) — Ingestión en vivo · **CERRADA · APTO**
- [OT-GROWTH-CORE-006](./validation/OT-GROWTH-CORE-006/README.md) — Backfill histórico · **CERRADA · APTO**
- [OT-GROWTH-CORE-007](./validation/OT-GROWTH-CORE-007/README.md) — UI `/admin/personas` · **CERRADA · APTO VISUAL**
- [OT-GROWTH-CORE-CLOSE-001](./validation/OT-GROWTH-CORE-CLOSE-001/README.md) — Cierre Growth Core V1 · **CERRADO · APTO**
- [OT-GROWTH-SALES-001](./validation/OT-GROWTH-SALES-001/README.md) — Ventas V1 operativa (`/admin/ventas`) · **APTO TÉCNICO** (pendiente visual humano)
- [OT-GROWTH-SALES-001A](./validation/OT-GROWTH-SALES-001A/README.md) — Simplificar operación de Ventas (UX funcional) · **pendiente validación visual humana**
- [OT-GROWTH-AUTOMATION-001](./validation/OT-GROWTH-AUTOMATION-001/README.md) — Contrato mínimo Automatizaciones ([ADR-011](./architecture/ADR-011.md)) · **CERRADA · APTO**
- [OT-GROWTH-AUTOMATION-002](./validation/OT-GROWTH-AUTOMATION-002/README.md) — Persistencia versionada + IAM · **CERRADA · APTO TÉCNICO**
- [OT-GROWTH-AUTOMATION-003](./validation/OT-GROWTH-AUTOMATION-003/README.md) — Runtime mínimo (Event Bus → sales-ops) · **CERRADA · APTO TÉCNICO**
- Índice SaaS: carpetas `OT-GROWTH-SAAS-*` y `OT-GROWTH-TEST-*` en [validation/](./validation/)

## UX / Diseño / CMS

- [UX-SEM-001](./ux/UX-SEM-001.md) — Estándares UX del cliente SEM
- [Design System](./design/DESIGN-SYSTEM.md)
- [Manual de Marca](./design/MANUAL-DE-MARCA.md) — pack SEM (T001)
- [CMS-CONFIGURACION](./cms/CMS-CONFIGURACION.md) · [CMS-MENUS](./cms/CMS-MENUS.md) · [PAGE-BUILDER](./cms/PAGE-BUILDER.md) · [CONTENT-ENGINE](./cms/CONTENT-ENGINE.md) · [MEDIA-LIBRARY](./cms/MEDIA-LIBRARY.md)

## Desarrollo

- [CODING-STANDARDS](./development/CODING-STANDARDS.md)
- [GIT-WORKFLOW](./development/GIT-WORKFLOW.md)

## Órdenes de Trabajo históricas (SEM / portal)

Índice en [`docs/ot/`](./ot/). No se reescriben para renombrar el producto. Orientación vigente: Handbook + ADR-008/009.

## Legacy

Documentos históricos: [legacy/](./legacy/)
