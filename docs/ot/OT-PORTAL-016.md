# OT-PORTAL-016 — Portal Público con Diseño Fijo y Contenido Administrable

| Atributo | Valor |
| --- | --- |
| OT | OT-PORTAL-016 |
| Prioridad | Alta (arquitectura / UX / branding) |
| Módulo | Portal Público — AprendeHoy |
| Dependencia | Ninguna |
| Estado | **En definición** (principio adoptado; alineación incremental) |

## Objetivo

Establecer la regla arquitectónica del Portal Público: **el diseño vive en código**; **el CMS solo administra contenido**. Garantiza consistencia visual, calidad de UX y evolución del producto sin fragmentar la identidad por institución.

## Filosofía

> **Diseño = Código.**  
> **Contenido = CMS.**

El portal corporativo de AprendeHoy se desarrolla completamente en código. El CMS **no puede modificar layout, componentes, animaciones ni estructura visual** — solo textos, imágenes, fechas, enlaces, visibilidad y datos de negocio.

### Beneficio

Al modernizar el portal en el futuro:

- Se cambia el diseño **una sola vez** en el repositorio.
- Todas las instituciones **heredan** la mejora automáticamente.
- **Ninguna pierde** su contenido (convocatorias, noticias, calendarios, programas, etc.).

---

## Lo que controla el **código** (no editable en CMS)

| Área | Ejemplos |
| --- | --- |
| Layout general | Grid, breakpoints, contenedores (`PortalContainer`) |
| Responsive | Media queries, stacks mobile/desktop |
| Sistema de diseño | Tokens, espaciados, radios, sombras |
| Tipografías | Familias, escalas, pesos |
| Animaciones | Hero reveal, cursor premium, transiciones |
| Hero Premium | Estructura 42/58, glows, curvas, foto bleed |
| Cards / Carruseles | Composición visual, hover, estados |
| Header / Footer / Menús | Estructura, jerarquía, interacciones |
| Botones | Estilos `portal-btn-*`, tamaños, gradientes |
| Efectos visuales | Overlays fijos, partículas, ripple del cursor |
| Iconografía | Lucide / isotipo institucional vía assets |

**Excepción institucional (contenido de marca, no diseño):**

- Colores de branding (`branding.primaryColor`, etc.) — aplicados como **variables CSS** sobre el mismo sistema de diseño.
- Logos y favicon vía Asset Engine.

---

## Lo que controla el **CMS** (solo contenido)

### Hero (`heroPortal` / slides)

Por slide:

| Campo | Estado actual |
| --- | --- |
| Imagen Desktop / Mobile | ✅ `imagenDesktopId`, `imagenMobileId` |
| Eyebrow | ✅ `eyebrow` / `textoDestacado` |
| Título | ✅ `titulo` |
| Palabra destacada | ✅ `highlight` |
| Descripción | ✅ `descripcion` |
| CTA principal / secundario | ✅ `ctaPrimary`, `ctaSecondary` |
| Tarjeta informativa | ✅ `generationCard` + `showFloatingCard` |
| Fecha / evento / convocatoria | ✅ `generationCard.year`, `description`, `label` |
| Mostrar / ocultar tarjeta | ✅ `showFloatingCard` |

### Convocatorias

Ejemplos: matrículas abiertas, nueva generación, últimos cupos, postulación extraordinaria.

| Estado | Notas |
| --- | --- |
| 🟡 Parcial | Hoy vía `generationCard` del hero y bloques CTA; **falta módulo dedicado** reutilizable en home y admisión |

### Admisión

Fechas, requisitos, documentos, botones, formularios.

| Estado | Notas |
| --- | --- |
| 🟡 Parcial | Bloque `admission_process` + página `/admision`; ampliar desde CMS de contenido |

### Calendario académico

Inicio de clases, evaluaciones, vacaciones, seminarios, ceremonias.

| Estado | Notas |
| --- | --- |
| 🔴 Pendiente | Módulo de contenido `academic_calendar` no implementado |

### Noticias / Eventos / Biblioteca

| Módulo | Estado |
| --- | --- |
| Noticias | ✅ Colección + bloques `news` |
| Eventos | ✅ Colección + bloques `events` |
| Biblioteca | ✅ Bloque `library` + feature flag |

### Programas destacados

Selección desde módulo **Programas** (sin duplicar).

| Estado | Notas |
| --- | --- |
| ✅ | `fetchPrograms({ featured: true })` + bloque `programs` |

### Docentes

Selección desde módulo **Profesores**.

| Estado | Notas |
| --- | --- |
| ✅ | Bloque `teachers` query-driven |

### Testimonios / Banner promocional / CTA final

| Módulo | Estado |
| --- | --- |
| Testimonios | ✅ `testimonials` + Content Hub |
| Banner promocional | 🟡 Vía bloques `cta` / `resources` |
| CTA final | ✅ Bloque `cta` |

### Footer / SEO / Contacto / Redes

| Área | Estado |
| --- | --- |
| Footer (datos) | ✅ `portalCopy`, `contact`, menús |
| SEO | ✅ `seo` en Configuration Hub |
| Contacto | ✅ `contact` |
| Redes sociales | ✅ `social` |

---

## Experiencia del portal (`portalExperience`)

OT-PORTAL-015 introdujo **Cursor Premium** configurable desde Configuration Hub → Experiencia.

Bajo OT-PORTAL-016 esto se interpreta como:

- **Código:** geometría del cursor, estados (link, botón, card), animaciones, magnetismo, ripple.
- **CMS:** solo **activar/desactivar** y parámetros dentro del design system (colores institucionales, tamaño, opacidad, velocidad) — **no** layout ni componentes nuevos.

---

## Estado actual vs. regla de oro

### Alineado ✅

- Hero Premium SEM: estructura y CSS en `globals.css` + componentes React.
- Header / Footer premium: código fijo; menús desde `cms_menus`.
- Programas / docentes / noticias / eventos: contenido desde colecciones.
- Branding: colores como variables, no CSS arbitrario del editor.
- `heroPortal` en Configuration Hub: edición de **contenido** por slide.

### Desalineaciones a corregir 🟡

| Ítem | Riesgo | Acción recomendada |
| --- | --- | --- |
| Selector `variant: sem_premium` en Block Editor | CMS elige diseño | Fijar variante en código/plantilla home; CMS solo contenido del slide |
| `overlayColor`, `overlayOpacity`, `alignment` en slides | CMS altera composición | Mover a presets en código; CMS solo on/off overlay |
| Bloques `html` / `markdown` (admin) | Inyección de diseño | Restringir a portal interno o eliminar en público |
| `minHeight`, `align` en settings hero legacy | Diseño en CMS | Deprecar; usar layout fijo |
| Calendario académico | Contenido no modelado | OT futura: colección + bloque read-only |
| Convocatorias globales | Solo hero card | OT futura: entidad `announcements` |

---

## Arquitectura objetivo

```text
┌─────────────────────────────────────────────────────────┐
│  CÓDIGO (repo)                                          │
│  PortalShell · HeroPremium · Cards · Cursor · CSS       │
│  Design tokens · Animaciones · Responsive               │
└──────────────────────────┬──────────────────────────────┘
                           │ consume
┌──────────────────────────▼──────────────────────────────┐
│  CMS (contenido)                                          │
│  cms_config · cms_pages · cms_menus · colecciones       │
│  heroPortal.slides · programas · noticias · eventos       │
└───────────────────────────────────────────────────────────┘
```

### Fuentes de datos

| Fuente | Rol |
| --- | --- |
| `cms_config` | Institución, branding, SEO, contacto, heroPortal, experiencia |
| `cms_pages` | Orden y **contenido** de bloques (no diseño) |
| `cms_menus` | Enlaces de navegación |
| Colecciones | Programas, profesores, noticias, eventos, testimonios, biblioteca |

---

## Criterios de aceptación

- [ ] Documento OT-PORTAL-016 aprobado como regla de producto.
- [ ] Ningún campo del CMS permite cambiar layout, tipografía o estructura de componentes.
- [ ] Hero administrable solo con campos de contenido listados arriba.
- [ ] Programas y docentes referencian módulos existentes (sin duplicar).
- [ ] Roadmap de gaps (calendario, convocatorias) registrado en OTs hijas.
- [ ] Refactor de campos de diseño en `HeroSlide` y Block Editor planificado.

## OTs relacionadas

| OT | Relación |
| --- | --- |
| OT-PORTAL-010 / 011 | Hero Premium (diseño en código) |
| OT-PORTAL-014 | Hero administrable (`heroPortal`) |
| OT-PORTAL-015 | Cursor Premium (experiencia en código, toggles en CMS) |
| OT-SEM-CMS-001 | Configuration Hub |

## Restricciones

- El CMS **nunca** expone selectores de variante visual, CSS custom ni posicionamiento libre en el portal público.
- Toda mejora de diseño se despliega vía **release de código**, no configuración por tenant.
- Contenido existente debe **migrar sin pérdida** al endurecer las reglas.
