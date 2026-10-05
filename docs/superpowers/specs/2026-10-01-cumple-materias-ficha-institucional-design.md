# Cumple: ficha institucional en páginas de materia

Las páginas `/materias/...` dejan de verse como landing comercial y pasan a leerse como ficha normativa institucional: el visitante que llega desde una búsqueda de la norma reconoce el tema de inmediato. Se mantiene la marca Cumple en header/pie; no se imita ni se suplanta a sitios de gobierno.

## Decisiones

- Alcance: solo la plantilla `MateriaPage` y el contenido de las 6 materias. Header, home y páginas de apoyo no se rediseñan en este corte.
- Patrón visual: ficha documental (referencia Serpat / UV), no portal DT clonado ni landing tipo Laborsafe.
- H1 visible = nombre de la materia (“Ley Karin”, “Seguridad y salud en el trabajo”, …).
- Referencia normativa corta bajo el H1 cuando exista (p. ej. “Ley 21.643”).
- Eyebrow transversal: `Información · Cumplimiento` (el tema va en el H1, no solo en el eyebrow).
- Menú: **Soluciones** (ángulo servicio) e **Información** (ángulo marco; antes “Normativas”) apuntan a las mismas URLs `/materias/...`.
- Cumple como oferta aparece en la sección “Cómo lo ordena Mentor Cumple” y en un CTA final sobrio; no domina el héroe.
- Sin fotos stock, sin logos de gobierno, sin colores/bloques que imiten a la DT.
- SEO: `title` y `description` del registro del sitio pueden seguir orientados a búsqueda; el H1 en página es el nombre de la materia.

## Héroe

- Fondo claro (`cpaper` o equivalente del tema Cumple), borde inferior sutil (`cline`). Sin hero `#071a45`, sin radial glow, sin orbs.
- Orden: eyebrow → H1 (`titleName`) → `normRef` (si hay) → lead → CTA secundario a `/evaluar` (outline o botón sólido sin `glow-btn` dominante).
- Tipografía: `font-cdisplay` / tokens existentes; H1 en `text-cink`, no blanco sobre azul.

## Cuerpo

Orden fijo:

1. Qué exige el marco
2. Qué implica para la empresa (fondo `csand` permitido)
3. Cómo lo ordena Mentor Cumple
4. Disclaimer orientativo
5. Fuentes oficiales
6. Relacionado
7. CTA final: banda simple (borde + fondo sand o card plana), un botón a `/evaluar`. Sin gradiente ni orbs.

El copy existente de `exige` / `implica` / `cumple` / `sources` / `disclaimer` se reutiliza. Solo se ajusta el modelo del héroe (nombre de materia + referencia + lead).

## Modelo de contenido

En `MateriaContent`:

- `titleName: string` — H1 visible (nombre de la materia).
- `normRef?: string` — línea institucional corta (ley/decreto).
- `lead: string` — párrafo de alcance documental (el antiguo H1 marketing se recorta o se fusiona aquí).
- En el mismo corte, renombrar el campo `h1` → `titleName` en tipos, datos y plantilla. No dejar ambos campos.

Las 6 materias deben declarar `titleName` y, cuando corresponda, `normRef` alineado a `norma.ts` / fuentes BCN.

## Fuera de alcance

- Rediseño de home, FAQ, cómo funciona, nosotros, contacto, evaluar.
- Clonar layout DT (columnas trabajadores/empleadores, foto hero).
- Schema.org avanzado, sitemap, blog.
- Cambiar el menú o las rutas.

## Criterio de éxito

Al abrir `/materias/ley-karin`, en el primer viewport se lee “Ley Karin” (o equivalente) como título principal, el tono es documental, y no se confunde con una campaña de producto. Las otras cinco materias siguen el mismo patrón.
