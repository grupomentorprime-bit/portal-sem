# Congreso de Varones — Pago grupal: recaudación partida (efectivo + transferencia)

**Fecha:** 2026-11-18  
**Estado:** pendiente de revisión del usuario  
**Alcance:** UI de Pago grupal + helper puro de reparto; reutiliza `POST /api/congress/payments`  
**Fuera de alcance:** transacción atómica multi-pago en servidor, edición por persona del monto, import Excel, commit/PR salvo el de esta spec

## Objetivo

Permitir que un líder zonal (u otro pagador) entregue en un solo acto dinero en **efectivo y transferencia** por el mismo grupo de personas: el operador marca participantes, opcionalmente activa **Partir recaudación**, ingresa ambos montos y un **Guardar** registra hasta dos ingresos con imputación proporcional al saldo.

Por defecto, sin esa opción, el flujo actual no cambia.

## Relación con specs previas

- Complementa `2026-11-18-pago-grupal-seleccion-pagados-design.md`.
- **Anula** la decisión “sin abonos en grupal” de esa spec: con Partir recaudación (o un segundo ingreso sobre saldos) sí pueden quedar estados `partial` hasta completar.
- Mantiene: `paid` no seleccionable; varios ingresos en el tiempo; `isGroupPaymentSelectable` = saldo > 0.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Default | Sin “Partir recaudación”: un Tipo, monto = suma de saldos, un POST |
| Opción | Checkbox **Partir recaudación** → recuadro Recaudación (Efectivo + Transferencia) |
| Guardar partido | Un Guardar → hasta 2 POSTs (`cash` y `transfer`); tramo $0 no genera POST |
| Reparto | Proporcional al saldo pendiente de cada marcado; pesos enteros CLP |
| Residuo de redondeo | A quien tenga mayor saldo restante en ese tramo; desempate por `registrationId` estable |
| Tope | `efectivo + transferencia ≤ suma de saldos` de seleccionados; ambos ≥ 0; al menos uno > 0 |
| Tipo único | Oculto o ignorado mientras Partir está activo |
| API / modelo | Sin endpoints nuevos; mismo `POST /payments` |
| Fallo 2º POST | Mensaje claro; el 1º ya quedó; operador reintenta el tramo faltante |

## UX

1. Zona → iglesia → marcar personas (solo saldo > 0).
2. Monto calculado / preview de saldos (como hoy).
3. Checkbox **Partir recaudación** (off por defecto).
4. Si off: Select Tipo + Guardar → un pago, allocations = saldo completo c/u.
5. Si on: inputs **Efectivo (CLP)** y **Transferencia (CLP)**; preview por persona con columnas Efectivo / Transferencia / Total de este guardado; totales abajo.
6. Guardar → POSTs según tramos > 0; limpiar selección; refrescar listado (Pagado / Abono).

Nota UI: reemplazar o ampliar la nota actual de “dos pagos grupales” indicando que con Partir recaudación un solo Guardar genera ambos.

## Reparto (core)

```ts
distributeProportional(
  rows: Array<{ registrationId: string; balanceClp: number }>,
  amountClp: number
): Array<{ registrationId: string; amountClp: number }>
```

Reglas:

- Ignorar filas con `balanceClp <= 0`.
- Si `amountClp <= 0` → `[]`.
- Si `amountClp > sum(balances)` → error / rechazo (UI no debe llegar).
- Asignación floor proporcional; repartir residuo `amount - sum(floors)` de a 1 peso a filas ordenadas por (saldo restante tras floor desc, `registrationId` asc).
- Resultado: solo filas con `amountClp > 0`; suma exacta = `amountClp`.

Aplicar una vez al tramo efectivo y una vez al tramo transferencia (sobre los **mismos** saldos iniciales del guardado; no restar el primer tramo del segundo antes de calcular — ambos proporcionales al saldo previo al guardado). Así efectivo+transferencia suman el abono total por persona en este acto.

## Datos / errores

- Pagador, iglesia, fecha compartidos en ambos POSTs.
- Validación UI antes de POST; servidor sigue rechazando `allocation_exceeds_balance`.
- Si falla el segundo POST: toast con qué tramo quedó registrado y cuál faltó.

## Verificación

1. 5 pendientes, sin partir, Tipo efectivo → 1 ingreso; 5 Pagado.
2. 5 pendientes, Partir $42.500 + $42.500 → 2 ingresos; allocations suman $85.000; todos Pagado.
3. Partir solo efectivo $20.000 (transferencia 0) → 1 POST cash; estados Abono.
4. Segundo guardado (default o partir) completa saldos.
5. Persona Pagado: no seleccionable.
6. Tests unitarios de `distributeProportional` (iguales, desiguales, residuo, monto 0, tope).

## Criterios de éxito

1. Default intacto para operadores que no parten.
2. Caso líder zonal (mitad efectivo / mitad transferencia) en un Guardar.
3. Imputaciones enteras, sin sobrepasar saldos.
4. Caja/reportes ven dos movimientos por método cuando corresponde.
