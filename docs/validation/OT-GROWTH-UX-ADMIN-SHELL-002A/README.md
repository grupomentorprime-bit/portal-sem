# OT-GROWTH-UX-ADMIN-SHELL-002A — Origen humano en Personas

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-ADMIN-SHELL-002A |
| Tipo | Ajuste mínimo de proyección (presentación) |
| Fecha | 2026-09-06 |
| Cierre | 2026-09-06 |
| Estado | **CERRADA · APTO** |
| Predecesora | [OT-GROWTH-UX-ADMIN-SHELL-002](../OT-GROWTH-UX-ADMIN-SHELL-002/README.md) · **CERRADA · APTO VISUAL** |
| Criterio APTO | Origen visible en Personas = `Portal web / Admisión`; sin `portal-admision` en Inicio / Personas / Ventas |

---

## Objetivo

Corregir el único hallazgo de lenguaje de la validación visual humana de SHELL-002: en `/admin/personas` el origen no debe mostrar el identificador técnico.

Reemplazo visible:

- Antes: `Admisión · portal-admision`
- Después: `Portal web / Admisión`

## Alcance

| # | Cambio | Detalle |
| --- | --- | --- |
| 1 | Presentación Personas | `personas-read` aplica `humanizeOriginDisplayLabel` (mismo helper que Ventas) al listado, ficha y detalle de Oportunidad |

Sin hardcode exclusivo en UI de Personas. El valor persistido (`origin.channel`) no cambia.

## Fuera de alcance

No se tocó Shell, navegación, Growth Core, Ventas (salvo el helper ya compartido), APIs, Workflow, Event Bus, seguridad ni multi-tenant. Ningún otro cambio visual.

## Verificación

```bash
npx tsx --test tests/baseline/growth-os-admin-shell-002a.test.ts
# con npm run dev:
npx tsx --env-file=.env scripts/capture-growth-ux-admin-shell-002a.ts
```

| Chequeo | Resultado |
| --- | --- |
| Baseline 002A | OK |
| `portal-admision` ausente en Inicio / Personas / Ventas | OK |
| Label humano presente | OK (`Portal web / Admisión`) |

## Evidencia

| Archivo | Rol |
| --- | --- |
| [`admin-personas.png`](./admin-personas.png) | `/admin/personas` con origen humanizado |

## Veredicto

**CERRADA · APTO** — proyección de origen alineada con Ventas e Inicio.

Con [SHELL-002](../OT-GROWTH-UX-ADMIN-SHELL-002/README.md) **CERRADA · APTO VISUAL**:

**GROWTH OS ADMIN SHELL V1 = CERRADO · APTO** 🔒

Patrón de `/admin` productivo **congelado**. Sin otra OT abierta desde este cierre.
