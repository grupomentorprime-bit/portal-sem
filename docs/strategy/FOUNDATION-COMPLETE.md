# AprendeHoy Learning OS — Foundation Complete

## Cierre Oficial de la Etapa I

**Versión:** 2.0.0  
**Fecha:** Junio 2026  
**Estado:** Foundation & Platform Core finalizados  
**Tag:** `v2.0.0-portal-engine`

---

# Introducción

Con esta versión se declara oficialmente finalizada la etapa **Foundation & Platform Core** de AprendeHoy Learning OS.

Durante esta etapa se construyó la infraestructura tecnológica que permitirá soportar múltiples instituciones, múltiples dominios de negocio y futuras capacidades sin modificar la arquitectura central.

A partir de este punto, el desarrollo deja de enfocarse en construir infraestructura básica y pasa a desarrollar capacidades de negocio reutilizando el Platform Core.

---

# Objetivos alcanzados

## Arquitectura Multi-Tenant

Estado: ✅ Completado

Capacidades:

* Tenant Context
* Tenant Security
* Tenant Branding
* Tenant Navigation
* Tenant Configuration

Documentación: [TENANT-GUIDELINES.md](../core/TENANT-GUIDELINES.md)

---

## Content Platform

Estado: ✅ Completado

Incluye:

* CMS (Configuration Hub, Page Builder, Menús)
* Content Engine
* Bloques reutilizables
* Menús dinámicos
* Media integrada

Documentación: [docs/cms/](../cms/)

---

## Asset Platform

Estado: ✅ Completado

Incluye:

* Asset Engine
* Media Library
* Media Resolver
* `mediaId`
* Optimización automática
* Usage Index
* Compatibilidad S3

Documentación: [OT-CORE-MEDIA-001](../ot/OT-CORE-MEDIA-001.md) · [ADR-003](../architecture/ADR-003.md)

---

## Identity Platform

Estado: ✅ Completado

Incluye:

* Usuarios
* Membresías
* Roles
* Permisos
* Policies
* Sesiones
* Auditoría
* Invitaciones

Documentación: [IDENTITY.md](../core/IDENTITY.md) · [ADR-004](../architecture/ADR-004.md)

---

## Workflow Platform

Estado: ✅ Completado

Incluye:

* Workflow Engine
* Estados
* Transiciones
* Guards
* Historial
* Auditoría
* Integración con Identity

Documentación: [WORKFLOW.md](../core/WORKFLOW.md) · [ADR-005](../architecture/ADR-005.md)

---

## Event Platform

Estado: ✅ Completado

Incluye:

* Event Bus
* Publicación y suscripción
* Eventos tipados
* Replay
* Persistencia
* Integración transversal

Documentación: [EVENTS.md](../core/EVENTS.md) · [ADR-006](../architecture/ADR-006.md) · Tag `v1.9.0-event-bus`

---

## Portal Platform

Estado: ✅ Completado

Incluye:

* Portal Engine
* Block Registry
* Portal Renderer
* Resolver
* SEO consolidado
* Condiciones por bloque
* Integración con CMS

Documentación: [PORTAL-ENGINE.md](../core/PORTAL-ENGINE.md) · [ADR-007](../architecture/ADR-007.md)

---

# Principios arquitectónicos consolidados

Durante Foundation quedaron establecidos los siguientes principios permanentes.

## 1. Configuración antes que programación

El comportamiento del sistema debe resolverse mediante configuración siempre que sea posible.

## 2. Multi-tenant por diseño

Toda capacidad del Core debe ser reutilizable por cualquier institución.

## 3. Motores desacoplados

Cada motor expone servicios e interfaces públicas sin depender directamente de otros módulos.

## 4. Comunicación mediante eventos

Las acciones relevantes generan Domain Events. Los módulos consumidores reaccionan mediante el Event Bus.

## 5. Identidad única

Los usuarios pertenecen a uno o más tenants mediante Memberships. Los permisos se resuelven mediante Policies.

## 6. Media como activo

Los recursos multimedia se identifican mediante `mediaId`. La URL es un atributo derivado.

## 7. Workflows genéricos

Los procesos pertenecen al Workflow Engine. Los módulos solo definen estados y reglas.

## 8. Portal dirigido por CMS

El Portal Engine renderiza páginas según bloques definidos en el CMS. El código no define el orden del contenido.

Referencia: [PLATFORM-CONVENTIONS.md](../core/PLATFORM-CONVENTIONS.md)

---

# Motores implementados

| Motor | Estado |
| --- | :---: |
| Multi-Tenant | ✅ |
| Branding Engine | ✅ |
| Navigation Engine | ✅ |
| CMS | ✅ |
| Content Engine | ✅ |
| Asset Engine | ✅ |
| Identity Engine | ✅ |
| Security | ✅ |
| Workflow Engine | ✅ |
| Event Bus | ✅ |
| Portal Engine | ✅ |

---

# Documentación consolidada

La arquitectura queda respaldada por:

| Documento | Enlace |
| --- | --- |
| Arquitectura general | [ARQ-001](../architecture/ARQ-001.md) · [ARQ-002](../architecture/ARQ-002.md) · [ARQ-003](../architecture/ARQ-003.md) |
| Decisiones (ADR) | [ADR-003](../architecture/ADR-003.md) – [ADR-007](../architecture/ADR-007.md) |
| Core Architecture | [CORE-ARCHITECTURE.md](../core/CORE-ARCHITECTURE.md) |
| Platform Conventions | [PLATFORM-CONVENTIONS.md](../core/PLATFORM-CONVENTIONS.md) |
| Tenant Guidelines | [TENANT-GUIDELINES.md](../core/TENANT-GUIDELINES.md) |
| Product Roadmap | [PRODUCT-ROADMAP-2026-2028.md](./PRODUCT-ROADMAP-2026-2028.md) |

---

# Cambio de enfoque

Hasta esta versión el proyecto estuvo orientado a construir infraestructura.

Desde la siguiente etapa el foco será desarrollar capacidades de negocio reutilizando el Platform Core.

El Core deja de crecer por iniciativa propia y evoluciona únicamente cuando una necesidad transversal lo justifique (véase [Platform Infrastructure](./PRODUCT-ROADMAP-2026-2028.md#platform-infrastructure--en-desarrollo-) en el roadmap).

---

# Etapa II — Producto (EP-001+)

Las épicas de producto vigentes están en el [Product Roadmap v2](./PRODUCT-ROADMAP-2026-2028.md):

| Épica | Enfoque | Estado |
| --- | --- | --- |
| [EP-000](./epics/EP-000-FOUNDATION-EXPERIENCE-KIT.md) | Foundation / Experience Kit | ✅ Completada |
| [EP-001](./epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md) | Portal Institucional Premium | 🟡 Planificación |
| [EP-002](./epics/EP-002-CRM-ADMISSIONS.md) | CRM & Admisiones | ⚪ Diseño |
| [EP-003](./epics/EP-003-CAMPUS-VIRTUAL.md) | Campus Virtual | ⚪ Pendiente |
| [EP-004](./epics/EP-004-BACKOFFICE-ACADEMICO.md) | Backoffice Académico | ⚪ Pendiente |

**Primera OT de producto recomendada:** [OT-PORTAL-001 — Home Institucional Definitivo](../ot/OT-PORTAL-001.md)

Arquitectura CRM (contenido detallado): [EP-001-CRM-ADMISSIONS.md](./epics/EP-001-CRM-ADMISSIONS.md) *(renumerada como EP-002 en roadmap v2)*.

Todos estos dominios consumen el Platform Core y el Experience Kit (EP-000).

---

# Tenant piloto — SEM

El Portal Institucional SEM evoluciona bajo **EP-001**, reutilizando módulos premium LOCKED (Hero, Timeline, Contact Hub, etc.) y el CMS alineado al Experience Kit.

---

# Visión de largo plazo

AprendeHoy evoluciona desde un portal institucional hacia un **Learning Operating System (Learning OS)**.

El objetivo es proporcionar una plataforma única capaz de operar universidades, institutos, OTEC, colegios, fundaciones, empresas y organizaciones de aprendizaje mediante un Core compartido y dominios especializados.

---

# Declaración de cierre

Con la publicación de la versión **2.0.0**, se declara oficialmente concluida la etapa **Foundation & Platform Core**.

Las siguientes versiones del producto estarán orientadas principalmente a resolver procesos de negocio y experiencias de usuario, utilizando la infraestructura desarrollada durante esta primera etapa como base estable y reutilizable para todos los tenants.

---

> **"El Core ya no es el objetivo. A partir de ahora, el Core es la plataforma sobre la que se construye el producto."**
