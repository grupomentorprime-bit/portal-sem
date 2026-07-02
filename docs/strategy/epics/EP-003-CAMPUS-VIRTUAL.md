# EP-003 — Campus Virtual

| Atributo | Valor |
| --- | --- |
| Código | EP-003 |
| Estado | ⚪ Pendiente |
| Dependencia | EP-002 ⚪ · Platform Core ✅ |

---

## Objetivo

Ofrecer la **experiencia del estudiante matriculado**: aula, recursos, calendario, pagos, certificados y comunicaciones — sobre el mismo Experience Kit y tenant context.

---

## Alcance

| Módulo | Descripción |
| --- | --- |
| Dashboard estudiante | Resumen académico y alertas |
| Cursos / Aula virtual | Contenidos, actividades, entregas |
| Biblioteca | Recursos digitales institucionales |
| Calendario | Clases, eventos, plazos |
| Pagos | Estado de cuenta (integración finanzas) |
| Certificados | Consulta y descarga |
| Expediente académico | Historial y documentos |
| Comunicaciones | Avisos, mensajería institucional |

---

## Dependencias

| Dependencia | Estado |
| --- | --- |
| EP-002 Matrícula | ⚪ |
| Identity & roles estudiante | ✅ base |
| Gestión académica (datos) | ⚪ |
| Finanzas | ⚪ |

---

## OTs asociadas

| OT | Objetivo | Estado |
| --- | --- | --- |
| OT-CAMPUS-001 | Dashboard y shell estudiante | ⚪ |
| OT-CAMPUS-002 | Aula virtual v1 | ⚪ |
| OT-CAMPUS-003 | Biblioteca y calendario | ⚪ |
| OT-CAMPUS-004 | Expediente y certificados | ⚪ |

*(Numeración tentativa — definir al abrir épica)*

---

## Criterios de cierre

| Criterio | Meta |
| --- | --- |
| Estudiante accede post-matrícula | Login + rol |
| Cursos asignados visibles | Desde dominio académico |
| UI 100 % Experience Kit | EP-000 |
| Responsive y accesible | WCAG AA |
| Multi-tenant | Sin forks de componentes |

---

## Referencias

- Roadmap: [PRODUCT-ROADMAP-2026-2028.md](../PRODUCT-ROADMAP-2026-2028.md)
- Épica anterior: [EP-002](./EP-002-CRM-ADMISSIONS.md)
- Siguiente: [EP-004](./EP-004-BACKOFFICE-ACADEMICO.md)
