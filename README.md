# Portal Institucional SEM

Portal web del **Seminario Eclesiástico Mayor (SEM)**, construido con Next.js y MongoDB, integrado al ecosistema **AprendeHoy**.

**Versión actual:** 2.4.0 (tenant SEM) · **Platform Core:** 2.0.0 — [Foundation Complete](./docs/strategy/FOUNDATION-COMPLETE.md)

---

## Introducción

El Portal SEM es el sitio institucional oficial del seminario. Gestiona contenido público, configuración institucional y módulos CMS, manteniendo separación estricta del Core Académico (AprendeHoy).

Punto de entrada para desarrolladores: [docs/HANDBOOK.md](./docs/HANDBOOK.md)

---

## Arquitectura

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

Documentación: [docs/architecture/](./docs/architecture/)

---

## Documentación

| Recurso | Enlace |
| --- | --- |
| Handbook (inicio) | [docs/HANDBOOK.md](./docs/HANDBOOK.md) |
| Índice completo | [docs/README.md](./docs/README.md) |
| Guía de desarrollo | [docs/development/DEVELOPER-GUIDE.md](./docs/development/DEVELOPER-GUIDE.md) |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) |
| Releases | [RELEASES.md](./RELEASES.md) |

---

## Cómo iniciar

**Requisitos:** Node.js 20+, npm, acceso a MongoDB `SeminarioIPN`.

```bash
npm install
cp .env.example .env.local
# Completar MONGODB_URI y MONGODB_DB en .env.local
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Validar infraestructura: `GET /api/test`

---

## Cómo desplegar

```bash
npm run build
npm run start
```

Variables de entorno requeridas en producción:

```env
MONGODB_URI=...
MONGODB_DB=SeminarioIPN
```

---

## Roadmap

| Fase | OT / Módulo | Estado |
| --- | --- | --- |
| Infraestructura base | OT-SEM-INFRA-001 | Completado |
| Configuration Hub | OT-SEM-CMS-001 | Completado |
| Menu Engine | OT-SEM-CMS-002 | Completado |
| Page Builder | OT-SEM-CMS-003 | Completado |
| Content Engine | OT-SEM-CMS-004 | Completado |
| Media Library | OT-SEM-CMS-005 | Completado |
| Gobierno documental | OT-SEM-DOC-001 | Completado |
| Home Premium — Header & Hero | [OT-SEM-PORTAL-001](./docs/ot/OT-SEM-PORTAL-001.md) / [002](./docs/ot/OT-SEM-PORTAL-002.md) | Completado |
| Home Premium — Programas | [OT-SEM-PORTAL-003](./docs/ot/OT-SEM-PORTAL-003.md) | Completado |
| Home Premium — Confianza | [OT-SEM-PORTAL-004](./docs/ot/OT-SEM-PORTAL-004.md) | Completado |
| Home Premium — Ecosistema | [OT-SEM-PORTAL-005](./docs/ot/OT-SEM-PORTAL-005.md) | Completado |
| **Auditoría UX/UI** | [UX-AUDIT-001](./docs/audits/UX-AUDIT-001.md) | Completado |
| **Conversión y CMS** | [OT-SEM-PORTAL-006](./docs/ot/OT-SEM-PORTAL-006.md) | Completado |
| **Portal Engine (Core)** | [OT-CORE-PORTAL-001](./docs/core/PORTAL-ENGINE.md) · `v2.0.0-portal-engine` | Completado |
| **Event Bus (Core)** | [OT-CORE-EVENTS-001](./docs/core/EVENTS.md) · `v1.9.0-event-bus` | Completado |
| **Demo oficial v2.4.0** | [DEMO-001](./docs/demo/DEMO-001.md) | Completado |
| Footer Premium | OT-SEM-PORTAL-007 | Pendiente |
| Optimización Producción | OT-SEM-PORTAL-008 | Pendiente |
| Integración AprendeHoy | — | Planificado |
| Pagos (Mercado Pago) | — | Planificado |

Roadmap estratégico: [PRODUCT-ROADMAP-2026-2028](./docs/strategy/PRODUCT-ROADMAP-2026-2028.md) · Cierre Foundation: [FOUNDATION-COMPLETE](./docs/strategy/FOUNDATION-COMPLETE.md)

### Estrategia de entrega

1. **Foundation (completada):** Core multi-tenant, CMS, Identity, Workflow, Event Bus, Portal Engine; portal SEM premium v2.4.
2. **Platform Infrastructure (actual):** Search, Notifications, Analytics, Forms, Observability.
3. **Business Platform (siguiente):** CRM, Admisiones, Académico, Finanzas, Certificación.

Ver [Product Roadmap 2026–2028](./docs/strategy/PRODUCT-ROADMAP-2026-2028.md).

---

## Estado del proyecto

| Versión | Tag | Módulos principales |
| --- | --- | --- |
| 2.4.0 | — | Conversión, Home CMS-driven, correcciones P0 |
| 2.0.0 | v2.0.0-portal-engine | Portal Engine CMS-driven |
| 1.9.0 | v1.9.0-event-bus | Event Bus & Domain Events |
| 2.3.0 | — | Ecosistema Académico (noticias, eventos, biblioteca, recursos) |
| 2.2.0 | — | Confianza Institucional |
| 2.1.0 | — | Programas Premium |
| 1.4.0 | v1.4.0-portal-ux | Portal UX público, gobierno documental |
| 1.3.0 | v1.3.0-media-library | Media Library |
| 1.2.0 | v1.2-content-engine | Content Engine |
| 1.1.0 | v1.1-menu-engine | Menu Engine |
| 1.0.0 | v1.0-base | Infraestructura, Configuration Hub, Design System |

Detalle: [RELEASES.md](./RELEASES.md)

---

## Licencia

Proyecto privado — Seminario Eclesiástico Mayor.
