# Congreso de Varones — Fecha y hora de ingreso del formulario

**Fecha:** 2026-11-18  
**Estado:** aprobado en chat (tabla + ficha; hora del envío; incluye quienes ya ingresaron)  
**Alcance:** listado de Recepción y ficha del participante; cobertura de envíos ya existentes  
**Fuera de alcance:** campo persistido en la inscripción, formulario público, otras pestañas, commit/despliegue

## Objetivo

En Recepción, mostrar cuándo la persona envió el formulario público: alta nueva o actualización de una ficha que ya existía. Esa hora no es la llegada en puerta ni un cambio posterior de pago o alojamiento.

**Incluye a quienes ya ingresaron:** no solo envíos futuros. Quien ya tiene `submissionId` (o lo enlaza el sync al cargar el listado) muestra la hora original del envío.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Fuente | `createdAt` de `experience_form_submissions`, vía `submissionId` |
| Dónde se adjunta | Solo en la respuesta de `GET /api/congress/registrations`, como `formSubmittedAt` |
| Persistencia | No. No se escribe en la inscripción |
| Quiénes ya enviaron | Cubiertos al listar: se lee la hora histórica del envío; no hace falta migración de campo |
| Sync previo | Mantener `syncCongressFormSubmissions` al cargar el listado, para enlazar envíos pendientes por RUT / submission |
| `updatedAt` de la inscripción | No se usa. Cambia con llegada, pago y alojamiento |
| Zona horaria | `America/Santiago`, con `formatDateTimeSantiago` |
| Pantallas | Columna en la tabla de Recepción y la misma línea en la ficha |

## Dato

Al armar el listado:

1. Corre el sync existente (enlaza envíos del formulario a fichas sin `submissionId` cuando corresponde).
2. Una sola consulta trae los envíos cuyos `_id` están en los `submissionId` de las filas (incluidos los envíos antiguos).

| Caso | `formSubmittedAt` |
|------|-------------------|
| Hay `submissionId` y el envío existe | `createdAt` del envío (ISO), aunque el envío sea de días atrás |
| No hay `submissionId`, o el envío no existe | `null` |

La ficha lee la misma inscripción del listado. No hace falta otro endpoint ni backfill de un campo nuevo.

## Etiqueta

| Condición | Etiqueta |
|-----------|----------|
| `source === "form"` y hay hora | **Formulario** |
| Hay hora y `source` no es `form` (nómina actualizada, o puerta que luego enlazó un envío) | **Actualización** |
| `formSubmittedAt == null` | Sin etiqueta de origen |

## UI

**Tabla (escritorio).** Columna **Formulario**, entre Alojamiento y Acción.

- Con hora: primera línea la fecha y hora; segunda línea **Formulario** o **Actualización**.
- Sin hora: **—**.

**Lista móvil.** Bajo el nombre, una línea: `Formulario · {fecha y hora}`, `Actualización · {fecha y hora}`, o **Sin formulario**.

**Ficha.** Bajo el nombre.

- Con hora: `Formulario · {fecha y hora}` o `Actualización · {fecha y hora}`.
- Sin hora: **Sin formulario**.

Quien sigue solo en la importación, o se dio de alta en puerta y nunca envió el formulario, queda sin hora. Marcar llegada, registrar un pago o cambiar el alojamiento no cambia el texto.

## Verificación

- Alta por formulario (nueva): hora del envío y etiqueta **Formulario** en tabla y ficha.
- Nómina que ya envió el formulario (antes de este cambio): misma hora histórica del envío y etiqueta **Actualización**.
- Importación o puerta sin envío: **—** en la tabla y **Sin formulario** en la ficha.
- Después de registrar llegada, la hora del formulario sigue igual.
