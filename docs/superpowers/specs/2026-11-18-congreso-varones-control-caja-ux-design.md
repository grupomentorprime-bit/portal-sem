# Congreso de Varones — Control de caja (rediseño UX)

**Fecha:** 2026-11-18  
**Estado:** autorizado para implementación (2026-11-18)  
**Base:** `2026-11-17-congreso-varones-control-caja-design.md` (funcionalidad ya implementada)  
**Alcance:** solo presentación / layout de `CashBoxView`. Sin APIs, sin cambios de dominio, sin arqueo/export.

## Objetivo

Hacer **Control de caja** más intuitivo, práctico y legible en operación: jerarquía clara (cuánto falta → recaudado → zona→iglesia → movimientos), sin paneles vacíos que desperdicien espacio, manteniendo las mismas reglas y datos.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Enfoque | Escritorio de cobro (reordenar + densificar UI) |
| Prioridad de uso | Toda la pestaña más clara (cierre, medios, drill zona/iglesia, movimientos) |
| Por día de pago | Oculto si no hay filas; si hay, franja compacta de chips (no columna igual a zonas) |
| Cards decorativas | No; superficies del kit admin |
| Gráficos | No |
| Datos / motor | Sin cambios a `cash-box.ts` ni permisos |

## 1. Orden de pantalla (arriba → abajo)

1. **Cierre operativo** (héroe)
2. **Recaudado por medio** (filtros + totales)
3. **Por día de pago** (condicional)
4. **Cobranza por zona** (dos columnas: zonas \| iglesias)
5. **Movimientos**

Archivo único a tocar de UI: `src/components/admin/congress/cash/CashBoxView.tsx` (helpers de presentación locales OK; sin nueva API).

## 2. Cierre operativo

- Una sola superficie con tres métricas: Cargo esperado · Cobrado imputado · **Saldo pendiente** (saldo con mayor peso tipográfico).
- Debajo: chips de conteo — Pendiente / Abono / Pagado / Verificación / Sin cargo — mismos valores de `summarizeContributionClose` / `countsByStatus`.
- Copy: universo completo de inscripciones (no filtros de movimientos).

## 3. Recaudado por medio

- Filtros (Tipo, Desde, Hasta, Estado) en una fila alineada al ancho de los totales.
- Totales: Efectivo, Transferencia, Otro, Sin clasificar, **Total** (Total destacado).
- Descripción corta: según filtros · solo posted en totales (comportamiento actual de `summarizeCashBox`).

## 4. Por día de pago

- Si `breakdownPaymentsByPaidOn` está vacío → **no renderizar** la sección.
- Si hay datos → franja horizontal de chips/ítems (fecha + monto); scroll horizontal si hace falta.
- No ocupar una columna del grid zona/iglesia.

## 5. Cobranza por zona (bloque principal)

### Zonas (izquierda)

Fila compacta clicable (no mini-card alta):

- Título con `formatZoneLabel` + badge **Falta pagar** / **Al día** (contraste suficiente: ámbar/esmeralda con texto oscuro).
- Una línea: Esperado · Cobrado · Saldo (saldo enfatizado si `remainingClp > 0`).
- Conteo de personas como texto secundario.
- Activa: fondo violeta suave + anillo/borde (patrón actual, más claro).
- Toggle: misma zona otra vez → deseleccionar.

### Iglesias (derecha)

- Cabecera: `Iglesias · {zona}` + `{n} con saldo · {m} iglesias`.
- Misma densidad de fila; iglesias con saldo: fondo ámbar muy suave.
- Orden: saldo descendente (mantener comportamiento de dominio / listado actual).
- Sin zona: empty corto “Elige una zona” (sin caja enorme).
- Zona sin iglesias: “Sin iglesias en esta zona”.

## 6. Movimientos

- Filas en columnas legibles: fecha · medio · pagador · monto · estado (no un solo string concatenado).
- Anular a la derecha si `posted` + `canVoid`.
- Motivo de anulación arriba, compacto (`max-w` razonable).
- Empty: “Sin pagos” compacto.

## 7. Look & constraints

- Kit admin existente: fondo neutro, superficies blancas, violeta en selección/CTA.
- Mejor tipografía jerárquica y contraste de badges; sin tema nuevo ni gráficos.
- Responsive: en móvil, cierre y recaudado apilados; zona e iglesias apiladas (zonas arriba).

## 8. Fuera de alcance

- Cambios a `cash-box.ts`, APIs, permisos
- Apertura/cierre de turno, arqueo, export
- Registrar pagos desde Caja
- Rediseño de otras pestañas del panel

## Criterios de éxito

1. Al abrir Caja, lo primero que se lee es el cierre (esperado / cobrado / saldo) y los chips de estado.
2. Sin movimientos → no hay hueco grande de “Por día de pago”; zona|iglesia usan el ancho.
3. Drill zona → iglesia usable con filas densas y badges legibles.
4. Movimientos escaneables por columna.
5. Mismos totales y conteos que antes (solo cambia presentación).
