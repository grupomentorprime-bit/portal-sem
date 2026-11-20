# Congreso de Varones — Recepción y panel operativo (rediseño UX)

**Fecha:** 2026-11-17  
**Estado:** autorizado para implementación (2026-11-17); enmiendas 2026-11-18: exento de pago + drill-down iglesia → pago grupal. Enmienda 2026-11-20: la ficha de recepción pasa a tres pasos con distintivo de etapa (`2026-11-20-congreso-ficha-guiada-design.md`); el §3 de esta spec queda sustituido en la navegación de la ficha.  
**Alcance explícitamente fuera:** importación definitiva (commit Excel), despliegue, commit/PR de git

## Objetivo

Convertir el panel operativo del Congreso Nacional de Varones 2026 en una herramienta de **recepción en puerta**: jornada explícita, búsqueda rápida, alta modal, ficha lateral y acciones independientes (llegada ≠ pago ≠ alojamiento), reutilizando APIs, permisos y modelos existentes con extensiones mínimas de dominio.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Enfoque | Refactor modular del panel (no monolito in-place; no heurísticas sin modelo) |
| Hora de llegada | Primera hora de llegada inmutable ante reintentos; reloj del servidor; display `America/Santiago`; corrección/limpieza con motivo + historial |
| Necesidad de alojamiento | `lodgingNeed`: `unknown` \| `none` \| `requested`; UI distingue sin asignar / asignado / confirmado; sin estados contradictorios |
| Pestañas | Recepción (inicio); sin pestaña Asistencia; mantener Resumen, Aportes, Alojamiento, Reportes, Historial, Importación |
| Días previstos | `expectedDays`; presentación: sábado / domingo / ambos / por confirmar; independientes de asistencia |
| Confirmación de llegada | Por día (sábado y domingo independientes); unos llegan solo sábado, otros solo domingo, o ambos |
| Copy asistencia | No presente ese día → **Sin llegada** (no “Ausente”); acción tabla con día explícito: `Registrar llegada · Sáb/Dom` o `Llegó · Sáb/Dom · HH:MM` |
| Indicadores del día | Sobre **todo** el evento; contador de resultados filtrados aparte |
| Finanzas UI | Derivadas del motor existente; saldo 0 ≠ “Pagado” automático |
| Aporte $17.000 | Único por persona y cubre ambos días; independiente del día de llegada |
| Exento de pago | Operador (`congress.operate`) quita cargo con motivo + `chargeHistory`; no queda por cobrar; bloquear si hay imputaciones; revertible con motivo |
| Pagos | Individual desde ficha; grupal solo en Aportes |
| Drill-down caja → aportes | Clic en iglesia (Cierre operativo) abre Pago grupal con zona + iglesia cargadas y marcados quienes tienen saldo |
| Idempotencia | Servidor como fuente de verdad; botones deshabilitados solo complementan |
| Entrada | `/admin/portal/congreso-varones` como home del panel |

## 1. Navegación y shell

- **Ruta principal:** `/admin/portal/congreso-varones` renderiza el panel (deja de ser solo redirect).
- **Menú:** un único ítem activo “Congreso de Varones” con `href` a esa ruta; `matchPrefixes` incluyen alias de Formularios → Operación del form id.
- **Formularios → Operación:** acceso al mismo panel (redirect o mismo componente). Sin segunda implementación.
- **`congress_operator`:** shell acotado; rutas permitidas priorizan `/admin/portal/congreso-varones` (+ help/profile/notifications).
- **Encabezado visible:** “Congreso de Varones 2026”; subtítulo “Quilicura · 21 y 22 de noviembre”. Sin copy interno tipo “desde Formularios → Operación”.
- **Tabs:** `recepcion` (default) · `resumen` · `aportes` · `alojamiento` · `reportes` · `historial` · `importacion`.

Actualizar `CONGRESS_VARONES_HOME_PATH` a `/admin/portal/congreso-varones`; forms/panel queda como alias.

## 2. Recepción (pantalla de trabajo)

### Cabecera operativa

- Selector de jornada: **Sábado 21** / **Domingo 22** (solo UI; no marca asistencia).
- **Indicadores generales del día** (siempre sobre el universo completo del evento, **sin** búsqueda, filtros rápidos ni paginación):
  - **Previstas:** `expectedDays[día] === true`.
  - **Presentes:** `attendance[día] === true`.
  - **Pendientes de llegada:** previstos del día con `attendance[día] !== true`.
- Aparte: **“N resultados”** del listado filtrado actual + **Limpiar filtros**.
- Buscador (nombre / RUT / teléfono) con debounce.
- CTA: **Nuevo participante**.

No marcar asistencia al cambiar jornada ni al crear una persona.

### Filtros

- Zona → iglesia dependiente.
- Rápidos: **Todos** · **Sin llegada hoy** · **Con saldo** · **Alojamiento pendiente**.
- Conservar búsqueda, jornada y filtros tras operaciones; refrescar datos.

Definiciones:

- **Sin llegada hoy:** jornada seleccionada, `attendance[día] !== true`.
- **Con saldo:** estado financiero ∈ { pendiente, abono, pendiente_verificacion } (ver §5 finanzas); no usar solo `remainingBalanceClp === 0`.
- **Alojamiento pendiente:** cualquiera de los estados aún sin resolver (ver § alojamiento). El chip/filtro puede mostrar o agrupar por **motivo**:
  - desconocido (`unknown`)
  - solicitado sin asignar
  - asignado sin confirmar  
  No incluye `none` ni `confirmed`.

### Días previstos (presentación)

Función de etiqueta a partir de `expectedDays` (independiente de asistencia):

| saturday | sunday | Etiqueta |
|----------|--------|----------|
| true | false | Sábado |
| false | true | Domingo |
| true | true | Ambos |
| null/false mix que no sea un día claro, o ambos null/false | | Por confirmar |

Regla concreta:

- ambos `true` → **Ambos**
- solo sábado `true` → **Sábado**
- solo domingo `true` → **Domingo**
- en cualquier otro caso → **Por confirmar**

En tabla, columnas Sábado/Domingo muestran **asistencia efectiva** (texto + indicador + hora si aplica). Los días previstos se ven en ficha y, si cabe, como dato secundario — nunca como si fueran llegada.

Etiquetas de asistencia efectiva:

| Estado | Texto UI |
|--------|----------|
| `attendance[día] === true` | **Presente** (+ hora `America/Santiago` si hay `markedAt`) |
| cualquier otro (`false` / `null`) | **Sin llegada** |

No usar “Ausente” ni “Sin marcar” en recepción/tabla. En ficha, el botón de corrección que setea `present: false` puede seguir llamándose “Ausente” (acción), pero el estado mostrado es **Sin llegada**.

### Tabla (desktop)

Columnas: Participante · Iglesia / zona · Sábado · Domingo · Alimentación · Alojamiento · Acción

- Nombre destacado; teléfono secundario. RUT/correo/origen solo en ficha.
- Zona UI: “Zona 7”, nunca `zona-7`.
- Asistencia: texto + indicador según tabla de etiquetas. Acción ligada a la **jornada seleccionada**:
  - si aún no presente ese día → botón **Registrar llegada · Sáb** o **· Dom**;
  - si ya llegó → texto **Llegó · Sáb · HH:MM** (o Dom); sin re-marcar desde la tabla (correcciones en ficha / revertir con motivo).
- Alimentación: etiqueta del § finanzas.
- Alojamiento: etiqueta del § alojamiento (cinco estados separados).
- Acción independiente de pago/alojamiento.

### Móvil

Nombre, estados principales y acceso a ficha; no comprimir la tabla completa.

## 3. Ficha lateral

Drawer del kit admin. Encabezado: nombre, iglesia, zona.

1. **Asistencia** — previstos (sábado/domingo/ambos/por confirmar + edición); marcas reales + primera hora; correcciones con **motivo obligatorio**; historial previo visible.
2. **Alimentación** — estado derivado del motor; saldo; verificación; historial de imputaciones; **Registrar pago individual** (un participante = allocation única) reutilizando `POST /api/congress/payments`; **Marcar exento de pago** / **Restaurar aporte** con motivo (ver §5 cargo).
3. **Alojamiento** — `lodgingNeed` + asignación; acciones asignar / confirmar / cancelar / reasignar; el servidor rechaza contradicciones.

Registrar llegada solo muta asistencia (y meta/historial). No pago ni alojamiento.

## 4. Modal Nuevo participante

Reemplaza el formulario permanente.

1. Buscar coincidencias antes de crear; si hay match, abrir ficha existente.
2. Nombre obligatorio; RUT opcional con validación Chile si hay valor.
3. Zona por nombre legible → `zoneId`; iglesia filtrada por zona.
4. Iglesia faltante: “Otra / no listada” + `churchName` libre; sin IDs inventados ni duplicar fichas.
5. Teléfono/correo según reglas puerta existentes.
6. Días previstos (UI: sábado / domingo / ambos / por confirmar → `expectedDays`).
7. Alojamiento default `unknown`. Nunca default `none`.
8. Guardar → API puerta → abrir ficha; conservar filtros/jornada.

Protección anti-duplicado y anti-doble submit: **servidor primero**; UI deshabilita botones como complemento.

## 5. Modelo y APIs

### Extensiones de inscripción

```ts
expectedDays: { saturday: boolean | null; sunday: boolean | null };

lodgingNeed: "unknown" | "none" | "requested";

attendanceMeta: {
  saturdayMarkedAt?: string | null; // primera llegada; no se sobrescribe
  sundayMarkedAt?: string | null;
};

attendanceHistory: Array<{
  day: "saturday" | "sunday";
  previousPresent: boolean | null;
  nextPresent: boolean | null;
  previousMarkedAt: string | null;
  reason: string | null; // obligatorio en corrección/limpieza; null en primera marca
  at: string;            // ISO servidor
  actorUserId: string;
}>;

chargeHistory: Array<{
  action: "exempt" | "restore";
  previousChargeAmountClp: number | null;
  nextChargeAmountClp: number | null;
  reason: string; // obligatorio, no vacío
  at: string;     // ISO servidor
  actorUserId: string;
}>;
```

Legacy: sin `lodgingNeed` → `unknown`; sin `expectedDays` → ambos `null` (+ parseo seguro de `expectedDayLabel` si aplica); sin `chargeHistory` → `[]`.

### Asistencia — `PATCH .../attendance`

Body: `{ day, present, reason? }`.

Reglas de servidor (hora = `new Date().toISOString()` en el handler):

1. Si `present === true` y ya era `true` con `markedAt`: **idempotente** — conservar primera hora; no duplicar historial de “nueva llegada”; 200 OK.
2. Si `present === true` y no estaba presente: setear asistencia, setear `markedAt` (primera vez), append historial con `reason: null`.
3. Si `present === false | null` (corregir/limpiar) **o** se cambia un presente existente a otro valor no-idempotente: exigir `reason` no vacío; append historial con valores previos; actualizar `attendance`; al limpiar/ausentar, **no borrar** el historial; `markedAt` del día se limpia en meta operativa pero el historial conserva `previousMarkedAt`.
4. Concurrencia por `version`.
5. Duplicados de operación: responder conflicto/idempotencia en servidor; no confiar solo en UI.

Display: formatear `markedAt` con timezone `America/Santiago`.

### Alojamiento — estados UI y reglas

Estados **separados** (función pura con `lodgingNeed` + asignación activa más reciente):

| Estado UI | Condición |
|-----------|-----------|
| Por confirmar | `lodgingNeed === "unknown"` |
| No requiere | `lodgingNeed === "none"` (y sin asignación activa) |
| Sin asignar | `lodgingNeed === "requested"` y sin asignación activa |
| Asignado | asignación activa `status === "assigned"` (o confirmed=false según modelo actual) |
| Confirmado | asignación activa confirmada |

Filtro **Alojamiento pendiente** = Por confirmar ∪ Sin asignar ∪ Asignado (sin confirmar). Cada fila/chip puede exponer `pendingReason`: `unknown` | `unassigned` | `unconfirmed`.

**Invariantes de servidor:**

- No permitir `lodgingNeed === "none"` si existe asignación activa (assigned/confirmed).
- Asignar cama implica `lodgingNeed` pasa a `requested` si estaba `unknown` (o rechazar si era `none`).
- Cancelar asignación no fuerza `none`; vuelve a “Sin asignar” si `requested`.

### Finanzas — estados derivados (sin motor nuevo)

Función pura sobre `chargeAmountClp`, `allocatedPaidClp`, `needsReview` (y `remainingBalanceClp`). Para etiqueta UI se consulta además `chargeHistory`:

| Estado | Condición | Etiqueta UI (ej.) |
|--------|-----------|-------------------|
| `no_charge` | `chargeAmountClp == null` | **Exento** si hay al menos un `chargeHistory.action === "exempt"` (y el cargo sigue null); si no → **Sin cargo** |
| `needs_verification` | `needsReview === true` (con cargo) | Pendiente de verificación |
| `pending` | cargo, `allocatedPaidClp === 0`, no review | Pendiente $17.000 |
| `partial` | cargo, `0 < allocated < charge`, no review | Abono · saldo $… |
| `paid` | cargo, saldo 0, **y** `needsReview === false` | Pagado |

**No** mapear “saldo 0” → Pagado si `needsReview` es true (sigue `needs_verification`).  
**No** inventar estados de motor fuera de este derivador; **Exento** es solo etiqueta UI sobre `no_charge` + historial.  
Filtro **Con saldo** / “por cobrar”: no incluye `no_charge` (ni Exento ni Sin cargo).  
Summary / caja: `chargeAmountClp == null` no suma aporte esperado (comportamiento actual).

### Cargo — exención y restauración — `PATCH .../charge`

Body: `{ action: "exempt" | "restore"; reason: string }`.  
Permiso: `congress.operate` (sin permiso nuevo). Reloj y actor en servidor.

Reglas de dominio (`applyChargeChange` o equivalente):

1. `reason` no vacío siempre (exentar y restaurar).
2. **`exempt`:** si `allocatedPaidClp > 0` → rechazar (400: anular imputaciones primero). Si `chargeAmountClp == null` ya → idempotente (200; no duplicar historial). Si tiene cargo → `chargeAmountClp = null`, append `chargeHistory` con `action: "exempt"`.
3. **`restore`:** solo si `chargeAmountClp == null` **y** existe al menos un `chargeHistory.action === "exempt"` (no restaurar filas “Sin cargo” sin exención previa); setea `CONGRESS_CONTRIBUTION_CLP`; append `action: "restore"`. Si ya tiene cargo o no hay exención previa → 400.
4. Concurrencia por `version`. Audit: `registration.charge.exempt` / `registration.charge.restore`.

**UI ficha (Alimentación):**

- Con cargo y `allocatedPaidClp === 0`: **Marcar exento de pago** → motivo → PATCH `exempt`.
- Exento: badge **Exento**; sin formulario de pago; **Restaurar aporte $17.000** → motivo → `restore`.
- Con imputado > 0: no ofrecer exentar (deshabilitado / tip: anular pagos primero).
- Mostrar historial de cargo (acción, motivo, hora `America/Santiago`).

Alta puerta: sin cambio (cargo $17.000); la exención es post-alta. No chip de filtro rápido nuevo.

### Puerta — `POST .../door`

Acepta `expectedDays`, `lodgingNeed` (default `unknown`). Deduplicación en servidor (RUT / provisional). Respuesta con inscripción completa.

### Listado y resumen

- `GET /registrations`: `q`/`zone`/`church` en servidor; filtros rápidos en cliente sobre el set cargado **no** alimentan los indicadores generales.
- Indicadores generales del día: desde `GET /summary` (universo completo) o agregado servidor dedicado; **nunca** recalcular solo sobre la lista filtrada.
- Contador “N resultados” = longitud del array tras filtros de UI.

### Pagos

- **Ficha:** pago individual → mismo `POST /payments` con una allocation; no ofrecer pago si `chargeAmountClp == null`.
- **Aportes:** flujo grupal con iglesia, multi-selección, preview de distribución, un solo movimiento; no incluir exentos como “por cobrar” en selección habitual (el motor ya rechaza `no_charge`).
- Anulación: `congress.finance.correct`.
- Anti doble post: servidor (idempotencia/validación); UI deshabilita mientras `saving`.

### Permisos

Sin cambios de catálogo (`operate` alcanza para exentar/restaurar cargo).

## 6. Aportes grupales

Sin cambios de intención respecto al diseño previo: pestaña propia, pagador ≠ cubiertos, preview, un POST, saldos reflejados en Recepción.

### Seleccionables en pago grupal

`isGroupPaymentSelectable`: persona con **saldo de cargo > 0** (`remainingBalanceClp > 0`, implica cargo no null). Incluye `pending`, `partial` y `needs_verification` con deuda. Excluye `paid`, `no_charge` / Exento.  
(Amplía la regla previa que solo admitía `pending`, para alinear con “Falta pagar” de Cierre operativo.)

### Drill-down desde Cierre operativo (caja)

En la lista **Iglesias · Zona X** (tras elegir una zona):

1. Clic en una fila de iglesia → cambiar a pestaña **Aportes y pagos** (Pago grupal).
2. Precargar `groupZone` = zona seleccionada; `groupChurch` = iglesia del renglón (misma clave/`baseKey` que el select de Aportes).
3. Precargar `groupSelected` = todos los candidatos de esa zona+iglesia que `isGroupPaymentSelectable` (tienen saldo). Si no hay ninguno: zona+iglesia igual cargadas; selección vacía.
4. **No** precargar pagador, tipo ni fecha (defaults actuales del formulario).
5. Monto total = N × $17.000 como hoy.
6. Zona en la columna izquierda sigue solo filtrando iglesias (no navega a aportes).
7. UX: filas de iglesia clickeables (cursor/affordance); tras navegar, scroll al bloque de pago grupal si hace falta.

Callback tipico: `CashBoxView` → `onOpenGroupPayment({ zoneId, churchBaseKey })` → panel setea tab `aportes` + estado del formulario.

## 7. Diseño visual

Fondo neutro, superficies blancas, separadores suaves, violeta en CTA/selección; sin tarjetas decorativas en Recepción; kit `Drawer`/`Dialog`/`AdminDataTable`.

## 8. Estructura de componentes

```
src/components/admin/congress/
  CongressOpsPanel.tsx
  reception/ReceptionView.tsx | ReceptionTable.tsx | ReceptionFilters.tsx
  participant/ParticipantSheet.tsx | NewParticipantDialog.tsx
  labels.ts | finance-status.ts (o en core)
  payments/ …  lodging/ …  cash/CashBoxView.tsx  # clic iglesia → onOpenGroupPayment
src/core/congress/
  attendance.ts          # applyAttendanceChange + historial + primera hora
  lodging-status.ts      # resolveLodgingUiState + pending reasons
  finance-status.ts      # deriveContributionStatus + etiqueta Exento
  charge.ts              # applyChargeChange (exempt / restore)
  expected-days.ts       # labelExpectedDays
src/app/api/congress/registrations/[id]/charge/route.ts
```

## 9. Verificación

Admin + `congress_operator` en navegador:

- Navegación unificada
- Indicadores globales vs contador filtrado
- Alta, llegada (primera hora estable ante reintento), corrección con motivo + historial
- Pago individual (ficha) y grupal (Aportes)
- Exento: marcar con motivo → no aparece en “Con saldo”; restaurar con motivo; rechazo si hay imputado
- Caja → clic iglesia con saldo: Aportes con zona/iglesia y deudores marcados
- Alojamiento: cuatro pendientes distinguibles + rechazo de “No requiere” con asignación
- Persistencia al recargar; loading/errores; capturas de casos reales

## 10. Fuera de alcance

Import commit Excel · despliegue · commit/PR · formulario público · Growth/AE.

## Criterios de éxito

1. Home única en `/admin/portal/congreso-varones`.
2. Recepción operable sin formulario permanente ni pestaña Asistencia.
3. Llegada / pago / alojamiento independientes, con reglas de servidor anteriores.
4. Estados de comida y alojamiento derivados, sin contradicciones.
5. Indicadores del día globales; resultados filtrados etiquetados aparte.
6. Operador puede exentar aporte (motivo + historial) y la persona deja de quedar por cobrar; restauración con motivo.
7. Desde Cierre operativo, clic en iglesia abre pago grupal precargado (zona, iglesia, quienes deben).
8. Verificación en navegador con capturas de lo realmente probado.
