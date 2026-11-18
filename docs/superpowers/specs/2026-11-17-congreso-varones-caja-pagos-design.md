# Congreso de Varones — Caja y tipo de pago

**Fecha:** 2026-11-17  
**Estado:** pendiente de review del usuario  
**Spec base:** `docs/superpowers/specs/2026-11-17-congreso-varones-recepcion-design.md`  
**Alcance explícitamente fuera:** cierre/arqueo formal, editar tipo/fecha tras guardar, formulario público, import Excel, despliegue, commit/PR

## Objetivo

Registrar cada aporte con **tipo de medio** (efectivo / transferencia / otro) y **fecha de pago** editable, y exponer en Aportes un **control de caja** con filtros y totales diferenciados por tipo — reutilizando el motor de pagos e imputaciones existente.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Enfoque | Extender `CongressPayment` (un método por movimiento); sin ledger paralelo ni multi-tender en un documento |
| Medios | `cash` \| `transfer` \| `other` — obligatorio al registrar nuevos pagos |
| Fecha de pago | `paidOn` = día calendario (`YYYY-MM-DD`, zona `America/Santiago`); default hoy; editable (antes o después); distinta de `createdAt` |
| Referencia / nota | Opcionales (como hoy) |
| Mixto efectivo + transferencia | Solo flujo **grupal (iglesia)**; se opera como **dos movimientos** (un tipo cada uno). Individual = un tipo por registro |
| Caja UI | Pestaña Aportes: listado + filtros tipo/fecha/estado + totales por tipo |
| Legacy | Pagos sin `method` → UI/totales **Sin clasificar** (`unclassified`); no inferir efectivo |
| Anulación | Igual que hoy; movimientos `voided` no suman en caja |
| Post-guardar | No editar `method`/`paidOn`; corregir = anular + volver a registrar |
| Permisos | Sin cambios de catálogo (`congress.payments` / anulación existente) |

## 1. Modelo

Extender `CongressPayment`:

```ts
method?: "cash" | "transfer" | "other"; // obligatorio en altas nuevas; ausente = legacy
paidOn?: string; // YYYY-MM-DD; obligatorio en altas nuevas; ausente = legacy
```

- `createdAt`: timestamp ISO de cuándo se cargó en el sistema (servidor).
- `paidOn`: día operativo del pago (caja y filtros). Altas nuevas siempre lo persisten.
- Legacy sin `paidOn`: para filtros de fecha usar el día de `createdAt` en `America/Santiago` (solo lectura; no backfill automático en DB).
- Un pago = un `method`. Mixto iglesia = dos documentos `CongressPayment` (misma lógica de allocations que hoy).

Helper de dominio (puro):

```ts
type CashMethodKey = "cash" | "transfer" | "other" | "unclassified";

function normalizePaymentMethod(method: CongressPayment["method"] | undefined): CashMethodKey;

function summarizeCashBox(
  payments: CongressPayment[],
  filters: { method?: CashMethodKey | "all"; fromPaidOn?: string; toPaidOn?: string; status?: "posted" | "voided" | "all" }
): {
  rows: CongressPayment[];
  totalsClp: Record<CashMethodKey, number> & { total: number }; // solo posted tras filtro de status
};
```

Reglas de totales:

- Por defecto caja muestra solo `status === "posted"`.
- Suma `amountClp` (monto del movimiento), no solo lo imputado.
- `unclassified` = `method` ausente/null.
- Anulados: visibles si el filtro de estado lo pide; **nunca** entran en `totalsClp`.

## 2. API

### `POST /api/congress/payments`

Body adicional:

- `method`: `"cash" | "transfer" | "other"` — **requerido** (400 si falta o inválido).
- `paidOn?: string` — `YYYY-MM-DD`. Si se omite, servidor calcula **hoy** en `America/Santiago`. Si viene inválido → 400.

Resto del contrato (pagador, monto, allocations, receiptRef, note) sin cambios de intención.

### `GET /api/congress/payments`

Sigue devolviendo la lista; los clientes filtran/agregan en UI con `summarizeCashBox` (universo del evento ya es manejable). No hace falta endpoint nuevo de caja en este alcance.

### Anulación

Sin cambios de contrato; el pago anulado conserva `method`/`paidOn` para historial.

## 3. UI

### Ficha — pago individual

Campos añadidos al form actual:

- **Tipo** (select obligatorio): Efectivo / Transferencia / Otro
- **Fecha de pago** (date, default hoy Chile)

Referencia y nota opcionales. Un submit → un `POST` con una allocation.

### Aportes — pago grupal

Mismos campos Tipo + Fecha. Para mixto (parte efectivo + parte transferencia): el operador registra **dos** pagos grupales (o dos envíos seguidos), cada uno con su tipo y monto; la distribución/preview existente aplica por envío.

### Aportes — Caja

Sobre el listado de movimientos:

| Control | Comportamiento |
|---------|----------------|
| Filtro tipo | Todos / Efectivo / Transferencia / Otro / Sin clasificar |
| Filtro fechas | Desde–hasta sobre `paidOn` |
| Filtro estado | Vigentes / Anulados / Todos |
| Totales | Efectivo · Transferencia · Otro · Sin clasificar · Total (solo vigentes del filtro actual) |
| Fila | `paidOn`, tipo, pagador, monto, imputaciones, estado; anular si permiso |

Copy corto bajo totales: mixto iglesia = dos movimientos.

## 4. Integración con recepción

- Estados de alimentación (`deriveContributionStatus`) **no cambian**: siguen derivados de cargo / imputado / `needsReview`.
- El tipo de medio no altera “Pendiente / Abono / Pagado”; solo alimenta caja e historial del movimiento.
- En historial de imputaciones de la ficha, si se muestra el pago, incluir tipo + `paidOn` cuando existan.

## 5. Verificación

- Pago individual con cada tipo + fecha distinta de hoy; recarga conserva datos.
- Pago grupal doble (efectivo + transferencia) sobre mismos/distintos participantes; saldos coherentes.
- Caja: filtros tipo/fecha/estado; totales solo `posted`; legacy sin método en Sin clasificar.
- Anular un movimiento lo saca de totales y revierte imputaciones como hoy.
- Rechazo API sin `method` o con `paidOn` inválido.

## 6. Fuera de alcance

- Cierre de caja / arqueo / diferencia vs esperado
- Edición in-place de `method` o `paidOn` tras `posted`
- Multi-tender en un solo documento de pago
- Endpoint dedicado de reporte Excel de caja
- Formulario público, import commit, deploy, git commit/PR

## Criterios de éxito

1. Todo pago nuevo exige tipo; tiene `paidOn` usable en filtros.
2. Caja en Aportes muestra totales diferenciados por tipo según filtros.
3. Mixto grupal operable como dos movimientos sin romper imputaciones.
4. Legacy y anulados tratados según reglas anteriores.
5. Verificación en navegador de los flujos de §5.
