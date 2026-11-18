# Congreso de Varones — Pago grupal: selección y no duplicar imputados

**Fecha:** 2026-11-18  
**Estado:** implementado (selección); abonos/partida supersedidos por `2026-11-18-pago-grupal-recaudacion-partida-design.md`  
**Alcance:** UI de Pago grupal en Aportes; sin cambios de API/modelo  
**Fuera de alcance (histórico):** abonos en grupal — ver spec de recaudación partida

## Objetivo

En **Pago grupal**, permitir varios ingresos en el tiempo para la misma zona/iglesia hasta cubrir a todos, sin poder volver a seleccionar a quien ya tiene el aporte completo imputado (pago individual en ficha o grupal previo). Efectivo + transferencia = dos registros (uno por tipo).

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Abonos por persona en grupal | No: siempre monto completo `$17.000` por seleccionado |
| Varios ingresos grupales | Sí: un POST/registro por guardado; se puede repetir para quienes faltan |
| Ya pagado completo | Visible, checkbox deshabilitado, etiqueta **Pagado** |
| Origen del pago completo | Individual (ficha) o grupal previo → mismo tratamiento |
| Efectivo + transferencia | Dos pagos grupales (nota UI existente) |
| Motor / API | Sin cambios; el servidor ya rechaza imputar sobre saldo insuficiente |

## Reglas de selección

Lista sigue filtrada por zona + iglesia.

| Estado derivado (`deriveContributionStatus`) | En lista grupal |
|-----------------------------------------------|-----------------|
| `pending` | Seleccionable; imputa `CONGRESS_CONTRIBUTION_CLP` ($17.000) |
| `paid` | Visible; checkbox `disabled`; texto **Pagado** |
| `partial`, `needs_verification`, `no_charge` | Visible; no seleccionable (este flujo no hace abonos ni verifica) |

Seleccionable **solo** si el estado es `pending` (saldo = cargo completo). Así no se intenta un segundo $17.000 sobre alguien ya imputado ni sobre abonos legacy.

Al guardar: limpiar selección; al refrescar registros, los cubiertos pasan a `paid` y quedan bloqueados.

## UI y cálculo

- Fila: nombre (+ roles si aplica) · si no seleccionable, checkbox deshabilitado + etiqueta de estado (al menos **Pagado**).
- **Monto total:** solo seleccionados activos → `N × $17.000 = **$total**` (total en negrita).
- **Distribución prevista:** solo seleccionados; $17.000 c/u.
- Sin cambios de layout mayores; reutilizar labels existentes donde convenga (`contributionStatusLabel` / equivalente).

## Datos y flujo

1. Operador elige zona/iglesia → ve candidatos (incluidos pagados, no marcables).
2. Marca un subconjunto pendiente → monto = `N × 17000` → guarda → un `CongressPayment` con allocations de $17.000 c/u.
3. Más tarde marca otros pendientes de la misma iglesia → segundo ingreso.
4. Quien pagó solo en ficha individual ya aparece **Pagado** y no se puede marcar.

## Errores

- UI: no permitir check en no-`pending`.
- Servidor: mantener rechazo `allocation_exceeds_balance` / similares como red de seguridad.
- Mensajes existentes ante fallo de POST.

## Verificación

1. Marcar 3 pendientes, guardar → un ingreso; esos 3 quedan **Pagado** y no seleccionables.
2. Segundo ingreso con los que faltan en la misma iglesia → OK.
3. Pago individual en ficha → en grupal aparece **Pagado**, no seleccionable.
4. Efectivo + transferencia: dos guardados con distintos tipos.
5. No hay camino de abono parcial desde este formulario.

## Relación con specs previas

Complementa §6 Aportes grupales de `2026-11-17-congreso-varones-recepcion-design.md` sin alterar el motor financiero ni la regla de aporte único $17.000 por persona.
