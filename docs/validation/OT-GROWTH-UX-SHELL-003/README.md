# OT-GROWTH-UX-SHELL-003 — Diseño profesional Platform Admin

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-SHELL-003 |
| Predecesora | OT-GROWTH-UX-SHELL-002 |
| Fecha | 2026-09-04 |
| Cierre 003B | 2026-09-05 |
| Criterio APTO | `/platform` reproduce la línea visual aprobada (sidebar, resumen, Espacios, ficha) con AEK/ui/tokens existentes, solo datos reales y sin inventar módulos ni métricas |
| Estado | **CERRADA · APTO VISUAL** |

## Objetivo

Llevar Platform Admin a la dirección visual de la maqueta Growth OS **sin** crear otro design system y **sin** tocar lógica, APIs, seguridad ni datos.

## Contrato

| Pieza | Decisión |
| --- | --- |
| Sistema | AEK, `components/ui`, tokens `--growth-os-*`, `PlatformNeutralTheme` |
| Sidebar | ~248px; Resumen / Espacios; bloque producto + Ir al Espacio |
| Topbar | Buscador a la izquierda; avatar + nombre + rol |
| Home | Hero + métricas reales + filas Espacios + CTA Crear Espacio |
| Ficha | Identidad compacta; Sitio/Dominio/Miembros; Entrar; IDs secundarios |

## Patrón maestro `/platform` (congelado · UX-SHELL-003B)

Composición de cabecera aprobada y congelada:

**saludo + transición gráfica + fotografía + métricas**

No más microajustes ni igualdad píxel a píxel con la maqueta. La referencia orienta; la captura aprobada es la norma.

### Reglas permanentes

| Regla | Decisión |
| --- | --- |
| Datos | Solo conteos / datos reales del catálogo |
| Tendencias | Sin porcentajes, “vs. mes anterior”, sparklines u otras tendencias inventadas |
| Identidad | Growth OS Master (`--growth-os-*` / `PlatformNeutralTheme`) independiente de los Espacios |
| Familia | Misma línea visual para futuras superficies de Platform Admin |

## UX-SHELL-003B — cierre

Validación humana final **aprobada** (2026-09-05). Revocación temporal del cierre visual limitada a hero + métricas + relación vertical; resto de 003 intacto.

| Entrega | Archivo |
| --- | --- |
| Captura `/platform` | [`platform-home-003b.png`](./platform-home-003b.png) |
| Cabecera (hero + métricas) | [`platform-header-003b.png`](./platform-header-003b.png) |
| Comparación lado a lado vs maqueta | [`platform-header-003b-compare.png`](./platform-header-003b-compare.png) |
| Maqueta de referencia (orientativa) | [`maqueta-hero-referencia.jpg`](./maqueta-hero-referencia.jpg) |

### Decisiones de datos (003B)

- Métricas: solo conteos reales del catálogo.
- **Sin** `+100%`, **sin** “vs. mes anterior”, **sin** sparklines inventadas.
- Sin hueco reservado a una tendencia inexistente: icono + valor + label redistribuidos en la card.

### Fuera de alcance 003B (confirmado)

- Espacios hacia abajo
- Sidebar, navegación, branding multi-tenant, tokens, APIs, seguridad, datos

## Evidencia

| Captura | Ruta | Rol |
| --- | --- | --- |
| [`platform-home-003b.png`](./platform-home-003b.png) | `/platform` | Home completa — patrón maestro aprobado |
| [`platform-header-003b.png`](./platform-header-003b.png) | cabecera | Hero + métricas congelados |
| [`platform-header-003b-compare.png`](./platform-header-003b-compare.png) | comparación | Evidencia de revisión humana |
| [`platform-home.png`](./platform-home.png) | `/platform` | Alias / espejo de home 003B |
| [`platform-space-adl.png`](./platform-space-adl.png) | `/platform/spaces/adl` | Ficha — no tocada en 003B |

## Criterios

- [x] Shell + home + ficha con datos reales
- [x] 003B: hero + transición + fotografía + métricas validados (dirección visual, no píxel a píxel)
- [x] Validación humana 003B

## Veredicto

**CERRADA · APTO VISUAL** — composición de `/platform` congelada como patrón maestro (saludo + transición gráfica + fotografía + métricas). Datos reales; sin tendencias inventadas; identidad Growth OS Master independiente de los Espacios; misma familia visual para Platform Admin. Sin más microajustes salvo OT futura explícita.

[OT-GROWTH-IDENTITY-MT-001](../OT-GROWTH-IDENTITY-MT-001/README.md) permanece **CERRADA · APTO**.
