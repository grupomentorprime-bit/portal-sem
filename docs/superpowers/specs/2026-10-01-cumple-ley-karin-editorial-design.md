# Cumple: piloto editorial Ley Karin (Información)

Profundizar `/materias/ley-karin` como ficha bandera del hub de Información: más contenido útil, secciones opcionales reutilizables y un aspecto visual más atractivo dentro del sistema Cumple. Las otras cinco materias no cambian de estructura en este corte (siguen con exige / implica / cumple).

## Decisiones

- Alcance: tipos + `MateriaPage` + contenido **solo Ley Karin** (las demás sin `concepts` ni `checklist`).
- Misma ruta `/materias/ley-karin`; menú Información y Soluciones siguen apuntando ahí.
- Secciones opcionales en `MateriaContent` (no página especial solo Karin).
- Hechos jurídicos solo desde fuentes oficiales ya usadas (`norma.ts` / BCN Ley 21.643). Sin montos de multa inventados.
- Visual atractivo **dentro** de tokens Cumple (`cpaper`, `csand`, `cviolet`, `caccent`, `cline`, `font-cdisplay`). Sin clonar DT, sin fotos stock, sin glow/orbs en la ficha, sin `glow-btn` en el héroe.
- CTA canónico `/evaluar` (outline en héroe; sólido sobrio al final).

## Orden de la página (Karin)

1. Héroe (eyebrow `Información · Cumplimiento`, H1 `Ley Karin`, `normRef`, lead ampliado, CTA outline).
2. **Conceptos** — grid de 3: acoso laboral, acoso sexual, violencia en el trabajo (título + definición corta).
3. Qué exige el marco (copy ampliado; vigencia 1 ago 2024; protocolo, procedimiento, resguardo).
4. **Checklist organización** — lista corta de evidencias típicas (protocolo vigente, procedimiento conocido, resguardos, responsables/registros).
5. Qué implica para la empresa.
6. Cómo lo ordena Mentor Cumple.
7. Disclaimer → Fuentes → Relacionado → CTA final.

## Modelo de datos

Ampliar `MateriaContent`:

```ts
concepts?: {
  heading: string;
  items: { title: string; body: string }[];
};

checklist?: {
  heading: string;
  intro?: string;
  items: string[];
};
```

Karin rellena ambos. El resto de materias los omite.

## Visual

- **Conceptos:** grid 1→3 columnas; cada ítem con borde `cline`, fondo `ccard`, radio existente (`rounded-2xl`), icono/tono suave (`bg` ink/sand/hot como el menú), título `font-cdisplay`, cuerpo `text-cmuted`. Hover sutil (`border-caccent/40`) — son lectura, no cards de marketing apiladas en el hero.
- **Checklist:** banda `csand` o lista con marcadores tipográficos claros (check en `cviolet` / `caccent`), no pills superfluas.
- **Ritmo:** más aire entre secciones (`py-14`–`py-16`); H2 fuertes; máximo una sección tinted entre exige e implica.
- **Prohibido en ficha:** hero `#071a45`, `glow-btn`, `orb-*`, imitaciones DT (bloques rosa “LEY KARIN”, fotos stock).

## Fuera de alcance

- Reescribir las otras 5 materias al mismo nivel.
- Cambiar menú Información (ya renombrado).
- Blog, schema, sitemap.
- Clonar layout trabajadores/empleadores de la DT.

## Criterio de éxito

En `/materias/ley-karin` el visitante ve conceptos claros, marco ampliado, checklist y un layout más atractivo que el texto corrido actual, sin parecer landing de producto ni portal de gobierno. Las otras materias siguen renderizando igual.
