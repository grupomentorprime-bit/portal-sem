# EP-002 — CRM & Admisiones

| Atributo | Valor |
| --- | --- |
| Código | EP-002 |
| Estado | ⚪ Diseño aprobado — implementación pendiente |
| Dependencia | EP-001 🟡 · Platform Core ✅ |

> **Nota de numeración:** Este documento sustituye a `EP-001-CRM-ADMISSIONS.md` en el roadmap de producto v2. El contenido arquitectónico detallado permanece en el archivo legacy.

---

## Objetivo

Administrar el ciclo de vida del postulante **desde la primera visita hasta la matrícula**, con trazabilidad, workflows y eventos sobre el Platform Core.

---

## Flujo completo

```
Visita
   ↓
Programa
   ↓
Postulación
   ↓
Evaluación
   ↓
Entrevista
   ↓
Aceptación
   ↓
Pago
   ↓
Matrícula
```

---

## Alcance

| Dominio | Responsabilidades |
| --- | --- |
| CRM | Leads, prospectos, embudos, campañas, seguimiento, agenda |
| Admisiones | Postulación, documentos, revisión, aprobación, matrícula |

---

## Dependencias

| Dependencia | Estado |
| --- | --- |
| EP-001 Portal (captación) | 🟡 |
| Identity Engine | ✅ |
| Workflow Engine | ✅ |
| Event Bus | ✅ |
| Asset Engine | ✅ |
| Forms Engine | ⏳ Stub |
| Search / Analytics | ⏳ Stub |

---

## OTs planificadas

| OT | Objetivo | Estado |
| --- | --- | --- |
| OT-CRM-001 | Modelo de datos (Persona, Lead, Postulación) | ⚪ |
| OT-CRM-002 | Pipeline visual | ⚪ |
| OT-ADM-001 | Formularios y documentos | ⚪ |
| OT-ADM-002 | Revisión y aprobación | ⚪ |
| OT-ADM-003 | Matrícula → estudiante | ⚪ |
| OT-CRM-003 | Seguimiento y comunicaciones | ⚪ |
| OT-CRM-004 | Reportes y analítica | ⚪ |

**Documentación arquitectónica completa:** [EP-001-CRM-ADMISSIONS.md](./EP-001-CRM-ADMISSIONS.md) *(legacy, contenido vigente)*

---

## Criterios de cierre

| Criterio | Meta |
| --- | --- |
| Postulación end-to-end en workflow | Estados trazables |
| Handoff a dominio académico en matrícula | Identity + expediente |
| Eventos publicados en Event Bus | `Application*`, `Enrollment*` |
| UI admin en Experience Kit | Sin branding fuera de tokens |
| Configurable por tenant | Workflows y formularios |

---

## Referencias

- Roadmap: [PRODUCT-ROADMAP-2026-2028.md](../PRODUCT-ROADMAP-2026-2028.md)
- Épica anterior: [EP-001](./EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)
- Siguiente: [EP-003 — Campus Virtual](./EP-003-CAMPUS-VIRTUAL.md)
