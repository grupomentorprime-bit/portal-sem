# Congreso de Varones — Comprobante PDF de ingreso

**Fecha:** 2026-11-18  
**Estado:** aprobado para implementación (2026-11-18)  
**Alcance explícitamente fuera:** boleta/factura SII, envío por correo, firma digital, almacenamiento permanente del PDF, despliegue, commit/PR de git (salvo acuerdo posterior)

## Objetivo

Tras registrar un pago (individual o grupal) en la recaudación del Congreso, emitir un **comprobante de ingreso en PDF** con folio correlativo, detalle completo de la imputación y el logo del Departamento de Varones. El mismo PDF debe poder **re-descargarse** después desde Aportes / ficha.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Alcance de disparo | Pago grupal **y** pago individual |
| Re-descarga | Sí, desde listado de aportes y desde ficha cuando hay pago asociado |
| Portada | Sin página aparte: logo + título en el **encabezado de la misma hoja** |
| UX al guardar | Toast de éxito + botón **Descargar comprobante** (sin descarga forzada) |
| Folio | Correlativo `CV-2026-#####` asignado al crear el pago |
| Generación | Cliente con **jsPDF** (patrón AE); regeneración on-demand; sin archivo en storage |
| Logo | `/branding/ipn-chile/varones-nacional.png` |
| Anulados | Descarga permitida con sello **ANULADO** |

## 1. Contenido del PDF

Una o más páginas según el número de imputaciones. Sin portada separada.

### Encabezado
- Logo Departamento de Varones
- Título: **Comprobante de ingreso**
- Subtítulo: **Congreso Nacional de Varones 2026**

### Datos del movimiento
- Folio: `CV-2026-#####`
- Fecha de pago (`paidOn`, display local)
- Tipo / medio: Efectivo · Transferencia · Otro
- Pagador (`payerName`)
- Iglesia / zona cuando aplique (`churchName` + zona legible derivada de las inscripciones cubiertas si está disponible; si no, solo iglesia)
- Monto total (`amountClp`) formateado CLP
- Referencia opcional (`receiptRef`) si existe

### Detalle
Tabla de distribución: participante (nombre) + monto imputado por cada `allocation`.  
- Individual: una fila.  
- Grupal: N filas.

### Pie
- Nota: comprobante operativo de recaudación del Departamento de Varones (no es boleta ni factura SII).
- Fecha/hora de emisión del PDF en `America/Santiago`.
- Si `status === "voided"`: marca visible **ANULADO** (y motivo de anulación si existe).

### Nombre de archivo
`comprobante-ingreso-CV-2026-#####.pdf`

## 2. Folio (servidor)

### Reglas
1. Al crear un pago (`POST /api/congress/payments`), el servidor asigna `folio` **único e inmutable** antes de persistir.
2. Formato: `CV-{year}-` + secuencia numérica de 5 dígitos con ceros a la izquierda (ej. `CV-2026-00042`). El `{year}` es el año del evento Congreso 2026 (constante de dominio del evento, no el año calendario del servidor).
3. Secuencia por **tenant + eventId** (contador atómico / documento de secuencia en Mongo).
4. Si falla la asignación de folio → el POST falla entero (no crear pago sin folio).
5. Anular un pago **no** libera ni reutiliza el folio.
6. Pagos legacy sin `folio`: antes de generar el PDF, la UI llama un endpoint idempotente `POST /api/congress/payments/[id]/ensure-folio` que asigna el siguiente número **una sola vez** y lo persiste. Si falla, toast de error y no se descarga.

Campo nuevo en `CongressPayment`:

```ts
folio?: string | null; // CV-2026-#####; requerido en pagos nuevos
```

`receiptRef` sigue siendo referencia libre del operador (n° de transferencia, etc.); **no** reemplaza el folio.

## 3. Generación PDF (cliente)

- Módulo dedicado (p. ej. `src/lib/congress/download-payment-receipt-pdf.ts`) inspirado en el reporte PDF de Asuntos Estudiantiles (`jsPDF`).
- Entrada: pago + mapa `registrationId → nombre` + ruta del logo.
- No se persiste el archivo; cada descarga regenera el PDF desde los datos actuales del pago.
- Si el logo no carga: generar PDF igual sin logo (no bloquear la descarga).

## 4. UX

### Tras guardar (individual o grupal)
1. Toast de éxito (“Pago registrado” / “Pago grupal registrado”).
2. CTA **Descargar comprobante** visible tras el éxito: si el sistema de toasts del admin soporta acción, va en el toast; si no, un botón temporal junto al formulario / ficha mientras el último pago exitoso esté en memoria. La descarga ocurre solo con clic del operador (sin `doc.save` automático sin gesto).
3. El folio y el pago completo vienen en la respuesta del `POST`. Nombres de participantes: resolver desde el estado local de inscripciones ya cargadas (`registrationId → fullName`); si falta alguno, usar “Participante” + id corto como fallback (sin bloquear).

### Re-descarga
- **Aportes:** acción “Comprobante” por cada pago (posted y voided).
- **Ficha participante:** listar pagos del estado `payments` cuya `allocations` incluye el `registrationId` de la ficha; ofrecer “Comprobante” por cada uno. No se exige un `paymentId` embebido en la inscripción.
- Pagos voided: misma acción, PDF con sello ANULADO.

## 5. APIs / dominio

- Extender creación de pago para emitir folio.
- Respuesta de `POST /payments` incluye `folio` (y el pago completo).
- `GET /payments` / ítems existentes exponen `folio`.
- `POST /api/congress/payments/[id]/ensure-folio`: solo para legacy sin folio; idempotente (si ya tiene folio → 200 con el mismo).

Sin cambios de catálogo de permisos: quien puede registrar/ver pagos puede descargar el comprobante.

## 6. Estructura de componentes / archivos

```
src/core/congress/types.ts              # folio en CongressPayment
src/core/congress/payment-folio.ts      # formato + next folio (puro / helpers)
src/lib/congress/repository.ts          # secuencia + persistencia al crear
src/app/api/congress/payments/route.ts  # asignar folio en POST
src/lib/congress/download-payment-receipt-pdf.ts
src/components/admin/congress/…         # CTA toast, botón en aportes/ficha
```

## 7. Verificación

- Pago individual → toast + descarga con folio y una fila.
- Pago grupal → detalle por persona y total correctos.
- Re-descarga desde Aportes = mismo folio.
- Anulado → PDF con ANULADO.
- Logo del Departamento de Varones visible en encabezado.
- Fallo de secuencia → no queda pago huérfano sin folio.

## 8. Fuera de alcance

Boleta SII · correo del comprobante · firma digital · storage del PDF · import Excel · formulario público.

## Criterios de éxito

1. Todo pago nuevo (individual/grupal) tiene folio `CV-2026-#####`.
2. Tras guardar, el operador puede descargar el PDF con un clic (sin descarga forzada ciega).
3. El PDF muestra logo, folio, datos del pago y distribución completa.
4. Se puede re-descargar el mismo folio desde Aportes (y ficha cuando aplique).
5. Pagos anulados descargan con marca ANULADO.
