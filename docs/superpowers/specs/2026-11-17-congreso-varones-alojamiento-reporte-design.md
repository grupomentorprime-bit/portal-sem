# Congreso de Varones — Reporte imprimible de alojamientos por hogar

**Fecha:** 2026-11-17  
**Estado:** autorizado para implementación (2026-11-17)  
**Alcance explícitamente fuera:** PDF generado en servidor, Excel/CSV de alojamiento, número de hogar persistido en BD, formulario público, commit/PR/despliegue

## Objetivo

Entregar desde la pestaña **Reportes** un documento **claro, ordenado y corporativo** de alojamientos, **separado por hogar**, con número de hogar asignado en el reporte, nombre del jefe de hogar y lista de huéspedes — listo para **Imprimir / Guardar PDF** desde el navegador.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Formato | Vista imprimible + `window.print()` (PDF vía diálogo del navegador) |
| Número de hogar | Automático en el reporte: 1, 2, 3… ordenando hogares por nombre |
| Jefe de hogar | Campo existente `contactName` (etiqueta UI “Contacto”); si vacío → “Sin registrar” |
| Lista interna | Una fila por persona; columna de noche(s): vie 20 / sáb 21 / ambos |
| Inclusión | Asignaciones `assigned` + `confirmed`; excluir `cancelled` |
| Datos de huésped | Nombre, iglesia/zona, teléfono, noche(s) |
| Notas de cuidado | En encabezado del bloque del hogar (`home.notes`), no por persona |
| Hogares vacíos | No aparecen en el reporte |
| Datos | Solo cliente: `homes` + `assignments` + `registrations` ya cargados; sin API nueva |
| CSV actual | Se mantiene el export de inscritos |

## 1. Entrada (pestaña Reportes)

- Conservar **Descargar CSV de inscritos**.
- Agregar CTA **Reporte de alojamientos** que reemplaza el contenido de Reportes por la vista imprimible (con enlace/botón **Volver** a las exportaciones).
- En esa vista: botón **Imprimir / Guardar PDF** → `window.print()`.
- Cabecera del documento:
  - Título: `Congreso de Varones 2026 · Alojamiento`
  - Subtítulo: `Quilicura · 21 y 22 de noviembre`
  - Pie/meta: fecha-hora de generación (timezone `America/Santiago`)

## 2. Contenido por hogar

Orden: hogares con ≥1 huésped activo, por `name` ascendente; número correlativo 1…N solo en este documento.

**Encabezado del bloque**

- `Hogar N° {n} · {home.name}`
- Jefe de hogar: `contactName` o “Sin registrar”
- Dirección: `address` si existe
- Notas / cuidados: `notes` si existe
- Resumen: cantidad de personas distintas + conteo de camas por noche (ej. `4 personas · vie 2 / sáb 3`)

**Tabla de huéspedes**

| Columna | Fuente |
|---------|--------|
| # | Índice 1…k dentro del hogar (alfabético por nombre) |
| Nombre | `registration.identity.fullName` |
| Iglesia / zona | `churchName` + zona legible (`Zona 02`) |
| Teléfono | `identity.phone` o “—” |
| Noche(s) | Derivado de asignaciones activas de esa persona en ese hogar |

Etiquetas de noche:

| Asignaciones activas en el hogar (`CongressNight`) | Etiqueta |
|-----------------------------------------------------|----------|
| solo `2026-11-20` | Viernes 20 |
| solo `2026-11-21` | Sábado 21 |
| ambas | Ambos (vie 20 y sáb 21) |

Sin RUT, email, finanzas ni estado “asignado/confirmado” en el documento (es para anfitriones).

## 3. Armado de datos (función pura)

Módulo de dominio/UI, p. ej. `buildLodgingHomesReport({ homes, assignments, registrations })`:

1. Considerar solo assignments con `status` ∈ {`assigned`, `confirmed`} (y no canceladas).
2. Agrupar por `homeId`.
3. Dentro de cada hogar, agrupar por `registrationId` y unir noches.
4. Resolver persona desde `registrations`; omitir filas huérfanas sin registro.
5. Ordenar personas por nombre; hogares por nombre; asignar `homeNumber`.
6. Descartar hogares sin personas.

Tests unitarios sobre esta función (casos: ambas noches → una fila; cancelada excluida; hogar vacío omitido; numeración estable por nombre).

## 4. Componentes UI

```
src/components/admin/congress/reports/
  ReportsView.tsx           # CSV + CTA reporte alojamiento
  LodgingPrintReport.tsx    # documento + print CSS + botón imprimir
src/core/congress/
  lodging-homes-report.ts   # buildLodgingHomesReport (+ tipos del DTO)
```

- Integrar `ReportsView` en el `TabsContent value="reportes"` de `CongressOpsPanel` (reemplazar el `Section` mínimo actual).
- Estilos `@media print`: ocultar shell admin, tabs, botones; tipografía sobria; bloques con separación; `break-inside: avoid` en encabezado+tabla cuando quepa; salto entre hogares si es necesario.
- Aspecto: corporativo / neutro (encabezados claros, tablas con líneas suaves); sin cromo del panel operativo en la impresión.

## 5. Permisos y errores

- Misma capacidad de ver el panel (`congress.view` / operate ya usados); no nuevo permiso.
- Si no hay hogares con asignaciones: empty state “Sin asignaciones de alojamiento para reportar” y botón imprimir deshabilitado o oculto.

## 6. Fuera de alcance

- Campo persistido `houseNumber` / edición de número
- Campo nuevo “Jefe de hogar” distinto de `contactName`
- PDF server-side o librería PDF
- Export Excel/CSV de alojamiento
- Incluir hogares sin huéspedes
- Cambios al flujo de asignación o al formulario público

## Criterios de éxito

1. Desde Reportes se abre un documento agrupado por hogar con N°, jefe, dirección/notas y lista de huéspedes.
2. Una persona con dos noches en el mismo hogar aparece **una sola vez** con “Ambos…”.
3. Canceladas no aparecen; hogares vacíos no aparecen.
4. Imprimir / Guardar PDF del navegador produce una salida legible sin UI del admin.
5. Tests de `buildLodgingHomesReport` en verde.
