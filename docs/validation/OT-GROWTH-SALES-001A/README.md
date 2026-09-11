# OT-GROWTH-SALES-001A — Simplificar operación de Ventas

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SALES-001A |
| Tipo | Ajuste UX funcional (superficie operativa) |
| Fecha | 2026-09-05 |
| Estado | **ENTREGADA · pendiente validación visual humana** |
| Predecesora | [OT-GROWTH-SALES-001](../OT-GROWTH-SALES-001/README.md) · **CERRADA · APTO TÉCNICO** |
| Criterio APTO VISUAL | Solo validación humana (no automático) |

---

## Objetivo

Hacer que atender una Oportunidad sea simple y cotidiano. No exponer la mecánica interna de Growth Core.

SALES-001 ya tiene **APTO TÉCNICO**. Esta pasada no re-certifica técnica: solo simplifica la experiencia operativa detectada en la validación visual.

## Qué cambió (solo superficie)

| # | Área | Cambio |
| --- | --- | --- |
| 1 | Cabecera | Breadcrumb `Ventas > {Persona}` (override Shell V2; sin IDs de ruta). Origen humanizado (`portal-admision` → `Portal web / Admisión`). |
| 2 | Acción principal | «Qué hacer ahora» como centro; editable con Guardar / Quitar acción. |
| 3 | Seguimiento | Texto libre + **Guardar nota** / **Registrar contacto** (sin selector Nota/Contacto). |
| 4 | Estado | `Estado actual: …` + **Cambiar estado** → opciones humanas del Workflow (Ganada, Perdida…). Sin «Aplicar estado». |
| 5 | Historial | Título **Qué ha pasado** (Timeline existente). |
| 6 | Listado | Misma cola; origen humanizado; «Qué hacer ahora» más visible que metadatos. |

## Qué no se tocó

- Growth Core, APIs (salvo proyección de presentación), Workflow, Event Bus, contratos
- Shell admin, segundo CRM / motor, automatizaciones, IA, nuevos estados

## Evidencia visual (validación humana)

| Captura | Contenido |
| --- | --- |
| [`admin-ventas-list.png`](./admin-ventas-list.png) | Cola Ventas |
| [`admin-ventas-operate.png`](./admin-ventas-operate.png) | Oportunidad completa |
| [`admin-ventas-change-status.png`](./admin-ventas-change-status.png) | Interacción Cambiar estado |
| [`admin-ventas-follow-up.png`](./admin-ventas-follow-up.png) | Seguimiento con texto humano |

```bash
# con npm run dev en marcha (preferir Espacio ADL)
npx tsx --env-file=.env scripts/capture-growth-sales-001a.ts
```

**No se declara APTO VISUAL.** Esperar validación visual humana.
