# OT-GROWTH-UX-ADMIN-MASTER-001 — Maqueta maestra del Espacio Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-ADMIN-MASTER-001 |
| Tipo | Maqueta visual / definición de dirección |
| Fecha | 2026-09-05 |
| Cierre 001A | 2026-09-05 |
| Estado | **CERRADA · APTO VISUAL** |
| Predecesora | [OT-GROWTH-UX-SHELL-003](../OT-GROWTH-UX-SHELL-003/README.md) · **CERRADA · APTO VISUAL** · [OT-GROWTH-CORE-007](../OT-GROWTH-CORE-007/README.md) · **CERRADA · APTO VISUAL** |
| Refinamiento | [OT-GROWTH-UX-ADMIN-MASTER-001A](../OT-GROWTH-UX-ADMIN-MASTER-001A/README.md) · **CERRADA · APTO VISUAL** |
| Criterio APTO | Validación visual humana de la maqueta `/dev-preview/admin-master` (no automático) |

---

## Objetivo

Diseñar la nueva dirección visual de `/admin` **antes** de implementarla como patrón general.

No crear otro design system. Reutilizar Shell V2, AEK, `components/ui` y tokens existentes. La referencia visual aprobada de Platform Admin orienta composición y modernidad; **no se copia literalmente**.

Inicio debe responder: **¿Qué está pasando, quién necesita atención y qué debo hacer ahora?**

## Alcance

- Maqueta / prototipo visual desktop de `/admin` en `/dev-preview/admin-master`
- Vista con datos reales de Growth Core
- Vista con 0 registros (`?empty=1`)
- Navegación maestra representada (sin migrar rutas legacy)
- Evidencia visual comparativa vs `/admin` actual

## Fuera de alcance

No se tocó:

- Growth Core (stores, ingestión, backfill, contratos)
- APIs, Mongo (salvo lectura de presentación), seguridad, aislamiento
- `/platform`, SaaS Foundation
- Sustitución de `/admin` productivo ni del sidebar azul actual
- Módulos inexistentes (Ventas, Mensajes, Campañas, Automatizaciones, Analítica)

## Principio de Inicio

| Pregunta | Respuesta en la maqueta |
| --- | --- |
| ¿Qué está pasando? | Métricas reales: Personas, Oportunidades, Por atender, Actividad |
| ¿Quién necesita atención? | Bloque principal **Qué hacer ahora** (Persona + motivo + acción) |
| ¿Qué debo hacer ahora? | Próxima acción existente; CTA **Atender** a la ficha |

No se inventan tendencias, porcentajes, ingresos, gráficos, agentes IA, automatizaciones activas ni resultados comerciales.

## Patrón maestro Espacio Growth OS (congelado · UX-ADMIN-MASTER-001A)

Composición de Inicio aprobada y congelada:

**métricas + Qué hacer ahora (área mayor) + Oportunidades + Actividad + orígenes**

Norma visual: capturas de [001A](../OT-GROWTH-UX-ADMIN-MASTER-001A/README.md). La comparativa vs `/admin` actual de esta OT queda como evidencia histórica. Sin más microajustes salvo OT futura explícita.

### Reglas permanentes

| Regla | Decisión |
| --- | --- |
| Superficie | Maqueta en `/dev-preview/admin-master` (solo desarrollo). No sustituye `/admin` productivo |
| Datos | Solo conteos / hechos reales de Growth Core |
| Tendencias | Sin porcentajes, ingresos, gráficos, IA ni automatizaciones inventadas |
| Encabezado | Compacto; acento Growth OS sutil (barra + velo); sin hero grande de Platform Admin |
| Qué hacer ahora | Próxima acción visible; CTA humano **Atender** con destino real |
| Origen | Labels humanos en UI; el valor persistido no cambia |
| Orígenes | Filas fuente + cantidad; sin gráficos ni porcentajes |
| Buscador | Limitado a Personas; sin búsqueda global |
| Identidad | Growth OS = producto (`--growth-os-*`, `ProductMark`); Espacio = nombre / logo / acento de `site_config` |
| Familia | La misma maqueta sirve para ADL, SEM y futuros Espacios |
| Shell productivo | Implementar como Shell general de `/admin` **solo** con OT futura explícita |

## Dirección visual

- SaaS moderno, limpio y liviano
- Sidebar claro/neutro (sin el bloque azul dominante)
- Growth OS = producto; Espacio = nombre / logo / acento secundario
- Fondo neutro suave; cards blancas con borde/sombra discreta
- Bento grid: **Qué hacer ahora** es el área mayor
- Azul Growth OS + acentos verde / violeta / naranja en métricas
- Más densidad útil; sin tarjetas de acceso rápido
- Lenguaje simple y humano (Persona, Oportunidad, Qué hacer ahora)

## Navegación maestra (definición, no migración)

Inicio · Personas · Ventas · Mensajes · Actividad

**Crecer:** Campañas · Automatizaciones · Analítica

Sitio web · Equipo · Ajustes

Personas, Actividad, Sitio web, Equipo y Ajustes enlazan a rutas **ya existentes**. El resto es representación visual (`title`: módulo aún no existe). Las rutas legacy de `/admin` siguen intactas.

## Multi-tenant

Growth OS conserva identidad estable (`--growth-os-*`, `ProductMark`). El Espacio aporta nombre, logo y acento de `site_config` sin teñir el chrome. La misma maqueta sirve para ADL, SEM y futuros Espacios.

## Componentes reutilizados

| Pieza | Origen |
| --- | --- |
| `ProductMark` | `components/product` |
| `AdminUserAvatar` | admin existente |
| `EmptyState`, `StatusBadge`, `Timeline`, `aek.surface` | AEK |
| `formatRelativeTime` | `lib/admin/audit-labels` |
| Saludo `timeOfDayGreeting` / `firstNameFromDisplayName` | `lib/platform/space-labels` (mismo patrón que `/platform`) |
| `listGrowthPersonaViews`, `toActivityView`, labels humanos | Growth Core 007 (solo lectura) |
| `buildAdminTenantBranding` | Shell V2 |
| Tokens `--growth-os-*`, `--gray-*`, `--admin-shadow-card` | existentes |
| Composición de métricas (icono + número + label, sin tendencia) | familia visual UX-SHELL-003B |

No se creó un design system nuevo. El shell claro de la maqueta es **prototipo**; no reemplaza `AdminSidebar` / `admin-shell-v2.css`.

## Entrega (base 001)

| Archivo | Rol |
| --- | --- |
| [`admin-actual.png`](./admin-actual.png) | `/admin` actual (sidebar azul) |
| [`admin-master-data.png`](./admin-master-data.png) | Maqueta base con datos (histórica; norma = 001A) |
| [`admin-master-empty.png`](./admin-master-empty.png) | Maqueta base vacía (histórica; norma = 001A) |
| [`admin-master-compare.png`](./admin-master-compare.png) | Comparativa lado a lado |

```bash
# con npm run dev en marcha (preferir Espacio ADL)
npx tsx --env-file=.env scripts/capture-growth-ux-admin-master-001.ts
```

Ruta de maqueta (solo desarrollo):

- Con datos: `/dev-preview/admin-master`
- Vacío: `/dev-preview/admin-master?empty=1`

El vacío **no muta Mongo**: fuerza ceros en la proyección.

## Criterios

- [x] Maqueta desktop completa (shell + Inicio)
- [x] Vista con datos de Growth Core
- [x] Vista con 0 / pocos registros, todavía útil
- [x] Comparativa vs `/admin` actual
- [x] Componentes existentes reutilizados (tabla arriba)
- [x] Sin tendencias / ingresos / gráficos / IA inventados
- [x] Sin tocar Core, APIs, `/platform` ni `/admin` productivo
- [x] **Validación visual humana** — aprobada 2026-09-05

## Restricciones

- No más microajustes de esta maqueta salvo OT futura explícita
- No sustituir `/admin` productivo ni el sidebar azul actual salvo OT futura explícita
- No eliminar rutas legacy
- No abrir módulos de Crecer / Ventas / Mensajes

## Veredicto

**CERRADA · APTO VISUAL** — composición de Inicio del Espacio congelada como patrón maestro (métricas + Qué hacer ahora + Oportunidades + Actividad + orígenes). Norma visual: [001A](../OT-GROWTH-UX-ADMIN-MASTER-001A/README.md). Datos reales; sin tendencias inventadas; Growth OS = producto; Espacio = nombre / logo / acento. La maqueta no sustituye `/admin` productivo. Sin más microajustes salvo OT futura explícita.
