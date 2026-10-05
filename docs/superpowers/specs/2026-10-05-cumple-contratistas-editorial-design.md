# Cumple: editorial Contratistas y terceros (Información)

Aplicar a `/materias/contratistas-terceros` el mismo patrón editorial de las otras cinco materias: wordmark, héroe con batón + panel, conceptos, checklist, implica visual y pasos Cumple. Menú e H1 permanecen **Contratistas y terceros**. Cierra el set de fichas Información.

## Decisiones

- Alcance: contenido `contratistas-terceros` + tests. Reutilizar bloques de `MateriaPage`. Sin página especial.
- Misma ruta; menú sin cambio de href ni label.
- **H1** = `Contratistas y terceros`.
- Wordmark: `mark: ["TERCEROS"]`, `markTone: "hot"`.
- Hechos solo desde `norma.ts` / BCN (**Ley 20.123** + **Ley 16.744** art. 66 bis). Sin montos de multa. Sin listas de documentos mutual/DT no ancladas.
- Visual: mismo acento de ficha bandera. Sin clon portal estatal, sin glow/orbs.
- CTA `/evaluar`. Relacionado: SST, laboral, cómo funciona, FAQ, evaluar.

## Orden de la página

1. Héroe — wordmark; H1; batón; lead; CTA outline; panel.
2. Conceptos (3): empresa principal, protección en faena, documentos y control.
3. Qué exige el marco.
4. Checklist.
5. Qué implica (`implicaPoints`).
6. Cómo lo ordena Mentor Cumple (`processSteps`).
7. Disclaimer → Fuentes → Relacionado → CTA final.

## Héroe

**Batón:** `Ley 20.123` + Empresa principal · Faena · Control.

**Panel `heroAside`:** heading `Lo esencial`; etiqueta `Marco` / valor `Ley 20.123 · Ley 16.744`; deberes = contratistas en faena, medidas de protección, registros de coordinación/verificación; enlace Ley Chile (20.123).

## Conceptos (3)

| Título | Enfoque |
|--------|---------|
| Empresa principal | La obligación de proteger no se agota en el contratista |
| Protección en faena | Vida y salud de quienes laboran en la obra/faena, cualquiera sea su dependencia (66 bis / 16.744) |
| Documentos y control | Saber quién opera, qué medidas hay y demostrar coordinación/verificación — sin inventar listas de papeles |

## Modelo de datos

Sin ampliar tipos. Rellenar: `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`.

Tras este corte, las **seis** materias tienen el patrón editorial.

## Fuera de alcance

- Listas de documentos exigibles no ancladas en `norma.ts`.
- Multas inventadas.
- Ampliar `norma.ts` con fuentes mutual/DT (eso sería el corte C posterior).

## Criterio de éxito

En `/materias/contratistas-terceros` se ve el mismo ritmo que las otras cinco, con hechos anclados a 20.123 + 16.744. El hub Información queda completo a nivel editorial.
