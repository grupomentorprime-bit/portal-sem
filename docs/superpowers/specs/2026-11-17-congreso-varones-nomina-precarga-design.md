# Congreso de Varones — Precarga de nómina y reclamo en formulario

**Fecha:** 2026-11-17  
**Estado:** aprobado (2026-11-17) — plan de implementación escrito  
**Enfoque acordado:** desbloquear import commit → fichas `source=import` incompletas + búsqueda/reclamo en el formulario público  
**Alcance explícitamente fuera:** pedidos/asignaciones de alojamiento desde Excel · merge automático de homónimos · despliegue · commit/PR de git

## Objetivo

Precargar los hermanos confirmados del Excel de nómina (nombre, zona, ILEU, días previstos), dejar las iglesias del registro disponibles en catálogo, y hacer que el formulario público primero **busque su nombre** (tolerante a tildes, formato y faltas de ortografía). Si aparece, reclama esa ficha y completa el resto; si no, se registra como nuevo.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Entrada principal | Formulario público: buscar → reclamar / o alta nueva |
| Alojamiento del Excel | **No** importar cantidades ni marcar `lodgingNeed`; el operador lo resuelve individual |
| Iglesias sin nominados | No crear personas; sí upsert en catálogo zona+ILEU |
| Prefill al reclamar | Zona, ILEU y días **prellenados y editables**; completar RUT/tel/correo/resto |
| Reenvío si ya completó | Bloquear con mensaje “ya estás inscrito” |
| Persistencia | Una sola ficha `congress_registrations`; no colección roster aparte |
| Búsqueda | Reutilizar `person-search` (fold + sugerencias fuzzy); resultados con iglesia/zona |

## 1. Modelo y precarga

### Stub de importación

Cada nominado del Excel → una `congress_registration`:

- `source: "import"`
- `importRowId` + `importBatchId` (idempotencia)
- `identity.fullName` (texto del Excel; se puede normalizar display quitando ruido de hoja, sin inventar nombres)
- `identity.status: "provisional"`
- `identity.rut` / `email` / `phone` = `null`
- `zoneId`, `churchName`
- `expectedDayLabel` + `expectedDays` (parseo existente)
- `lodgingNeed: "unknown"`
- `submissionId: null` → **reclamable**
- `attendance` vacío; sin marcas de llegada
- `chargeAmountClp` vía reglas actuales si hay nombre usable; `needsReview: true` hasta completar form

### Ya completó / no reclamable

Una ficha **no** es reclamable en el lookup público si:

- tiene `submissionId`, **o**
- ya está “cerrada” por identidad de form (p. ej. RUT verificado ligado a envío)

Esas fichas no aparecen en sugerencias públicas y rechazan un segundo claim.

### Catálogo de iglesias

Al commit, upsert de pares `zoneId + churchName` tomados de:

- nominados, y
- iglesias listadas sin nombre (gaps / filas de iglesia vacías del parser)

Consumidores: formulario (zona → iglesias) y alta puerta/panel. Se mantiene “Otra / no listada”.  
**No** crear `congress_lodging_church_requests` ni assignments desde este Excel.

### Reimport

Misma `importRowId` o mismo `zona + iglesia + nombre` ya importado → skip (plan actual). Nunca fusionar por nombre parecido en el commit.

## 2. Flujo del formulario público

1. **Buscar nombre** (debounce). API pública solo sobre fichas reclamables.
2. **Sugerencias** ordenadas por cercanía; cada ítem muestra nombre + iglesia + zona (desambiguar homónimos). Sin RUT/teléfono en la lista.
3. **Elige sugerencia** → el form guarda `registrationId`; prellena nombre, zona, ILEU, días (editables); completa el resto.
4. **Enviar (reclamo)** → actualizar **la misma** ficha: identidad, zona/iglesia/días, `submissionId`, `identity.status` a `verified` si RUT válido, `needsReview` según reglas vigentes. No crear segunda inscripción.
5. **No aparezco** → alta nueva `source=form` eligiendo zona/ILEU del catálogo (o “Otra”).

### Anti-duplicado al enviar

1. `registrationId` ya con `submissionId` → 409 “ya estás inscrito”.
2. RUT o correo ya en otra ficha completada → 409 (mensajes actuales).
3. Reclamo de stub cuyo RUT choca con otra ficha → conflicto explícito; no merge silencioso.

### Sync legacy

`syncCongressFormSubmissions` no debe crear un duplicado `source=form` cuando el submit ya reclamó por `registrationId`.

## 3. Búsqueda tolerante (requerimiento explícito)

La búsqueda del formulario debe:

- Aceptar cualquier escritura razonable: mayúsculas/minúsculas, tildes, espacios, guiones/apóstrofos, caracteres especiales.
- Devolver **coincidencias directas** y, si no hay match cerrado o como complemento, **sugerencias** aunque haya falta de ortografía o un token mal escrito.
- Seguir siendo usable con nombres parciales (una o más palabras).

**Implementación:** reutilizar `@/lib/experience/forms/person-search`:

- `matchesPersonSearch` → hits directos (fold, tokens, RUT si aplica).
- `personSearchSuggestionRank` / `collectPersonSearchSuggestions` → sugerencias fuzzy (p. ej. 1 edición en tokens largos).

La API/UI de lookup combina ambos conjuntos (directos primero, luego sugerencias), sin duplicar la misma ficha. Payload público: `registrationId` + nombre + iglesia + zona; sin RUT/teléfono/correo.

Reglas de producto:

- Mínimo 2 caracteres folded antes de buscar.
- Límite de resultados + indicador de “hay más” si aplica.
- Homónimos: el usuario **debe** elegir una fila concreta (iglesia/zona visibles).
- Nunca incluir fichas no reclamables.

## 4. Importación en el panel

Pestaña Importación:

1. Preview (existente).
2. Prepare-commit / plan (existente).
3. **Confirmar importación** (nuevo): escribe Mongo — stubs §1 + upsert catálogo; **sin** lodging requests del Excel; batch + auditoría `import.commit`.

Permiso: el guard de import actual (`congress.import` / `requireCongressImport`). Sin catálogo de permisos nuevo.

Los stubs aparecen en Recepción como previstos (zona/ILEU/días); llegada, pago y alojamiento siguen independientes y a cargo del operador.

## 5. APIs (superficie)

| Superficie | Rol |
|------------|-----|
| `POST /api/congress/import/commit` | Desbloquear escritura según plan; stubs + catálogo |
| `GET` (público) lookup nómina | Query `q` → sugerencias reclamables |
| Submit form congreso | Aceptar `registrationId` opcional → claim o alta nueva |
| Listado iglesias por zona | Catálogo para form/panel |

Detalle de paths/shapes exactos en el plan de implementación; este spec fija el comportamiento.

## 6. Errores e idempotencia

- Commit reintentable: lo ya creado queda en skips.
- Claim idempotente respecto al mismo envío / misma ficha.
- Lookup sin datos sensibles.
- Errores al usuario en lenguaje de inscripción (sin jerga técnica).

## 7. Verificación

- Preview + commit del Excel real → ~184 stubs + iglesias vacías en catálogo; 0 pedidos de alojamiento desde Excel.
- Form: buscar nominado con tilde / typo → sugerencia → prefill → enviar → misma ficha en panel.
- Form: no aparece → alta nueva con ILEU del catálogo.
- Reenvío / reclamar ficha completa → bloqueado.
- Reimport del mismo archivo → 0 altas nuevas.
- Recepción: stubs visibles; operador asigna alojamiento individual.

## Criterios de éxito

1. Nómina Excel convertida en fichas reclamables con zona/ILEU/días.
2. Formulario prioriza búsqueda con sugerencias tolerantes a ortografía/caracteres.
3. Reclamo actualiza la ficha importada; no duplica.
4. Alta nueva si no está en nómina.
5. Alojamiento del Excel no altera dominio de camas; lo hace el operador.
6. Catálogo incluye ILEUs del Excel aunque no tengan nominados.
