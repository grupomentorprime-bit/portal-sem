# OT-GROWTH-PROD-004 — Documentación de entrada Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PROD-004 |
| ADR | [ADR-009](../../architecture/ADR-009.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | Un desarrollador/agente nuevo comprende en pocos minutos qué es Growth OS, qué existe hoy, qué pertenece a SEM/ADL y qué está en roadmap |

## Objetivo

Que quien abra el repositorio entienda de inmediato que trabaja sobre **Growth OS**, no sobre Portal SEM ni AprendeHoy Learning OS.

Solo documentación vigente de entrada y orientación. Sin reescribir historial (OTs, auditorías, actas, ADRs) solo por nombres. Sin código.

## Contrato explícito

| Concepto | Definición |
| --- | --- |
| Growth OS | Producto de este repo |
| Espacio | Cliente / organización en UI |
| Tenant | Término técnico interno |
| SEM T001 / ADL T002 | Clientes reales |
| Educación | Vertical |
| Aprende Hoy | Sistema académico separado; integración opt-in |

Brújula: atraer personas, no perder oportunidades y convertirlas en clientes, alumnos o participantes.

Principio: **Simple por fuera. Potente por dentro.**

Hoy ≠ roadmap: no presentar CRM / Growth Core / automatizaciones como disponibles.

## Entregables

| Superficie | Cambio |
| --- | --- |
| [README.md](../../../README.md) | Entrada Growth OS; hoy vs roadmap; ADR-008/009 |
| [HANDBOOK.md](../../HANDBOOK.md) | Orientación vigente Growth OS |
| [docs/README.md](../../README.md) | Índice; ADR-008/009 primero; glosario; handoff |
| [GLOSSARY.md](../../GLOSSARY.md) | Glosario de producto (nuevo) |
| [GROWTH-OS-HANDOFF-APRENDE-HOY.md](../../architecture/GROWTH-OS-HANDOFF-APRENDE-HOY.md) | Mapa de productos actualizado |
| [PORTAL-HANDOFF-LEARNING-OS.md](../../architecture/PORTAL-HANDOFF-LEARNING-OS.md) | Stub → documento vigente |
| [DEVELOPER-GUIDE.md](../../development/DEVELOPER-GUIDE.md) | Punto inicial agente/dev |

## Fuera de alcance

- Código, chrome runtime, créditos (PROD-001→003)
- Reescritura de OTs / auditorías / ADRs históricos
- Growth Core, CRM, planes
- Pack editorial SEM / adapter Aprende Hoy (comportamiento)

## Pruebas

Solo documentación. Baseline de runtime **no exigido** para este cambio (sin código). Validación:

1. Links internos principales de entrada resuelven.
2. README / Handbook / Glosario / índice no presentan este repo como Portal SEM o Learning OS.
3. ADR-008 y ADR-009 referenciados desde la entrada.

## Criterios de aceptación

- [x] README principal = Growth OS + brújula + principio + hoy/roadmap
- [x] Handbook vigente alineado; reglas Core UI conservadas
- [x] Índice docs con ADR-008/009 y glosario
- [x] Glosario explícito (Espacio / Tenant / SEM / ADL / Aprende Hoy)
- [x] Handoff renombrado en mapa de productos; stub en nombre histórico
- [x] DEVELOPER-GUIDE como entrada agente/dev
- [x] Sin CRM/automatizaciones como capacidades actuales
- [x] Sin modificar OTs/auditorías/ADRs históricos solo por nombres
- [x] Sin tocar código

## Veredicto

**APTO** — documentación de entrada presenta Growth OS como producto; SEM/ADL como clientes; Aprende Hoy como sistema separado; roadmap separado de “hoy”. Links de entrada verificados.
