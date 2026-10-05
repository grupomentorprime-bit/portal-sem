# Cumple: editorial Inclusión laboral (Información)

Aplicar a `/materias/inclusion-laboral` el mismo patrón editorial ya validado en Karin, SST, Laboral y Protección de datos: wordmark, héroe con batón + panel documental, conceptos, checklist, implica visual y pasos Cumple. Menú e H1 permanecen **Inclusión laboral**.

## Decisiones

- Alcance: contenido de la materia `inclusion-laboral` + tests. Reutilizar tipos y bloques ya existentes en `MateriaPage` (`baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`). Sin página especial.
- Misma ruta `/materias/inclusion-laboral`; menú Información y Soluciones sin cambio de href ni de label.
- **H1** = `Inclusión laboral` (opción 1 aprobada).
- Wordmark: `mark: ["INCLUSIÓN"]`, `markTone: "sand"` (cajas sólidas + tipografía blanca, colores Cumple; ya presente en la ficha).
- Hechos jurídicos solo desde `norma.ts` / BCN (**Ley 21.015**, art. 157 bis). Sin detalle de cálculo anual ni sanciones inventadas.
- Visual: mismos tokens Cumple y mismo acento de ficha bandera. Sin clon portal estatal, sin fotos stock, sin glow/orbs.
- CTA canónico `/evaluar` (outline en héroe; sólido al final).
- Relacionado: laboral, cómo funciona, FAQ, evaluar (ajustar solo si hace falta).

## Orden de la página

1. Héroe — eyebrow `Información · Cumplimiento`; wordmark; H1 `Inclusión laboral`; batón; lead afinado; CTA outline; panel derecho.
2. **Conceptos** — grid de 3: umbral, cuota, evidencia.
3. Qué exige el marco (copy existente afinado; citas BCN).
4. **Checklist** — evidencias típicas (umbral, cuota, dotación, responsables).
5. Qué implica para la empresa (`implicaPoints`).
6. Cómo lo ordena Mentor Cumple (`processSteps`).
7. Disclaimer → Fuentes → Relacionado → CTA final.

## Contenido del héroe

**Batón (chips):**

- `Ley 21.015` (marco)
- Umbral · Cuota · Evidencia (íconos del set Cumple)

**Panel `heroAside`:**

- Heading: `Lo esencial`
- Señal normativa: etiqueta tipo `Marco` / valor `Ley 21.015`
- `Qué debe asegurar la empresa`:
  - Umbral — empresas de 100 o más trabajadores
  - Cuota — al menos el 1% en las condiciones del art. 157 bis
  - Evidencia — información de dotación que permita verificarlo
- Enlace: texto oficial de la Ley 21.015 en Ley Chile

## Conceptos (3)

| Título | Enfoque (ejecutivo, anclado a 21.015 / 157 bis) |
|--------|------------------------------------------------|
| Umbral | Empresas de 100 o más trabajadores |
| Cuota | Al menos el 1% de personas con discapacidad o asignatarias de pensión de invalidez respecto del total |
| Evidencia | Dotación ordenada y actualizada para verificar umbral y cuota — sin inventar el cálculo anual |

Íconos: trazos del set Cumple (p. ej. `users`, `chart`/`list`, `check`), no engañosos.

## Modelo de datos

Sin ampliar tipos. Inclusión rellena los opcionales que ya usan las fichas bandera:

- `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`

Contratistas sigue omitiéndolos en este corte.

## Visual

Igual que las fichas bandera: conceptos en cards de lectura; checklist en banda `csand`; implica con numeración; processSteps numerados; héroe con acento si hay panel/batón; wordmark sólido existente.

## Fuera de alcance

- Cambiar el label del menú o el H1.
- Reescribir contratistas al mismo nivel en este corte.
- Registro, medidas sustitutivas u otras figuras sin ancla en `norma.ts`.
- Cálculo anual detallado o montos de multa no incluidos en la ficha consultada.
- Blog, schema, sitemap.

## Criterio de éxito

En `/materias/inclusion-laboral` el visitante ve H1 `Inclusión laboral`, wordmark, batón, panel, tres conceptos, checklist y el mismo ritmo visual que las fichas bandera, sin parecer landing de producto ni portal de gobierno. Las fichas ya editoriales no se degradan. Contratistas sigue en el layout base.
