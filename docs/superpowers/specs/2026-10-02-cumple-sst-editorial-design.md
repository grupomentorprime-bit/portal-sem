# Cumple: editorial DS 44 / SST (Información)

Aplicar a `/materias/seguridad-salud-trabajo` el mismo patrón editorial ya validado en Ley Karin: héroe con batón + panel documental, conceptos, checklist, implica visual y pasos Cumple. Menú Información sigue mostrando **DS 44 / SST**; el H1 de la ficha es legible para quien no maneja la jerga.

## Decisiones

- Alcance: contenido de la materia `seguridad-salud-trabajo` + tests. Reutilizar tipos y bloques ya existentes en `MateriaPage` (`baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`). Sin página especial.
- Misma ruta `/materias/seguridad-salud-trabajo`; menú Información (“DS 44 / SST”) y Soluciones sin cambio de href.
- **H1** = `Seguridad y salud en el trabajo` (opción 1 aprobada). No renombrar el H1 a “DS 44 / SST”.
- Hechos jurídicos solo desde `norma.ts` / BCN (Ley 16.744 + Decreto 44). Sin cotizaciones, porcentajes ni multas inventadas.
- **Vigencia en panel:** no fijar un día calendario inventado. Usar publicación del DS 44 (27 de julio de 2024) y remitir al artículo primero transitorio (“primer día del sexto mes siguiente a la publicación”), como ya hace el copy de `exige`.
- Visual: mismos tokens Cumple y mismo acento de ficha bandera que Karin (gradiente lavanda + franja violeta cuando hay `baton` / `heroAside`). Sin clon portal estatal, sin fotos stock, sin glow/orbs.
- CTA canónico `/evaluar` (outline en héroe; sólido al final).
- Relacionado: mantener enlaces útiles (Karin, contratistas, cómo funciona, FAQ, evaluar).

## Orden de la página (SST)

1. Héroe — eyebrow `Información · Cumplimiento`; H1 `Seguridad y salud en el trabajo`; batón con señales del marco; lead afinado; CTA outline; panel derecho.
2. **Conceptos** — grid de 3: matriz de riesgos, programa de gestión, riesgos psicosociales.
3. Qué exige el marco (copy existente afiado si hace falta; citas BCN).
4. **Checklist** — evidencias típicas (matriz vigente, programa con medidas/plazos/responsables, seguimiento, registros).
5. Qué implica para la empresa (`implicaPoints`).
6. Cómo lo ordena Mentor Cumple (`processSteps`).
7. Disclaimer → Fuentes → Relacionado → CTA final.

## Contenido del héroe

**Batón (chips):**

- `DS 44` (norma del reglamento)
- `Ley 16.744` (marco del seguro)
- Matriz · Programa · Control (o tres chips equivalentes con íconos propios del set Cumple)

**Panel `heroAside`:**

- Heading: `Lo esencial`
- Vigencia: etiqueta tipo `Publicado` / valor `27 de julio de 2024` + línea o detalle que apunte al art. primero transitorio (sin inventar fecha de entrada en vigor)
- `Qué debe asegurar la empresa`:
  - Matriz — identificación de peligros y evaluación de riesgos
  - Programa — medidas, plazos y responsables
  - Control — evidencia y seguimiento permanentes
- Enlace: texto oficial del Decreto 44 en Ley Chile

## Conceptos (3)

| Título | Enfoque (ejecutivo, anclado a DS 44 / 16.744) |
|--------|-----------------------------------------------|
| Matriz de riesgos | Identificación de peligros y evaluación; pieza central del art. 4 / 7 |
| Programa de gestión | Medidas, plazos y responsables (art. 8) |
| Riesgos psicosociales | Factor que la entidad empleadora debe considerar en la matriz (art. 7) |

Íconos: trazos propios del set Cumple (p. ej. grid/layers, clipboard/list, users o similar), no genéricos engañosos.

## Modelo de datos

Sin ampliar tipos salvo necesidad de un campo ya cubierto. SST rellena los opcionales que hoy solo usa Karin:

- `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`

Las otras cuatro materias (laboral, datos, inclusión, contratistas) siguen omitiéndolos.

## Visual

Igual que Karin: conceptos en cards de lectura; checklist en banda `csand`; implica con numeración; processSteps numerados; héroe con acento solo si hay panel/batón.

## Fuera de alcance

- Cambiar el label del menú Información (“DS 44 / SST”).
- Reescribir las otras cuatro materias al mismo nivel en este corte.
- Cuestionarios CEAL, mutuales concretas, cotizaciones o plazos de fiscalización no anclados en las fichas.
- Blog, schema, sitemap.

## Criterio de éxito

En `/materias/seguridad-salud-trabajo` el visitante ve H1 claro, batón DS 44 / 16.744, panel documental, tres conceptos, checklist y el mismo ritmo visual que Ley Karin, sin parecer landing de producto ni portal de gobierno. Karin no se degrada. Las otras cuatro materias siguen en el layout base.
