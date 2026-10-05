# Cumple: editorial Protección de datos (Información)

Aplicar a `/materias/proteccion-datos` el mismo patrón editorial ya validado en Ley Karin, SST y Laboral: wordmark, héroe con batón + panel documental, conceptos, checklist, implica visual y pasos Cumple. Menú e H1 permanecen **Protección de datos**.

## Decisiones

- Alcance: contenido de la materia `proteccion-datos` + tests. Reutilizar tipos y bloques ya existentes en `MateriaPage` (`baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`). Sin página especial.
- Misma ruta `/materias/proteccion-datos`; menú Información y Soluciones sin cambio de href ni de label.
- **H1** = `Protección de datos` (opción 1 aprobada).
- Wordmark: `mark: ["DATOS"]`, `markTone: "ink"` (cajas sólidas + tipografía blanca, colores Cumple; ya presente en la ficha).
- Hechos jurídicos solo desde `norma.ts` / BCN (**Ley 19.628**). Sin describir una ley posterior ni una fecha de reemplazo. Sin montos de multa ni plazos inventados.
- Visual: mismos tokens Cumple y mismo acento de ficha bandera (gradiente lavanda + franja violeta cuando hay `baton` / `heroAside`). Sin clon portal estatal, sin fotos stock, sin glow/orbs.
- CTA canónico `/evaluar` (outline en héroe; sólido al final).
- Relacionado: laboral, cómo funciona, FAQ, evaluar (ajustar solo si hace falta).

## Orden de la página

1. Héroe — eyebrow `Información · Cumplimiento`; wordmark; H1 `Protección de datos`; batón; lead afinado; CTA outline; panel derecho.
2. **Conceptos** — grid de 3: datos personales, tratamiento, evidencia.
3. Qué exige el marco (copy existente afinado; citas BCN).
4. **Checklist** — evidencias típicas (mapa de datos, finalidad, responsables, registros/reglas).
5. Qué implica para la empresa (`implicaPoints`).
6. Cómo lo ordena Mentor Cumple (`processSteps`).
7. Disclaimer → Fuentes → Relacionado → CTA final.

## Contenido del héroe

**Batón (chips):**

- `Ley 19.628` (marco)
- Datos · Tratamiento · Evidencia (íconos del set Cumple)

**Panel `heroAside`:**

- Heading: `Lo esencial`
- Señal normativa: etiqueta tipo `Marco` / valor `Ley 19.628` (sin inventar “vigente desde” que la ficha no fije)
- `Qué debe asegurar la empresa`:
  - Datos — saber qué datos personales trata
  - Tratamiento — finalidad y quién administra
  - Evidencia — reglas internas y registros que demuestren el tratamiento
- Enlace: texto oficial de la Ley 19.628 en Ley Chile

## Conceptos (3)

| Título | Enfoque (ejecutivo, anclado a 19.628) |
|--------|--------------------------------------|
| Datos personales | Qué datos de personas recoge, almacena o usa la organización (p. ej. trabajadores, postulantes, clientes) |
| Tratamiento | El acto de tratar esos datos; finalidad y administración |
| Evidencia | Poder mostrar políticas/reglas y registros del tratamiento — sin inventar obligaciones no ancladas |

Íconos: trazos del set Cumple (p. ej. `folder`, `list`/`clipboard`, `check`), no engañosos.

## Modelo de datos

Sin ampliar tipos. Protección de datos rellena los opcionales que ya usan Karin, SST y Laboral:

- `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`

Inclusión y contratistas siguen omitiéndolos en este corte.

## Visual

Igual que Karin/SST/Laboral: conceptos en cards de lectura; checklist en banda `csand`; implica con numeración; processSteps numerados; héroe con acento si hay panel/batón; wordmark sólido existente.

## Fuera de alcance

- Cambiar el label del menú o el H1.
- Reescribir inclusión o contratistas al mismo nivel en este corte.
- Anticipar reforma o ley nueva no descrita en `norma.ts`.
- Sanciones, plazos o bases legales detalladas no ancladas en la ficha consultada.
- Blog, schema, sitemap.

## Criterio de éxito

En `/materias/proteccion-datos` el visitante ve H1 `Protección de datos`, wordmark, batón, panel, tres conceptos, checklist y el mismo ritmo visual que Karin/SST/Laboral, sin parecer landing de producto ni portal de gobierno. Las fichas ya editoriales no se degradan. Inclusión y contratistas siguen en el layout base.
