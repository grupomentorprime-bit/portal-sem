# OT-SEM-DASHBOARD-002 — Validación visual

## Alcance

Refinamiento del Dashboard `/admin`: hero compacto, storytelling vertical, KPIs con número dominante, accesos priorizados, panel de sistema al cierre.

Sin cambios en lógica, APIs, permisos ni consultas.

## Orden de lectura (storytelling)

1. Hero + estado general (badges)
2. Alertas compactas
3. KPIs (4 columnas → 2 tablet → 1 mobile)
4. Accesos rápidos (3 filas: primaria / secundaria / otros)
5. Actividad reciente
6. Estado del sistema + actividad numérica

## Rutas

- `/admin` — vista principal
- Breakpoints: ≥1280 desktop, 768–1279 tablet, &lt;768 mobile

## Checklist

- [ ] Hero ~35% más bajo que versión anterior
- [ ] KPI: número → etiqueta → meta
- [ ] Fila 1 accesos con borde azul izquierdo
- [ ] Panel sistema separado (estado vs actividad)
- [ ] Alertas compactas
- [ ] Sidebar con encabezado de marca
- [ ] TopBar con buscador compacto y perfil destacado

## Capturas

Guardar en `screenshots/`:

- `01-dashboard-desktop-after.png`
- `02-dashboard-tablet-after.png`
- `03-dashboard-mobile-after.png`

Comparar con `docs/validation/OT-SEM-VISUAL-001/screenshots/` (baseline pre-DASHBOARD-002).
