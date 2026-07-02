# Design Language — Portal Institucional SEM v1.0

**Código:** OT-SEM-DESIGN-002  
**Depende de:** OT-SEM-DESIGN-001 (Design System)

Este documento define el lenguaje visual definitivo del Portal Institucional del Seminario Eclesiástico Mayor.

---

## Principio rector

> Ningún desarrollo visual podrá implementarse sin respetar el Manual de Marca Corporativo, el Moodboard oficial del SEM y el Design System institucional.

La identidad visual prevalece sobre plantillas, bibliotecas o estilos genéricos.

---

## Arquitectura visual

```
src/
├── design/                    # Tokens (colores, tipografía, espaciado…)
├── components/
│   ├── ui/                    # Componentes base del Design System
│   └── institutional/         # Componentes exclusivos del portal
├── lib/institutional/         # Contenido y datos de demostración
└── app/(site)/                # Home institucional
```

---

## Paleta oficial

| Rol              | Token CSS        | Uso                              |
|------------------|------------------|----------------------------------|
| Primary          | `--primary`      | Marca, overlays, footer          |
| Secondary        | `--secondary`    | Enlaces, acentos secundarios     |
| Accent           | `--accent`       | Destacados, stats, iconos        |
| Success          | `--success`      | Confirmaciones, checks           |
| Background       | `--background`   | Fondos principales               |
| Background Soft  | `--background-soft` | Secciones alternas            |

**Prohibido:** colores fuera del Manual de Marca.

---

## Tipografía

Jerarquía obligatoria (clases CSS institucionales):

| Nivel        | Clase              | Uso                    |
|-------------|--------------------|------------------------|
| Display XXL | `.text-display-xxl` | Hero                  |
| Display XL  | `.text-display-xl`  | Portadas, estadísticas |
| Display L   | `.text-display-l`   | Títulos de sección     |
| Heading     | `.text-heading`     | Bloques, cards         |
| Body        | `.text-body`        | Párrafos               |
| Caption     | `.text-caption`     | Metadatos, nav         |

Fuente actual: **Manrope** (reemplazo de Mosk).

---

## Espaciado

Sistema 8pt exclusivo: `8 · 16 · 24 · 32 · 48 · 64 · 96 · 128` px.

Usar componentes `Section`, `Stack`, `Spacer` y tokens de `@/design/spacing`.

---

## Cards institucionales

Todas las cards del portal usan la clase `.institutional-card`:

- Radius: **16px** (`--radius-xl`)
- Shadow: suave (`--shadow-md` → `--shadow-lg` en hover)
- Hover: elevación de 2px
- Animación: `animate-scale-in`

Componente base: `InstitutionalCard`.

---

## Iconografía

- Librería: **Lucide React** exclusivamente
- Stroke: **2**
- Tamaños: **16 · 20 · 24 · 32** px (`iconSizes` en `@/design`)

Prohibido: emojis, iconos mixtos, otras librerías.

---

## Animaciones

Permitidas (suaves):

- `animate-fade-in`
- `animate-slide-up`
- `animate-scale-in`
- `hero-parallax` (muy leve)
- `animate-scroll-hint` (indicador hero)

Prohibidas: rebotes, zoom agresivo, rotaciones.

---

## Componentes institucionales

| Componente            | Descripción                          |
|-----------------------|--------------------------------------|
| `HeroInstitutional`   | Hero fullscreen con overlay          |
| `NavbarPremium`       | Nav transparente → sólida al scroll  |
| `SectionTitle`        | Títulos de sección con overline      |
| `VerseBlock`          | Cita bíblica destacada               |
| `ProgramCard`         | Tarjeta de programa académico        |
| `TeacherCard`         | Tarjeta de formador                  |
| `NewsCard`            | Tarjeta de noticia                   |
| `TestimonialCard`     | Testimonio de egresado               |
| `EventCard`           | Evento institucional                 |
| `CTASection`          | Llamada a la acción de sección       |
| `StatsInstitution`    | Estadísticas en banda primary        |
| `InstitutionalGallery`| Galería con lazy loading             |
| `InstitutionalFooter` | Footer premium con IPN, redes, legal |
| `HomeInstitutional`   | Composición completa de la Home      |

Importación:

```tsx
import { HeroInstitutional, ProgramCard } from "@/components/institutional";
```

---

## Estructura de la Home

1. Hero (fullscreen)
2. Presentación + Versículo
3. Programas
4. ¿Por qué estudiar?
5. Estadísticas
6. Equipo
7. Galería
8. Testimonios
9. Noticias
10. CTA final
11. Footer premium

---

## Navbar Premium

- Logos **IPN** + **SEM** alineados
- Menú: Inicio, Programas, Admisión, Biblioteca, Noticias, Contacto
- Botón destacado: **Ingresar**
- Estado transparente sobre hero → sólido con `backdrop-blur` al scroll
- Menú CMS (`main`) tiene prioridad sobre links por defecto

---

## Performance

- Imágenes con `next/image`
- `priority` solo en hero y logos above-the-fold
- `loading="lazy"` en galería y noticias
- SVG optimizados en `/public/images/` como placeholders

Objetivos Lighthouse: Performance >95, Accessibility >100, SEO >100, Best Practices >100.

---

## Accesibilidad

- Contraste WCAG AA
- Focus visible (`focus-ring`)
- ARIA en hero scroll, modales, navegación
- Navegación por teclado en navbar móvil
- `alt` descriptivos en imágenes institucionales

---

## Restricciones permanentes

| Prohibido                         | Alternativa                    |
|----------------------------------|--------------------------------|
| Bootstrap, Material UI           | `@/components/ui` + institutional |
| Colores hardcodeados             | Variables CSS / tokens         |
| Sombras fuertes                  | `--shadow-sm` a `--shadow-lg`  |
| Gradientes exagerados            | Overlays primary con opacidad  |
| Fuentes no institucionales       | Manrope / Mosk                 |
| Tamaños tipográficos arbitrarios | Clases `.text-display-*`       |

---

## Catálogo visual

- Design System base: `/internal/design-system`
- Home institucional: `/`

---

## Próximas OT

Los componentes institucionales están listos para reutilizarse en:

- CMS y páginas dinámicas
- Programas académicos
- Biblioteca
- Noticias y blog
- Admisión
- Portal comercial

---

*Documentación generada como parte de OT-SEM-DESIGN-002.*
