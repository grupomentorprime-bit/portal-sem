# EP-001 — CRM & Admissions Platform

> **⚠️ Renumeración roadmap v2 (julio 2026):** Esta épica de dominio pasa a codificarse como **[EP-002 — CRM & Admisiones](./EP-002-CRM-ADMISSIONS.md)** en el roadmap de producto. El contenido arquitectónico de este archivo **sigue vigente**; use EP-002 para estado, dependencias y cierre de épica.

## Arquitectura Funcional del Dominio

**Learning OS – Business Platform**  
**Versión:** 1.0  
**Estado:** Diseño arquitectónico  
**Épica:** CRM + Admisiones (unificadas)

---

# Propósito

El dominio **CRM & Admisiones** administra el ciclo de vida completo de una persona desde su primer contacto con la institución hasta convertirse en estudiante activo.

Este dominio constituye el puente entre el **Portal Público** y la **Gestión Académica**.

No reemplaza al Core; consume las capacidades del Platform Core:

| Core | Uso en el dominio |
| --- | --- |
| Identity | Usuarios, membresías, permisos al matricular |
| Workflow | Estados Lead, Postulación, Matrícula |
| Event Bus | Automatizaciones y analítica |
| Portal Engine | Captación vía formularios y landings |
| Asset Engine | Expediente documental (`mediaId`) |
| Search | Búsqueda de postulantes *(Core pendiente: OT-CORE-SEARCH-001)* |
| Analytics | Conversión por etapa *(Core pendiente: OT-CORE-ANALYTICS-001)* |
| Forms Engine | Formularios de postulación *(Core pendiente: OT-CORE-FORMS-001)* |

Referencia de cierre Foundation: [FOUNDATION-COMPLETE.md](../FOUNDATION-COMPLETE.md)

---

# Principios

* Una persona existe una sola vez en la plataforma.
* El estado de una persona cambia mediante workflows.
* Todo cambio genera eventos.
* Toda interacción queda registrada.
* Toda comunicación es trazable.
* El proceso debe ser configurable por tenant.

---

# Ciclo de vida del postulante

```text
Visitante
      │
      ▼
Lead
      │
      ▼
Prospecto
      │
      ▼
Interesado
      │
      ▼
Postulación
      │
      ▼
Documentación
      │
      ▼
Evaluación
      │
      ▼
Aceptado
      │
      ▼
Matriculado
      │
      ▼
Estudiante
      │
      ▼
Egresado
      │
      ▼
Titulado
```

Cada transición será administrada por el [Workflow Engine](../../core/WORKFLOW.md).

Las etapas **Estudiante → Egresado → Titulado** pertenecen a la ÉPICA de Gestión Académica; este dominio entrega el handoff en **Matriculado / Estudiante**.

---

# Dominios internos

## CRM

Responsabilidades:

* Leads
* Prospectos
* Contactos
* Embudos
* Campañas
* Seguimiento
* Agenda
* Actividades

## Admisiones

Responsabilidades:

* Postulación
* Programa seleccionado
* Documentación
* Validaciones
* Revisión
* Aprobación
* Matrícula

---

# Entidades principales

## Persona

Representa a una persona única.

* Nunca depende de un programa.
* Puede postular varias veces.
* Identificador transversal del dominio (no confundir con `User` de Identity hasta matrícula).

## Lead

Primer contacto.

Origen:

* Portal
* Landing
* WhatsApp
* Campaña
* Importación
* Referido

## Prospecto

Lead calificado. Existe interés real. Ya puede iniciar una postulación.

## Postulación

Proceso formal. Contiene:

* Programa
* Período académico
* Estado (workflow)
* Documentos
* Observaciones

## Expediente

Repositorio documental del postulante.

Ejemplos: cédula, certificados, licencias, contratos, formularios.

Todos los archivos utilizan el [Asset Engine](../../ot/OT-CORE-MEDIA-001.md) (`mediaId`).

## Matrícula

Marca el ingreso oficial. Genera automáticamente:

* Estudiante (dominio académico)
* Cuenta Identity
* Expediente académico
* Plan financiero (dominio finanzas)

---

# Workflows

El Workflow Engine administrará tres definiciones independientes:

## Lead

```text
Nuevo → Contactado → Calificado → Descartado
```

## Postulación

```text
Borrador → Enviada → En revisión → Observada → Aceptada | Rechazada
```

## Matrícula

```text
Pendiente → Confirmada → Activa → Cancelada
```

---

# Eventos

El [Event Bus](../../core/EVENTS.md) publicará (nombres tentativos, namespace `crm.*` / `admissions.*`):

| Evento | Momento |
| --- | --- |
| `LeadCreated` | Primer registro de contacto |
| `LeadQualified` | Lead pasa a prospecto |
| `ApplicationStarted` | Postulación en borrador |
| `ApplicationSubmitted` | Postulación enviada |
| `ApplicationApproved` | Aprobación admisiones |
| `ApplicationRejected` | Rechazo admisiones |
| `EnrollmentCreated` | Matrícula iniciada |
| `EnrollmentConfirmed` | Matrícula activa — handoff académico/finanzas |

---

# Integraciones con el Core

## Identity

Creación de usuario y membresía al formalizar la matrícula. Permisos por rol (véase abajo).

Documentación: [IDENTITY.md](../../core/IDENTITY.md)

## Workflow

Definición de estados, transiciones, guards e historial por tenant.

Documentación: [WORKFLOW.md](../../core/WORKFLOW.md)

## Event Bus

Automatizaciones, notificaciones y analítica reactiva.

Documentación: [EVENTS.md](../../core/EVENTS.md)

## Asset Engine

Documentación del postulante y expediente.

## Portal Engine

Captación mediante formularios, bloques de conversión y landing pages.

Documentación: [PORTAL-ENGINE.md](../../core/PORTAL-ENGINE.md)

## Search

Búsqueda unificada de personas, leads y postulaciones.

## Analytics

Embudos de conversión y KPIs por etapa.

---

# Indicadores

* Leads generados
* Conversión Lead → Prospecto
* Conversión Prospecto → Postulación
* Conversión Postulación → Matrícula
* Tiempo promedio por etapa
* Documentos pendientes
* Programas con mayor demanda
* Fuente de captación más efectiva

---

# Permisos

Roles previstos (administrados por Identity):

| Rol | Ámbito |
| --- | --- |
| Admissions Manager | Configuración y supervisión del proceso |
| Admissions Officer | Operación diaria CRM y postulaciones |
| Reviewer | Revisión documental y académica |
| Finance | Validación financiera pre-matrícula |
| Academic Coordinator | Programas y cupos |
| Institution Admin | Tenant completo |

---

# Objetivo de la épica

Implementar un proceso completo, trazable y configurable de captación, admisión y matrícula que reutilice íntegramente las capacidades del Platform Core y pueda adaptarse a distintos tipos de instituciones sin cambios en la arquitectura.

---

# Roadmap de la épica

| OT | Objetivo | Estado |
| --- | --- | --- |
| **OT-CRM-001** | Modelo de datos (Persona, Lead, Prospecto, Postulación) | ⚪ Pendiente |
| **OT-CRM-002** | Pipeline visual y gestión de oportunidades | ⚪ Pendiente |
| **OT-ADM-001** | Formularios de postulación y carga documental | ⚪ Pendiente |
| **OT-ADM-002** | Revisión, observaciones y aprobación | ⚪ Pendiente |
| **OT-ADM-003** | Matrícula y creación automática del estudiante | ⚪ Pendiente |
| **OT-CRM-003** | Seguimiento, agenda y comunicaciones | ⚪ Pendiente |
| **OT-CRM-004** | Reportes y analítica de conversión | ⚪ Pendiente |

Orden sugerido de implementación: **OT-CRM-001** → **OT-ADM-001** → **OT-ADM-002** → **OT-ADM-003** → **OT-CRM-002** → **OT-CRM-003** → **OT-CRM-004**.

---

# Relación con el producto

| Documento | Enlace |
| --- | --- |
| Product Roadmap | [PRODUCT-ROADMAP-2026-2028.md](../PRODUCT-ROADMAP-2026-2028.md) |
| Épica 3 — CRM | Roadmap § ÉPICA 3 |
| Épica 4 — Admisiones | Roadmap § ÉPICA 4 |
| Portal SEM (captación actual) | `/admision`, OT-SEM-PORTAL-006 |

---

# Notas de implementación

1. **Código del dominio** vivirá bajo `src/domains/crm/` y `src/domains/admissions/` (o módulo unificado `src/domains/enrollment/`), nunca duplicando lógica del Core.
2. **Persistencia** en colecciones tenant-scoped (`crm_leads`, `crm_persons`, `admissions_applications`, etc.).
3. **OTs** deben seguir [OT-STANDARD.md](../../development/OT-STANDARD.md) cuando se abran formalmente.
4. Dependencias Core **Search**, **Analytics** y **Forms** pueden implementarse en paralelo o con adapters temporales hasta cerrar OT-CORE-* correspondientes.
