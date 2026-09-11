# OT-GROWTH-PROD-ADR-001 — Contrato de producto Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PROD-ADR-001 |
| Tipo | ADR / contrato (solo documentación) |
| Fecha | 2026-09-04 |
| ADR | [ADR-009 — Contrato de producto Growth OS](../../architecture/ADR-009.md) |
| Criterio APTO | Se puede iniciar **OT-GROWTH-PROD-001** sin inventar qué es el producto, qué es un cliente y qué queda para Growth Core |

## Objetivo

Antes de cambiar chrome, correo o docs de entrada: fijar el contrato de producto. Fundación SaaS V1 ya está APTO; este frente no reabre SAAS-001→009.

Solo análisis y documentación. Sin implementación.

## Entradas revisadas

- [ADR-008](../../architecture/ADR-008.md) y SAAS-001→009 (cerradas)
- Runtime: login admin, `PLATFORM_DISPLAY_NAME`, créditos, email from, pack SEM vs T002
- [OT-PORTAL-SAAS-000](../../AI/auditorias/OT-PORTAL-SAAS-000-AUDITORIA.md) (ítem «contrato de producto», aplazado por la Fundación)
- UX Espacio (Frente 2)
- Handoff portal → académico ([PORTAL-HANDOFF](../../architecture/PORTAL-HANDOFF-LEARNING-OS.md))

## Entrega (contrato)

Detalle normativo en **[ADR-009](../../architecture/ADR-009.md)**. Resumen:

| Tema | Decisión |
| --- | --- |
| Producto | **Growth OS** — este repositorio |
| Vertical | Educación (primera; no es el nombre del producto) |
| Clientes | SEM = T001; ADL = T002; cero lógica por cliente |
| Aprende Hoy | Sistema académico, otro producto; adapter opt-in |
| Lenguaje UI | Espacio, Sitio, cuenta — no tenant, no «CMS del SEM», no Learning OS |
| Pack vs chrome | Datos SEM/ADL intactos; se cambia chrome/defaults de plataforma |
| Productization V1 | Chrome → correo → créditos → docs de entrada |
| Growth Core | Diferido (CRM, recorridos, automatizaciones, planes) |

### Primeras OTs de implementación (orden)

1. PROD-001 — chrome visible (login/admin/fallbacks)
2. PROD-002 — correo desde Site/Espacio
3. PROD-003 — créditos / copy de plataforma
4. PROD-004 — docs de entrada Growth OS

## Criterios de aceptación

- [x] No reabre ADR-008 ni SAAS-001→009
- [x] Separa producto, vertical, cliente y Aprende Hoy
- [x] Fija lenguaje visible vs código
- [x] Lista ordenada de Productization V1; Growth Core fuera
- [x] Sin código de producto ni cambios de modelos en esta OT

## Restricciones

- No tocar producción
- No crear motores nuevos
- Baseline de entrada: 89/89 + tsc + build (heredado de Fundación; esta OT no corre código)

**Veredicto: APTO** — contrato suficiente para abrir **OT-GROWTH-PROD-001**.
