# OT-GROWTH-UX-ADMIN-MASTER-001A — Refinamiento visual final

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-ADMIN-MASTER-001A |
| Tipo | Refinamiento visual (maqueta) |
| Fecha | 2026-09-05 |
| Cierre | 2026-09-05 |
| Estado | **CERRADA · APTO VISUAL** |
| Predecesora | [OT-GROWTH-UX-ADMIN-MASTER-001](../OT-GROWTH-UX-ADMIN-MASTER-001/README.md) · **CERRADA · APTO VISUAL** |
| Criterio APTO | Validación visual humana de `/dev-preview/admin-master` (no automático) |

---

## Objetivo

Cerrar el refinamiento visual de la maqueta de Inicio **sin** rediseño estructural.

Mantener íntegramente la maqueta aprobada en 001. Aplicar solo cinco ajustes de superficie.

## Alcance

| # | Cambio | Detalle |
| --- | --- | --- |
| 1 | Encabezado | Acento Growth OS muy sutil (barra + velo). Sin hero grande. |
| 2 | Qué hacer ahora | La próxima acción se lee como tarea; CTA humano **Atender** con destino real (`/admin/personas/[id]`). |
| 3 | Origen | Identificadores técnicos no se muestran (`portal-admision` → `Portal web / Admisión`). El valor persistido no cambia. |
| 4 | De dónde están llegando | Filas simples fuente + cantidad, listas para varias fuentes. Sin gráficos ni porcentajes. |
| 5 | Buscador | Sigue limitado a Personas. Sin búsqueda global. |

Ruta de maqueta (solo desarrollo):

- Con datos: `/dev-preview/admin-master`
- Vacío: `/dev-preview/admin-master?empty=1`

## Fuera de alcance

No se tocó:

- Growth Core (stores, ingestión, backfill, contratos, `growth_*`)
- APIs, Mongo (salvo lectura de presentación ya existente), seguridad, aislamiento
- `/platform`, `/admin` productivo, rutas legacy
- Módulos futuros (Ventas, Mensajes, Campañas, Automatizaciones, Analítica)
- Rediseño estructural del bento, sidebar o navegación maestra

## Dirección visual (sin cambiar el patrón)

- Misma composición 001: métricas + Qué hacer ahora mayor + Oportunidades + Actividad + orígenes
- Encabezado compacto; no vuelve el hero de Platform Admin
- CTA Atender usa `--growth-os-primary`; no sustituye el copy de la próxima acción
- Orígenes: encabezado de columnas Fuente / Cantidad; una fila por fuente real

## Componentes

Solo superficie de la maqueta en `src/components/admin/preview/growth-os-master/`.

| Pieza | Rol |
| --- | --- |
| `GrowthOsAdminHomeMaster.tsx` | Encabezado, atención, filas de origen |
| `humanize-origin-display.ts` | Label visible de origen (presentación) |
| `project-home.ts` | Usa el label humano al agrupar; no persiste |
| `GrowthOsAdminMasterShell.tsx` | Buscador Personas sin cambio de alcance |

## Entrega (norma visual congelada)

| Archivo | Rol |
| --- | --- |
| [`admin-master-data.png`](./admin-master-data.png) | Maqueta con datos reales — patrón maestro aprobado |
| [`admin-master-empty.png`](./admin-master-empty.png) | Maqueta con 0 registros — patrón maestro aprobado |

```bash
# con npm run dev en marcha (preferir Espacio ADL)
npx tsx --env-file=.env scripts/capture-growth-ux-admin-master-001a.ts
```

El vacío **no muta Mongo**: fuerza ceros en la proyección.

## Criterios

- [x] Maqueta 001 intacta en estructura
- [x] Encabezado con acento Growth OS sutil; sin hero grande
- [x] Qué hacer ahora con próxima acción visible y CTA Atender
- [x] Sin identificadores técnicos de origen en UI
- [x] Orígenes como filas fuente + cantidad (varias fuentes)
- [x] Buscador limitado a Personas
- [x] Sin tocar Core, APIs, `/platform` ni `/admin` productivo
- [x] **Validación visual humana** — aprobada 2026-09-05

## Restricciones

- No más microajustes de esta maqueta salvo OT futura explícita
- No sustituir `/admin` productivo ni el sidebar azul actual salvo OT futura explícita
- No eliminar rutas legacy
- No abrir módulos de Crecer / Ventas / Mensajes
- No más rediseños estructurales en esta cadena

## Veredicto

**CERRADA · APTO VISUAL** — refinamiento de superficie aprobado. Patrón maestro del Espacio Growth OS **congelado** (métricas + Qué hacer ahora + Oportunidades + Actividad + orígenes; encabezado compacto; CTA Atender; orígenes humanos). Estas capturas son la norma. Sin más microajustes salvo OT futura explícita. Implementar como Shell de `/admin` solo con OT futura explícita.
