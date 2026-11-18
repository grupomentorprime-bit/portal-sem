# Congreso de Varones — Control de caja

**Fecha:** 2026-11-17  
**Estado:** implementado (2026-11-17); verificación navegador pendiente de sesión admin  
**Alcance explícitamente fuera:** apertura/cierre de turno, arqueo físico, export Excel, API nueva de agregados, commit/PR de git, despliegue, formulario público

## Objetivo

Separar el **Control de caja** como pestaña operativa propia: recaudación por medio (efectivo / transferencia / otro), cierre esperado vs cobrado, estadísticas por día / zona / iglesia, y listado de movimientos con anulación — sin mezclarlo con pago grupal ni con el resumen general.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Ubicación | Pestaña propia **Control de caja** (`caja`) |
| Aportes y pagos | Solo pago grupal; se quita la sección Caja de ahí |
| Resumen | Teaser corto de finanzas + CTA a la pestaña Caja; sin bloque largo de alimentación/aportes |
| Enfoque técnico | Extender motor puro en cliente (`cash-box.ts`); sin API dedicada |
| Recaudado por medio | Indicador principal siempre visible: efectivo, transferencia, otro, sin clasificar, total |
| Estadísticas | Esperado / cobrado / saldo + conteos por estado + desglose por día de pago, zona e iglesia |
| Pagos nuevos | Individual en ficha; grupal en Aportes; Caja no registra pagos |
| Sesión de caja | No (sin apertura/cierre/arqueo) |
| Totales “recaudado” | Solo movimientos `status === "posted"` |
| Datos | Reutilizar `GET /payments`, inscripciones cargadas y permisos existentes |

## 1. Navegación y separación

Tabs del panel (orden sugerido):

`recepcion` · `resumen` · `aportes` · `caja` · `alojamiento` · `reportes` · `historial` · `importacion`

- **Aportes y pagos:** únicamente formulario de pago grupal (iglesia, pagador, monto, medio, fecha, selección, preview, guardar). Copy de mixto iglesia = dos movimientos permanece aquí.
- **Control de caja:** única casa de totales por medio, cierre, desgloses, listado filtrable y anulación.
- **Resumen:** reemplazar el bloque detallado “Alimentación y aportes” por un teaser, por ejemplo:
  - Cargo esperado · Cobrado imputado · Saldo pendiente (3 cifras)
  - Botón/link **Ver control de caja** que cambia `activeTab` a `caja`
- Recepción, ficha, alojamiento, reportes, historial e importación: sin cambio de intención salvo el cableado de tab.

## 2. Pantalla Control de caja

### Cabecera — recaudado por medio

Siempre visible, calculado sobre el set de movimientos **después de filtros**, sumando solo `posted`:

| Medio | Fuente |
|-------|--------|
| Efectivo | `method === "cash"` |
| Transferencia | `method === "transfer"` |
| Otro | `method === "other"` |
| Sin clasificar | método ausente/legacy |
| **Total** | suma de los anteriores |

Filtros (mismos semánticos que la Caja actual):

- Tipo (todos / efectivo / transferencia / otro / sin clasificar)
- Desde / Hasta (`paidOn`, `YYYY-MM-DD`, vía `effectivePaidOn`)
- Estado (vigentes / anulados / todos); default **vigentes**

### Cierre operativo (inscripciones)

Universo: **todas** las inscripciones cargadas del evento (no el filtro de movimientos).

| Métrica | Definición |
|---------|------------|
| Cargo esperado | Σ `chargeAmountClp` donde no es `null` |
| Cobrado imputado | Σ `allocatedPaidClp` |
| Saldo pendiente | Σ `remainingBalanceClp(reg)` sobre fichas con `chargeAmountClp != null` |
| Conteos | `deriveContributionStatus`: pendiente / abono (`partial`) / pagado / pendiente verificación / sin cargo |

No inventar estados fuera de `finance-status.ts`. Saldo 0 + `needsReview` ≠ Pagado.

### Desgloses

1. **Por día de pago** (`effectivePaidOn`): total posted por día + conteo de movimientos posted; orden por `paidOn` ascendente.
2. **Por zona** (`zoneId`, label UI `formatZoneLabel`): esperado / cobrado / saldo (desde inscripciones); orden por `zoneId`.
3. **Por iglesia** (`churchName`): mismo trio; orden por **saldo descendente**.

### Movimientos

- Listado de pagos filtrados: fecha · medio · pagador · monto · estado.
- Anular: solo si `capabilities.financeCorrect`; motivo obligatorio ≥ 5 caracteres; `POST /api/congress/payments/[id]/void`; tras éxito refrescar pagos, inscripciones y summary.
- Sin crear pagos desde esta vista.

## 3. Dominio y componentes

### Extensiones de `src/core/congress/cash-box.ts`

Conservar `normalizePaymentMethod` y `summarizeCashBox`.

Añadir funciones puras (nombres orientativos):

- `summarizeContributionClose(registrations)` → `{ expectedClp, collectedClp, remainingClp, countsByStatus }`
- `breakdownPaymentsByPaidOn(payments, filters?)` → filas `{ paidOn, totalClp, count }` (solo posted en totales)
- `breakdownContributionsByZone(registrations)` / `ByChurch(registrations)` → `{ key, label?, expectedClp, collectedClp, remainingClp, count }`

Reutilizar `deriveContributionStatus`, `remainingBalanceClp` / charges, `effectivePaidOn`.

### UI

```
src/components/admin/congress/cash/CashBoxView.tsx
```

Props mínimas: `payments`, `registrations`, filtros controlados o internos, `canVoid`, callbacks `onVoid`, loading/error opcionales.

`CongressOpsPanel`:

- `TabId` incluye `"caja"`
- Al activar `caja` (y opcionalmente al entrar a aportes), `loadPayments`
- Extraer UI de Caja actual hacia `CashBoxView`; Aportes queda sin esa sección
- `SummaryView`: sustituir bloque largo de aportes por teaser + prop `onOpenCashBox` → `setActiveTab("caja")`
- Cargar pagos al activar tab `caja` (mantener carga al abrir `aportes` para el grupal)

## 4. Permisos y errores

- Sin capacidad de ver/listar pagos: empty/error claro; no mostrar totales inventados.
- Anulación: permiso `financeCorrect` + motivo; UI deshabilita mientras anula.
- Loading y error de red al cargar pagos.
- Idempotencia/validación de void en servidor (sin cambios de contrato previstos).

## 5. Verificación

Tests (`tests/baseline/congress-cash-box.test.ts`):

- Totales por medio respetan filtros y excluyen voided del “recaudado”
- Cierre: esperado / cobrado / saldo / conteos alineados a `deriveContributionStatus`
- Desglose por día, zona e iglesia

Navegador (admin / `congress_operator`):

1. Pestaña Control de caja visible y usable
2. Aportes sin sección Caja
3. Teaser en Resumen navega a Caja
4. Recaudado efectivo / transferencia / otro / total coherente con movimientos vigentes
5. Anulación (si aplica) refresca números
6. Desgloses zona/iglesia/día visibles

## 6. Fuera de alcance

- Apertura/cierre de turno, fondo de caja, arqueo, diferencia de efectivo
- Export CSV/Excel / impresión de cierre
- API `/api/congress/cash-box` o engordar `GET /summary` con estos agregados
- Ranking de “mayores deudas” como bloque dedicado (el orden por saldo en iglesias basta)
- Commit/PR, despliegue, formulario público

## Criterios de éxito

1. Caja y pago grupal viven en pestañas distintas, sin UI mezclada.
2. Se ve de un vistazo cuánto se recaudó en efectivo, transferencia y otros.
3. Cierre + desgloses día/zona/iglesia disponibles sin API nueva.
4. Resumen no duplica el detalle financiero.
5. Tests de dominio y verificación en navegador de lo realmente probado.
