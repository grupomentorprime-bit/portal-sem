# Congreso de Varones — Ficha guiada de recepción

**Fecha:** 2026-11-20  
**Estado:** aprobado en conversación (2026-11-20)  
**Alcance:** ficha del participante y distintivo de etapa en el listado de Recepción  
**Fuera de alcance:** APIs, modelo de pagos, modelo de alojamiento, pantalla de Pago grupal, filtros nuevos, commit/PR  
**Enmienda:** sustituye la navegación libre de la ficha descrita en §3 de `2026-11-17-congreso-varones-recepcion-design.md`. El resto de esa spec sigue vigente.

## Objetivo

En puerta, con una fila de unas 30 personas, la ficha se recorre en tres pasos y no se da por terminada hasta cerrarlos. Arriba, un distintivo dice en qué etapa va ese hermano. Si el líder ya pagó el grupo, alimentación aparece lista y bloqueada.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Pantalla | La ficha actual (`ParticipantSheet`), no una pantalla nueva |
| Pasos | Asistencia → Alimentación → Alojamiento |
| Salir de la fila | Solo con los tres pasos listos. La X cierra el diálogo y no cambia la etapa |
| Distintivo | Fijo, bajo el nombre, fuera del scroll. El mismo texto en cada fila del listado |
| Etapa | Derivada en cliente. Sin campo nuevo en la base |
| Día de la jornada | El selector de Recepción (sábado o domingo). La llegada de ese día se exige solo si el caso incluye hoy |
| Datos que bloquean | Nombre, teléfono chileno, zona e iglesia. RUT y correo no bloquean |
| Pago del líder | `payerType === "church"`, pago `posted`, imputación a esta ficha, y estado `paid` → paso bloqueado |
| Alojamiento listo | `No requiere`, o cama activa (`assigned` o `confirmed`) |
| Navegación | Se puede volver a un paso ya listo. No se puede abrir un paso futuro |
| Permisos | El distintivo se ve siempre. Las acciones siguen exigiendo `operate` / `canPay` como hoy |

## 1. Etapa

Función pura, compartida por la ficha y el listado. Entradas: inscripción, pagos, asignaciones de cama y el día de jornada que Recepción ya tiene seleccionado. La ficha recibe ese día; no lo elige aparte.

Un paso futuro no se evalúa hasta que los anteriores estén listos. La etapa es el primer paso incompleto. Si los tres están listos, la etapa es **Listo**.

### Asistencia

Lista solo si se cumplen las tres condiciones:

1. **Caso de días** claro: solo sábado, solo domingo, o ambos (`expectedDays`). Cualquier otro valor, incluido por confirmar, deja el paso incompleto.
2. **Llegada de hoy**, solo si el caso incluye el día de jornada. Si el caso ya dice que hoy no viene, no se exige llegada de hoy.
3. **Datos mínimos:** nombre con texto, teléfono válido de Chile, zona e iglesia con texto. Un teléfono vacío o inválido no deja seguir.

Si faltan datos, el paso muestra solo los campos vacíos o inválidos y el guardado de esos datos. RUT, correo y los checkboxes de líder quedan debajo y no bloquean **Siguiente**.

### Alimentación

Usa `deriveContributionStatus`.

| Estado | Paso |
|--------|------|
| `paid` | Listo |
| `no_charge` (exento) | Listo |
| `pending`, `partial`, `needs_verification` | Incompleto |

**Bloqueado** cuando está `paid` y existe al menos un pago `posted` con `payerType === "church"` y una imputación con monto mayor a 0 para esta inscripción. El texto del paso es **Pagado por el líder**. No se muestra cobro individual, exención ni abono.

Si está `paid` solo con pagos individuales, el paso está **Listo** con texto **Pagado**. No lleva el bloqueo del líder.

Si está exento, el paso está **Listo** con texto **Exento**. Restaurar el aporte sigue disponible; al restaurarlo el paso vuelve a incompleto.

Un abono parcial, aunque venga de un pago de iglesia, no bloquea ni cierra el paso.

### Alojamiento

| Situación | Paso |
|-----------|------|
| `lodgingNeed === "none"` y sin asignación activa | Listo |
| Asignación activa (`assigned` o `confirmed`, la misma regla que `resolveRegistrationLodging`) | Listo |
| `unknown`, o `requested` sin cama activa | Incompleto |

## 2. Distintivo y pasos

Bajo el nombre, fuera del área con scroll:

- Distintivo grande con la etapa: **En asistencia**, **En alimentación**, **En alojamiento** o **Listo**.
- Debajo, tres pasos en chico. El de la etapa dice **Ahora**. Los anteriores dicen **Listo**, o **Bloqueado** en alimentación pagada por el líder. Los posteriores dicen **Pendiente**.

Al revisar un paso ya listo, el distintivo sigue mostrando la etapa real (el primer paso incompleto), no el paso que se está mirando. Con etapa **Listo**, ningún paso dice **Ahora**. Cada paso cerrado dice **Listo**, salvo alimentación pagada por el líder, que dice **Bloqueado**.

En el listado de Recepción, escritorio y móvil, el mismo texto del distintivo va bajo el nombre. Usa el día de jornada seleccionado.

## 3. Acciones de la ficha

El botón principal queda bajo el distintivo, no al final del formulario.

| Etapa | Botón | Cuándo avanza |
|-------|--------|----------------|
| Asistencia o Alimentación | **Siguiente** | El paso actual está listo |
| Alojamiento | **Listo, siguiente de la fila** | El paso está listo; cierra la ficha |

El botón principal está siempre visible en la etapa actual. Permanece deshabilitado mientras el paso está incompleto o hay un guardado en curso. En alojamiento el texto es **Listo, siguiente de la fila** también mientras espera. Si el guardado falla, la etapa no cambia y se mantiene el aviso que ya usa el panel.

En asistencia, el orden visible es: llegada del día de jornada, caso de días (sábado / domingo / ambos), y después los datos que falten. Corregir a ausente o sin marcar sigue disponible como acción secundaria y no es el botón principal.

En alimentación bloqueada, el contenido del paso es el aviso **Pagado por el líder** y el monto imputado. Sin formulario de pago.

En alojamiento incompleto se ofrecen **No requiere** y **Necesita cama**. Si necesita cama, se usa la asignación que ya existe en la ficha.

Quien no tiene `operate` ve el distintivo y el estado de cada paso, sin **Siguiente** ni acciones de cambio.

## 4. Errores y datos

No hay endpoint nuevo. Llegada, datos, pago, exención y cama siguen en sus PATCH y POST actuales.

La etapa se recalcula con la inscripción y los pagos ya cargados en el panel. Sin la lista de pagos, un `paid` se muestra **Listo · Pagado**; pasa a **Bloqueado** en cuanto el pago `church` está en memoria. Un pago grupal guardado en Aportes se refleja al refrescar inscripciones y pagos, sin un guardado extra en la ficha.

## 5. Pruebas

Pruebas de la función pura, sin UI:

- Por confirmar → En asistencia.
- Caso claro que incluye hoy, sin llegada → En asistencia.
- Caso que excluye hoy, sin llegada de hoy, datos mínimos ok, alimentación y cama pendientes → no se queda en asistencia.
- Falta teléfono, zona o iglesia → En asistencia aunque ya haya llegada.
- RUT y correo vacíos no bloquean.
- `pending`, `partial` y `needs_verification` → En alimentación.
- `paid` solo individual → alimentación lista, sin bloqueo de líder.
- `paid` con pago `church` posted imputado → alimentación bloqueada.
- Pago `church` con saldo restante → sigue En alimentación.
- Exento → alimentación lista.
- `unknown` y `requested` sin cama → En alojamiento.
- `none` y cama activa → alojamiento listo.
- Los tres listos → Listo.
