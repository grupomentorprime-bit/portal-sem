# Tipografía

**Tokens:** `src/design/tokens/typography.ts` · Variables en `src/styles/design-tokens.css`

**Fuente actual:** Manrope (`next/font/google`)  
**Fuente objetivo:** Mosk (pendiente de licencia/integración)

---

## Escala tipográfica

| Token | Clase / variable | Cuándo usar |
| --- | --- | --- |
| Display XL | `--font-display-xl` | Hero principal, landing de admisión |
| Display | `--font-display` | Títulos de página institucional |
| Heading | `--font-heading` / `text-heading` | H1–H2 de sección |
| Title | `--font-title` / `text-title` | H3, títulos de card |
| Subtitle | `--font-subtitle` | Subtítulos bajo heading |
| Body | `--font-body` / `text-body` | Párrafos, descripciones |
| Caption | `--font-caption` / `text-caption` | Metadatos, fechas, hints |
| Overline | `text-xs uppercase tracking-widest` | Etiquetas de sección, breadcrumbs |

---

## Pesos

| Peso | Uso |
| --- | --- |
| 400 | Body, descripciones largas |
| 500 | Subtítulos, labels de formulario |
| 600 | Títulos de card, tabs activos |
| 700 | Headings, CTAs destacados |

---

## Cuándo usar cada nivel

| Contexto | Nivel recomendado |
| --- | --- |
| Hero portal | Display XL + Body |
| Título de sección CMS | Heading + Caption |
| Card de programa | Title + Body |
| Formulario admin | Title (sección) + Body (campos) + Caption (helper) |
| Badge / chip | Caption, semibold |
| Tabla de datos | Body + Caption en headers |

---

## Ejemplo

```tsx
<h1 className="text-display font-bold text-foreground">Título principal</h1>
<p className="mt-2 text-body text-muted">Descripción de apoyo.</p>
<span className="text-xs font-semibold uppercase tracking-widest text-secondary">
  Overline
</span>
```

---

## Reglas

- No definir `font-size` en px fuera de tokens.
- Preferir escala fluida (`clamp`) ya definida en design tokens.
- Mantener una sola familia sans en UI; mono solo para código o IDs técnicos.
