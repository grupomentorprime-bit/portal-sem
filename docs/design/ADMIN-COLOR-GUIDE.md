# Guía de color — Portal Administrativo SEM

**OT-SEM-BRANDING-001** · Identidad visual del backoffice

## Principio rector

El azul institucional SEM es el color dominante. Verde, ámbar y rojo se reservan exclusivamente para estados semánticos (éxito, advertencia, error). No usar turquesa, morado u orange como acentos decorativos.

## Paleta oficial

| Token | Valor / origen | Uso |
| --- | --- | --- |
| `--color-primary` | `#002A47` (`--sem-primary`) | Sidebar, botones primarios, links, barras de progreso |
| `--color-secondary` | `#246AA1` | Hover, tarjetas activas, acentos secundarios |
| `--color-success` | `#3ED6AF` | Llegó, completado, confirmado |
| `--color-warning` | `#c98a2e` | Pendiente, justificado, revisión |
| `--color-danger` | `#b42318` | Crítico, rechazado, error |
| `--background-soft` | `--gray-50` | Fondo de workspace |
| `--admin-surface` | `#ffffff` | Tarjetas KPI, paneles |

Fuente de tokens: `src/styles/tokens/admin-branding.css`, `colors.css`, `brand.css`.

## KPIs (AEK `KpiCard`)

- Fondo blanco, borde sutil, sombra `--admin-shadow-card`.
- Acento solo en borde izquierdo (3px) e icono.
- Prop `accent`: `primary` | `info` | `success` | `warning` | `neutral`.
- **No** usar gradientes de fondo en tarjetas métricas.

## Badges

Tres familias semánticas (+ neutral):

| Variante | Color | Cuándo |
| --- | --- | --- |
| `info` | Azul | Información, borrador |
| `success` | Verde | Activo, llegó, publicado |
| `warning` | Ámbar | Pendiente, revisión |
| `error` | Rojo | Rechazado, error |
| `neutral` | Gris | Inactivo, sin respuesta |

## Botones

| Variante | Apariencia |
| --- | --- |
| `primary` | Azul institucional, texto blanco |
| `secondary` / `outline` | Blanco con borde |
| `danger` | Rojo |
| `success` | Verde (solo acciones de confirmación exitosa) |

## Barras de progreso

- En curso: `--admin-progress-fill` (azul).
- Completado (100%): `--admin-progress-complete` (verde).
- Track: `--admin-progress-track` (gris claro).

## Sidebar

- Fondo: `--color-primary`.
- Texto: variables `--sidebar-fg` / `--sidebar-fg-muted`.
- Hover suave: `--sidebar-hover` (blanco 10%).
- Activo: `--sidebar-active` (blanco 14%).

## Espaciado

Escala unificada (8px base): `--space-sm` (8), `--space-md` (16), `--space-lg` (24), `--space-xl` (32), `--space-2xl` (48).

## Anti-patrones

- Tarjetas KPI con gradiente multicolor.
- Verde como color principal de UI.
- Turquesa (`--sem-accent`) en KPIs o badges (reservado al portal público).
- Sombras fuertes tipo “card flotante”.
- Más de un color de acento compitiendo en la misma fila de métricas.

## Dashboard (OT-SEM-DASHBOARD-002)

- Hero compacto: `px-4 py-4`, borde izquierdo primario, badges alineados a la derecha en desktop.
- KPI layout `metric-first`: valor → label → delta.
- Accesos rápidos: `priority="primary"` (borde izquierdo azul), filas secundaria y default.
- Storytelling vertical: estado → alertas → KPIs → accesos → actividad → sistema.
