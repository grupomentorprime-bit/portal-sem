# Cumple: editorial Laboral y RR.HH. (Información)

Aplicar a `/materias/laboral-rrhh` el mismo patrón editorial ya validado en Ley Karin y SST: wordmark, héroe con batón + panel documental, conceptos, checklist, implica visual y pasos Cumple. Menú e H1 permanecen **Laboral y RR.HH.**

## Decisiones

- Alcance: contenido de la materia `laboral-rrhh` + tests. Reutilizar tipos y bloques ya existentes en `MateriaPage` (`baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`). Sin página especial.
- Misma ruta `/materias/laboral-rrhh`; menú Información y Soluciones sin cambio de href ni de label.
- **H1** = `Laboral y RR.HH.` (opción 1 aprobada). Sin renombrar a un H1 más estrecho (“Reglamento y jornada”).
- Wordmark: `mark: ["RR.HH."]`, `markTone: "hot"` (cajas sólidas + tipografía blanca, colores Cumple; ya presente en la ficha).
- Hechos jurídicos solo desde `norma.ts` / BCN (Código del Trabajo + Ley 21.561 vía art. 22 / nota marginal). Sin inventar tramos de gradualidad, umbrales distintos al art. 153, ni montos de multa.
- **Jornada en panel y copy:** afirmar el tope de jornada ordinaria (no excederá de cuarenta horas semanales) y remitir la aplicación gradual a la Ley 21.561 / texto oficial. No declarar qué tramo rige en una fecha concreta.
- Visual: mismos tokens Cumple y mismo acento de ficha bandera (gradiente lavanda + franja violeta cuando hay `baton` / `heroAside`). Sin clon portal estatal, sin fotos stock, sin glow/orbs.
- CTA canónico `/evaluar` (outline en héroe; sólido al final).
- Relacionado: Karin, inclusión laboral, cómo funciona, FAQ, evaluar (ajustar solo si hace falta para utilidad).

## Orden de la página (Laboral)

1. Héroe — eyebrow `Información · Cumplimiento`; wordmark; H1 `Laboral y RR.HH.`; batón; lead afinado; CTA outline; panel derecho.
2. **Conceptos** — grid de 3: reglamento interno, jornada, evidencia laboral.
3. Qué exige el marco (copy existente afinado; citas BCN).
4. **Checklist** — evidencias típicas (umbral 10+, reglamento coherente, jornada según tramo aplicable, responsables/registros).
5. Qué implica para la empresa (`implicaPoints`).
6. Cómo lo ordena Mentor Cumple (`processSteps`).
7. Disclaimer → Fuentes → Relacionado → CTA final.

## Contenido del héroe

**Batón (chips):**

- `Código del Trabajo` (marco)
- Reglamento · Jornada · Evidencia (íconos del set Cumple)

**Panel `heroAside`:**

- Heading: `Lo esencial`
- Señal normativa: etiqueta tipo `Marco` / valor orientado a Código del Trabajo + Ley 21.561 (sin inventar una “vigente desde” que las fichas no fijen para el bloque laboral completo)
- `Qué debe asegurar la empresa`:
  - Reglamento — art. 153 cuando aplica el umbral de 10 o más trabajadores permanentes
  - Jornada — tope de 40 horas semanales; gradualidad en el texto oficial
  - Evidencia — documentos, responsables y registros que demuestren lo anterior
- Enlace: texto oficial del Código del Trabajo en Ley Chile (y Ley 21.561 si se cita con URL propia)

## Conceptos (3)

| Título | Enfoque (ejecutivo, anclado a Código / 21.561) |
|--------|-----------------------------------------------|
| Reglamento interno | Art. 153: empresas con normalmente 10 o más trabajadores permanentes; orden, higiene y seguridad |
| Jornada | Art. 22 / Ley 21.561: jornada ordinaria no excederá de 40 horas semanales; remisión a gradualidad oficial |
| Evidencia laboral | Poder mostrar reglamento, configuración de jornada y responsables/registros — sin inventar una tercera obligación sustantiva |

Íconos: trazos del set Cumple (p. ej. clipboard/folder, clock o chart, check/folder), no engañosos.

## Modelo de datos

Sin ampliar tipos. Laboral rellena los opcionales que ya usan Karin y SST:

- `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`

Las otras tres materias (datos, inclusión, contratistas) siguen omitiéndolos en este corte.

## Visual

Igual que Karin/SST: conceptos en cards de lectura; checklist en banda `csand`; implica con numeración; processSteps numerados; héroe con acento si hay panel/batón; wordmark apilado/sólido existente.

## Fuera de alcance

- Cambiar el label del menú o el H1.
- Reescribir datos, inclusión o contratistas al mismo nivel en este corte.
- Contratos, finiquitos, vacaciones u otras figuras sin ancla en `norma.ts`.
- Declarar el tramo vigente de la Ley 21.561 en una fecha concreta.
- Blog, schema, sitemap.

## Criterio de éxito

En `/materias/laboral-rrhh` el visitante ve H1 `Laboral y RR.HH.`, wordmark, batón, panel, tres conceptos, checklist y el mismo ritmo visual que Karin/SST, sin parecer landing de producto ni portal de gobierno. Karin y SST no se degradan. Datos, inclusión y contratistas siguen en el layout base.
