# Home Premium v2 — Dirección de Arte

**OT:** OT-DESIGN-HOME-001  
**Estado:** Estándar aprobado — referencia obligatoria para OTs de implementación  
**Tipo:** Documento de diseño (no implementación)

> **Documento padre:** [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md) — identidad editorial SEM (OT-PORTAL-003). Este archivo aplica esa dirección específicamente al Home.

---

## Filosofía

La Home del SEM **no debe sentirse como un CMS**. Debe sentirse como **una experiencia**.

El visitante recorre la página como una **historia**. Cada bloque cumple una función emocional distinta. No existen dos secciones iguales. No existen cuatro cajas repetidas.

**Referencia de calidad:** el Hero Premium (LOCKED) es el piso visual de toda la Home. Todo lo demás debe estar a su altura.

---

## Principios de diseño

### 1. Hero cinematográfico

- **LOCKED** — no modificar sin `OT-UNLOCK-HERO-001`
- Referencia absoluta de composición, contraste, fotografía y tipografía
- El resto de la Home compite en impacto, no en estilo distinto

### 2. Ritmo visual

Alternar constantemente para evitar la sensación de “caja, caja, caja…”:

| Alternar | Ejemplos |
| --- | --- |
| Fondos claros ↔ oscuros | `#F7F9FC` → azul profundo `#041525` |
| Imagen full-width ↔ bloque editorial | banda fotográfica vs. texto centrado |
| Espacios abiertos ↔ densidad controlada | mucho aire entre actos narrativos |
| Composición simétrica ↔ asimétrica | bento, offset, featured + secundarios |

### 3. Diseño editorial

**Inspiración:** Apple, Stripe, Notion, Webflow, Framer, Harvard, Hillsong College, MasterClass.

**Evitar:** Bootstrap, dashboard administrativo, tarjetas genéricas repetidas.

---

## Narrativa — La historia de la Home

```
HERO          →  Inspirar
     ↓
PROGRAMAS     →  ¿Qué puedes estudiar?     (oportunidades, no catálogo)
     ↓
VOCACIÓN      →  ¿Por qué hacerlo?         (inspiración, no 4 cajas)
     ↓
RUTA          →  ¿Cómo será tu crecimiento? (viaje, no diagrama)
     ↓
DOCENTES      →  ¿Quién te acompañará?     (personas, no tarjetas)
     ↓
COMUNIDAD     →  Vida, historias, alumnos  (fotografía + testimonio)
     ↓
NOTICIAS      →  Revista, no blog
     ↓
CTA           →  Gran cierre emocional
     ↓
FOOTER        →  Institucional (LOCKED)
```

### Por bloque

#### HERO — *Inspirar*

| | |
| --- | --- |
| `data-block` | `hero` |
| Estado | **LOCKED v1** |
| Función | Impacto cinematográfico, vocación, postulación |
| Regla | No tocar. Es la referencia. |

#### PROGRAMAS — *¿Qué puedes estudiar?*

| | |
| --- | --- |
| `data-block` | `academic_offer` |
| Target | **v2** |
| Función | Mostrar **oportunidades**, no listado administrativo |
| Composición | Sección visual editorial; 2–3 programas como “destacados”, no grid repetitivo |
| Evitar | Catálogo, cards idénticas en fila, metadata densa |
| Referencia | MasterClass (curso protagonista), landing por programa |

#### VOCACIÓN — *¿Por qué hacerlo?*

| | |
| --- | --- |
| `data-block` | `feature_grid` |
| Target | **v2** |
| Función | Inspiración, propósito, confianza |
| Composición | Layout bento asimétrico o banda editorial con imagen; **nunca 4 cajas iguales** |
| Evitar | Icon grid Bootstrap, cards blancas en fila |

#### RUTA FORMATIVA — *¿Cómo será tu crecimiento?*

| | |
| --- | --- |
| `data-block` | `timeline` |
| Target | **v2** |
| Función | Sensación de **viaje** formativo |
| Composición | Recorrido horizontal o vertical con profundidad; estados visuales (completado / activo / próximo) |
| Evitar | Diagrama de flujo, steps genéricos, línea de tiempo plana |

#### DOCENTES — *¿Quién te acompañará?*

| | |
| --- | --- |
| `data-block` | `people` |
| Target | **v2** |
| Función | **Las personas venden** — rostro, historia breve, credencial |
| Composición | Retratos grandes 4:5 o 3:4; pocos perfiles protagonistas; hover sutil |
| Evitar | Grid de avatares, cards administrativas, placeholders genéricos |

#### COMUNIDAD — *Vida e historias*

| | |
| --- | --- |
| `data-block` | *(planificado — bloque testimonios / community)* |
| Target | **v2** |
| Función | Alumnos, testimonios, fotografías de vida real |
| Composición | Collage editorial, quote grande + foto, o carrusel premium |
| Evitar | Slider de quotes sobre fondo gris |

#### NOTICIAS — *Revista*

| | |
| --- | --- |
| `data-block` | `news` |
| Target | **v2** |
| Función | Actualidad con sensación **revista institucional** |
| Composición | 1 noticia hero + 2 secundarias (ya iniciado); tipografía editorial, imagen dominante |
| Evitar | Blog WordPress, lista de títulos, thumbnails pequeños |

#### CTA — *Cierre emocional*

| | |
| --- | --- |
| `data-block` | `cta_premium` |
| Target | **v2** |
| Función | Decisión — postular, contactar, dar el paso |
| Composición | Banda oscura full-width, tipografía grande, stats opcionales, imagen de fondo |
| Evitar | Banner plano con dos botones |

#### CONTACTO

| | |
| --- | --- |
| `data-block` | `contact_hub` |
| Target | **v2** |
| Función | Cercanía, accesibilidad |
| Composición | Mapa elegante + canales; no formulario genérico centrado |

#### FOOTER

| | |
| --- | --- |
| Estado | **LOCKED v1** |
| Función | Presencia institucional, navegación, legal |

---

## Sistema visual

### Fotografía

- **Protagonista** — nunca miniaturas decorativas
- Mucho **aire** alrededor de la imagen
- **Sombras suaves** — profundidad sin bordes duros
- **Overlay elegante** — degradado oscuro para legibilidad, nunca capa blanca
- Fallbacks: fotografía institucional real (estudio, aula, comunidad, ministerio)

### Tipografía

- **Máximo 3 tamaños de título** en toda la Home (display / sección / card)
- Mucho **espacio** entre eyebrow, título y cuerpo
- Jerarquía clara: eyebrow → título → lead → cuerpo → meta
- Letter-spacing amplio en eyebrows institucionales

### Color

| Rol | Uso |
| --- | --- |
| Azul profundo `#041525` / `#002A47` | Fondos oscuros, autoridad |
| Turquesa `#14C9C3` | Acento, CTAs, highlights |
| Dorado | **Solo** para destacar (badge premium, hito especial) |
| Superficies claras `#F7F9FC` | Alternancia de ritmo, no blanco puro infinito |

**Menos colores. Más intención.**

### Cards

- **No repetir** la misma card en 20 lugares
- Cada sección puede tener **composición propia**
- `PortalCatalogCard` es base LOCKED — la **composición** alrededor es libre por OT v2
- Preferir: imagen grande + texto debajo, o horizontal editorial, o featured + secundarios

---

## Reglas

### Prohibido

- Cuatro cajas iguales
- Grids repetitivos sin jerarquía
- Cards estilo Bootstrap
- Bordes visibles en todo
- Cajas blancas infinitas en secuencia
- Fondos planos continuos en toda la página
- Modificar Hero / Header / Footer sin OT de desbloqueo

### Permitido

- Fotografías grandes
- Composiciones editoriales
- Superposición y capas
- Profundidad (sombra, overlay, blur sutil)
- Diagonales suaves en transiciones de sección
- Diferentes alturas entre elementos
- Ritmo claro–oscuro–claro

---

## Metodología (obligatoria desde v2)

Ninguna sección se implementa directamente en código.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  FASE 1     │ ──► │  FASE 2          │ ──► │  FASE 3     │
│  Diseño     │     │  Implementación  │     │  Lock       │
│  Mockup OK  │     │  = diseño        │     │  LOCKED     │
└─────────────┘     └──────────────────┘     └─────────────┘
```

### Fase 1 — Diseño

- Proponer composición visual (wireframe, mockup o captura de referencia)
- Aprobación explícita antes de codificar
- Entregables: Desktop 1920, Notebook 1366, Tablet 1024, Mobile 390

### Fase 2 — Implementación

- Construir **exactamente** lo aprobado en Fase 1
- CSS scoped a `[data-block]` en `src/styles/home-premium/`
- Validar Hero + Header + Footer aunque no se toquen

### Fase 3 — Lock

- Sección aprobada → estado **LOCKED** en `UI-COMPONENT-STATUS.md`
- Cambios futuros → `OT-UNLOCK-{SECTION}-001` + comparación Antes/Después

---

## Arquitectura de módulos v2

| Módulo | Versión | Estado diseño | CSS Home |
| --- | --- | --- | --- |
| Hero | v1 | LOCKED | `hero-home.css` |
| Programs | v2 | Por diseñar | `programs-home.css` |
| Why Study (Vocación) | v2 | Por diseñar | `why-study-home.css` |
| Timeline | v2 | Por diseñar | `timeline-home.css` |
| Teachers | v2 | Por diseñar | `teachers-home.css` |
| Community | v2 | Por diseñar | *(pendiente)* |
| News | v2 | Por diseñar | `news-home.css` |
| CTA | v2 | Por diseñar | `cta-home.css` |
| Contact | v2 | Por diseñar | `contact-home.css` |
| Footer | v1 | LOCKED | `footer-home.css` |

---

## Objetivo final

Cuando un visitante abra la Home del SEM debe sentir que está frente a una **institución moderna, sólida y de alto nivel académico**, donde cada sección aporta a una **narrativa visual coherente y memorable**.

La página deja de parecer un conjunto de componentes reutilizados y se convierte en una **experiencia editorial premium** que inspire confianza, excelencia y vocación desde el primer segundo.

---

## Referencias

- [UI-COMPONENT-STATUS.md](../ui/UI-COMPONENT-STATUS.md)
- [UI-LOCK-POLICY.md](../ui/UI-LOCK-POLICY.md)
- [OT-ARCH-UX-001.md](../ot/OT-ARCH-UX-001.md)
