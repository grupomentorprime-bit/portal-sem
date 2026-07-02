# Biblioteca Gráfica Institucional — SEM

**Código:** OT-EDITORIAL-ASSETS-001  
**Versión:** v1.0  
**Épica:** [EP-001 — Portal Institucional Premium](../strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)  
**Complementa:** [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md) · [INTRODUCTION.md](./INTRODUCTION.md)

---

## Qué es este documento

Catálogo oficial de **recursos gráficos exclusivos** del Seminario Eclesiástico Mayor. Permite al portal y al ecosistema AprendeHoy abandonar dependencia de stock genérico y construir una identidad reconocible sin ver el logotipo.

| Capa | Documento | Función |
| --- | --- | --- |
| Experience Kit | INTRODUCTION.md | Componentes, tokens, accesibilidad |
| Dirección editorial | EDITORIAL-ART-DIRECTION.md | Qué comunicar y qué evitar |
| **Esta biblioteca** | EDITORIAL-ASSETS.md | Recursos SVG reutilizables |

---

## Ubicación

```
public/editorial/
├── manifest.json          # Inventario y metadatos
├── patterns/              # 15 patrones sutiles
├── textures/              # 10 texturas (≤8% opacidad)
├── gradients/             # 5 gradientes institucionales
├── overlays/              # 6 overlays fotográficos
├── dividers/              # 5 separadores editoriales
├── seals/                 # 18 sellos (6 tipos × 3 variantes)
├── icons/                 # 10 iconos exclusivos
├── backgrounds/           # 6 fondos por sección
└── illustrations/         # 6 ilustraciones editoriales
```

**Regenerar assets:** `npm run generate:editorial`

**API tipada (rutas):** `src/lib/editorial/assets.ts`  
**Utilidades CSS:** `src/styles/editorial-assets.css` (importado en `globals.css`)

---

## Paleta autorizada

Todos los recursos usan **únicamente** los tokens de `src/styles/tokens/brand.css`:

| Token | HEX | Uso en biblioteca |
| --- | --- | --- |
| `--sem-primary` | `#002A47` | Patrones, overlays oscuros, sellos azul |
| `--sem-secondary` | `#246AA1` | Líneas editoriales, gradientes medios |
| `--sem-accent` | `#10BCE2` | Destacados, isotipo geométrico |
| `--sem-success` | `#3ED6AF` | Uso puntual en ilustraciones |
| `--sem-light` | `#8CE27F` | Variante «warm» de sellos (acento cálido, no oro metálico) |

**Prohibido:** agregar HEX fuera de esta paleta. Multi-tenant hereda `brand.css` del tenant activo.

---

## 01. Patterns (15)

Patrones SVG en mosaico. Opacidad de capa: **4–8%**. Nunca decorativos.

| Archivo | Inspiración | Cuándo usar |
| --- | --- | --- |
| `bible-lines.svg` | Líneas de texto bíblico | Fondos de secciones de estudio, biblioteca |
| `bible-margin.svg` | Margen de página | Laterales de citas, VerseBlock |
| `column-classical.svg` | Columnas clásicas | Secciones institucionales, historia |
| `isotype-geometry.svg` | Geometría del isotipo | Hero secundario, admisión |
| `editorial-lines.svg` | Líneas editoriales | Separación de bloques en home |
| `academic-grid.svg` | Cuadrícula académica | Programas, catálogo formativo |
| `cross-minimal.svg` | Cruz minimalista | Testimonios, oración, vocación |
| `scripture-dots.svg` | Referencias bíblicas | Listados, metodología |
| `sem-diamond.svg` | Rombo institucional | Detalle de marca en cards |
| `page-rhythm.svg` | Ritmo de párrafo | Texto largo, presentación |
| `margin-notes.svg` | Notas al margen | Pull quotes, citas |
| `chapter-mark.svg` | Marca de capítulo | Ruta formativa, timeline |
| `study-grid.svg` | Cuadrícula de estudio | Material formativo |
| `pillar-flute.svg` | Columna clásica | Footer, institución |
| `woven-lines.svg` | Tejido sutil | Comunidad, testimonios |

**Clases CSS:** `.editorial-pattern`, `.editorial-pattern--bible-lines`, `.editorial-pattern--academic-grid`, etc.

**Prohibido:** patrones a opacidad >8%, sobre fotografías sin overlay, mezclar dos patrones en la misma sección.

---

## 02. Textures (10)

Texturas de ruido fractal con tinte `--sem-primary` al **8% máximo**.

| Archivo | Efecto |
| --- | --- |
| `paper-editorial.svg` | Papel editorial estándar |
| `parchment-modern.svg` | Pergamino contemporáneo |
| `canvas-soft.svg` | Canvas suave |
| `paper-fiber.svg` | Fibra de papel |
| `fine-grain.svg` | Grano muy fino |
| `linen-weave.svg` | Tejido lino |
| `vellum-soft.svg` | Vitela suave |
| `cotton-matte.svg` | Algodón mate |
| `warm-paper.svg` | Papel cálido |
| `editorial-matte.svg` | Mate editorial neutro |

**Clases CSS:** `.editorial-texture`, `.editorial-texture--paper`, `.editorial-texture--parchment`

**Cuándo usar:** sobre fondos claros (`--background`, `--background-soft`). Una sola textura por sección.

---

## 03. Gradientes (5)

Gradientes derivados de la progresión institucional:

```
Azul profundo (--sem-primary)
        ↓
Azul institucional (--sem-secondary)
        ↓
Azul claro (--sem-accent)
```

| Recurso | Uso |
| --- | --- |
| `institutional-vertical.svg` | Bloques de altura completa |
| `institutional-diagonal.svg` | CTAs, banners laterales |
| `institutional-hero.svg` | Hero (Fase 2 — aplicación visual) |
| `institutional-cta.svg` | PortalCTAPremium |
| `institutional-footer.svg` | Footer premium |

**Variables CSS** (preferidas en componentes):

```css
var(--editorial-gradient-vertical)
var(--editorial-gradient-diagonal)
var(--editorial-gradient-hero)
var(--editorial-gradient-cta)
var(--editorial-gradient-footer)
```

**Clases:** `.editorial-gradient--vertical`, `.editorial-gradient--hero`, etc.

**Prohibido:** más de 5 gradientes oficiales; gradientes multicolor; gradientes en texto body.

---

## 04. Overlays (6)

Capas sobre fotografías para legibilidad de texto.

| Archivo | Uso |
| --- | --- |
| `overlay-hero.svg` | Hero principal — degradado primary→secondary |
| `overlay-cta.svg` | Bloques CTA con imagen |
| `overlay-footer.svg` | Footer con imagen de fondo |
| `overlay-editorial-blue.svg` | Azul institucional medio |
| `overlay-dark-blue.svg` | Azul profundo alto contraste |
| `overlay-diagonal.svg` | Composición diagonal editorial |

**Clases:** `.editorial-overlay`, `.editorial-overlay--hero`, etc.

**Combinación recomendada:** foto ministerial + `overlay-hero` + patrón al 4% + texto blanco.

---

## 05. Dividers (5)

Separadores con identidad — no líneas planas genéricas.

| Archivo | Uso |
| --- | --- |
| `divider-editorial-line.svg` | Entre secciones estándar |
| `divider-cross.svg` | Antes/después de testimonios, oración |
| `divider-academic.svg` | Programas, equipo docente |
| `divider-biblical.svg` | Versículos, citas |
| `divider-isotype.svg` | Transiciones institucionales destacadas |

**Uso en componentes:**

```tsx
<img src="/editorial/dividers/divider-cross.svg" alt="" aria-hidden className="mx-auto my-8 w-full max-w-xs" />
```

---

## 06. Sellos institucionales (18)

6 tipos × 3 variantes de color. **No** imitan certificados académicos — son badges institucionales.

| Sello | Archivos |
| --- | --- |
| Respaldo Institucional | `seal-respaldo-institucional-{blue,white,warm}.svg` |
| 100% Online | `seal-cien-online-{blue,white,warm}.svg` |
| Comunidad Formativa | `seal-comunidad-formativa-{blue,white,warm}.svg` |
| Formación Bíblica | `seal-formacion-biblica-{blue,white,warm}.svg` |
| Campus Virtual | `seal-campus-virtual-{blue,white,warm}.svg` |
| Iglesia Pentecostal Nazareth | `seal-ipn-chile-{blue,white,warm}.svg` |

| Variante | Colores | Cuándo |
| --- | --- | --- |
| `blue` | Fondo secondary, texto blanco | Sobre fondos claros |
| `white` | Fondo blanco, texto primary | Sobre fotografías con overlay |
| `warm` | Fondo `--sem-light`, texto primary | Destacados puntuales, admisión |

**TypeScript:**

```ts
import { editorialPaths } from "@/lib/editorial/assets";

editorialPaths.seals.formacionBiblica("blue");
```

---

## 07. Iconografía exclusiva (10)

Estilo: trazo 1.75px, sin relleno, Lucide-compatible en proporción. **No** sustituyen Lucide en UI funcional — complementan narrativa editorial.

| Icono | Tema |
| --- | --- |
| `bible.svg` | Escrituras |
| `discipleship.svg` | Discipulado |
| `ministry.svg` | Ministerio |
| `church.svg` | Iglesia |
| `community.svg` | Comunidad |
| `service.svg` | Servicio |
| `leadership.svg` | Liderazgo |
| `prayer.svg` | Oración |
| `study.svg` | Estudio |
| `vocation.svg` | Vocación |

**Cuándo usar:** feature grid editorial, ruta formativa, material formativo.  
**Prohibido:** mezclar con iconos rellenos, emojis, otras librerías en la misma sección.

---

## 08. Fondos editoriales (6)

Fondos con patrón sutil integrado — nunca completamente planos.

| Archivo | Sección |
| --- | --- |
| `bg-hero.svg` | Hero |
| `bg-programas.svg` | Programas |
| `bg-equipo.svg` | Equipo docente |
| `bg-biblioteca.svg` | Biblioteca |
| `bg-noticias.svg` | Noticias |
| `bg-footer.svg` | Footer |

**Clases:** `.editorial-bg--hero`, `.editorial-bg--programas`, etc.

---

## 09. Ilustraciones (6)

Estilo editorial minimalista, línea única, sin personajes caricaturescos.

| Archivo | Escena |
| --- | --- |
| `bible-open.svg` | Biblia abierta |
| `community.svg` | Comunidad |
| `study.svg` | Estudio |
| `prayer.svg` | Oración |
| `virtual-classroom.svg` | Aula virtual (tecnología como soporte) |
| `library.svg` | Biblioteca |

**Cuándo usar:** empty states, onboarding admisión, previews de biblioteca.  
**Prohibido:** ilustraciones coloridas tipo startup, personajes 3D, clipart.

---

## 10. Integración Experience Kit

### En CSS / componentes

```tsx
<section className="editorial-surface editorial-bg--programas relative">
  <div className="editorial-overlay editorial-overlay--hero" aria-hidden />
  {/* contenido Experience Kit */}
</section>
```

### En TypeScript

```ts
import { editorialPaths } from "@/lib/editorial/assets";

<Image src={editorialPaths.illustrations.bibleOpen} alt="" aria-hidden />
```

### Multi-tenant

- Assets en `/editorial/` son **compartidos** por ruta estática.
- Colores resuelven vía `var(--sem-*)` en CSS — cada tenant redefine tokens en `brand.css`.
- No duplicar biblioteca por tenant salvo OT de marca distinta.

---

## Combinaciones aprobadas

| Contexto | Patrón | Textura | Overlay | Gradiente |
| --- | --- | --- | --- | --- |
| Hero con foto | `editorial-lines` 4% | — | `overlay-hero` | — |
| Sección clara | `academic-grid` 6% | `paper-editorial` 8% | — | — |
| CTA premium | — | — | `overlay-cta` | `--editorial-gradient-cta` |
| Footer | `pillar-flute` 4% | — | `overlay-footer` | `--editorial-gradient-footer` |
| Biblioteca | `bible-margin` 6% | `parchment-modern` 6% | — | — |

---

## Prohibiciones globales

1. Opacidad de patrón/textura **>8%** en cualquier capa.
2. Colores fuera de `--sem-*`.
3. Patrones como protagonista visual (deben ser casi imperceptibles).
4. Sellos que imiten diplomas o certificados universitarios.
5. Iconografía editorial en botones de acción primaria (usar Lucide).
6. Más de **dos** capas gráficas editoriales simultáneas (patrón + textura máximo).
7. Recursos de stock superpuestos sin overlay institucional.

---

## Criterios de aceptación OT-EDITORIAL-ASSETS-001

| Criterio | Estado |
| --- | --- |
| Biblioteca completa por categorías | ✅ 81 archivos en `public/editorial/` |
| Recursos reutilizables SVG | ✅ |
| Documentación publicada | ✅ Este documento |
| Integración Experience Kit | ✅ CSS + `assets.ts` + `globals.css` |
| Sin colores fuera del sistema | ✅ `check:branding` |
| Compatible multi-tenant | ✅ Tokens CSS variables |
| Script de regeneración | ✅ `npm run generate:editorial` |

---

## Próximo paso recomendado

**OT-MEDIA-SEM-001 — Biblioteca Fotográfica Institucional**

Combinar esta biblioteca gráfica con fotografías curadas (estudio bíblico, comunidad, graduación) según [EDITORIAL-ART-DIRECTION.md §4–5](./EDITORIAL-ART-DIRECTION.md) cerrará el lenguaje visual completo del portal.

---

## Referencias

- [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md)
- [EDITORIAL-AUDIT.md](../audits/EDITORIAL-AUDIT.md)
- [COLORS.md](./COLORS.md)
- [OT-EDITORIAL-ASSETS-001](../ot/OT-EDITORIAL-ASSETS-001.md) *(crear si aplica)*

---

*Biblioteca permanente del proyecto SEM. Toda aplicación visual nueva debe consultar este catálogo antes de introducir recursos externos.*
