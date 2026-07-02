# Auditoría Editorial Integral — OT-PORTAL-003 Fase 1

**Código:** OT-PORTAL-003  
**Fecha:** 2026-07-01  
**Referencia:** [EDITORIAL-ART-DIRECTION.md](../design/EDITORIAL-ART-DIRECTION.md)  
**Estado:** Fase 1 completada

---

## Resumen ejecutivo

Se realizó la auditoría editorial del portal público y se aplicó el glosario institucional en las páginas HOME, PROGRAMAS, EQUIPO, BIBLIOTECA, NOTICIAS y CONTACTO. Se creó la estructura `public/editorial/` para la biblioteca gráfica institucional. No se modificaron hero, footer, gradientes globales, animaciones ni layouts (reservado para fases siguientes).

---

## 1. Auditoría de lenguaje

### Glosario aplicado

| ❌ Evitar | ✅ Usar | Estado Fase 1 |
| --- | --- | --- |
| Cursos | Programas formativos | ✅ Aplicado |
| Instructor / Profesor | Docente | ✅ Aplicado en equipo y demo |
| Dashboard | Campus virtual | ✅ Aplicado en metodología |
| Features | Vocación / Beneficios formativos | ✅ Bloques home ya usan «Vocación» |
| Tecnología | Experiencia de aprendizaje | ✅ Aplicado en showcase |
| Contenido | Material formativo | ✅ Aplicado en biblioteca y recursos |
| Plataforma (protagonista) | Campus virtual (soporte) | ✅ Aplicado |
| Inscríbete | Postular | ✅ Seminarios demo |

### Textos modificados por página

#### HOME (`src/lib/cms/home-portal-001.ts`, `page-defaults.ts`, `institutional-demo.ts`)

| Ubicación | Antes | Después |
| --- | --- | --- |
| Seminarios home | «Cursos cortos y especializados…» | «Programas formativos cortos y especializados…» |
| Seminarios home título | «Seminarios disponibles» | «Seminarios formativos» |
| Metodología m2 | «Plataforma AprendeHoy» | «Campus virtual» |
| Metodología m3 | «Material de apoyo» | «Material formativo» |
| Metodología descripción | «plataforma digital» | «campus virtual» |
| FAQ modalidad | «plataforma AprendeHoy» | «campus virtual» |
| Oferta académica | «Programas que transforman vidas» | «Formación bíblica para el servicio cristiano» |
| Oferta overline | «PROGRAMAS DESTACADOS» | «PROGRAMAS FORMATIVOS» |
| Noticias bloque | «Noticias y Eventos» | «Noticias y vida seminarista» |
| Equipo bloque | «Equipo Docente» | «Equipo docente» |
| Biblioteca bloque | «Recursos para tu formación» | «Material formativo para tu camino» |
| Recursos destacados | «Contenido estratégico…» | «Material formativo seleccionado…» |
| Showcase plataforma | «Tecnología de clase mundial» | «Formación a tu ritmo pastoral» |
| Showcase overline | «Plataforma académica» | «Experiencia de aprendizaje» |

#### PROGRAMAS (`ProgramsPageContent.tsx`, `programas/page.tsx`)

| Antes | Después |
| --- | --- |
| «Programas académicos» | «Programas formativos» |
| Metadata genérica SEO | Descripción con formación bíblica y pastoral |

#### EQUIPO (`equipo/page.tsx`, seed, institutional-demo)

| Antes | Después |
| --- | --- |
| «Equipo institucional» | «Equipo docente» |
| «Profesor Titular» / «Profesora» | «Docente titular» / «Docente» |
| Sección «Soporte» | «Acompañamiento administrativo» |

#### BIBLIOTECA (`biblioteca/page.tsx` — nueva)

| Elemento | Copy institucional |
| --- | --- |
| Título | «Biblioteca institucional» |
| Descripción | Material formativo, estudios bíblicos y recursos académicos |
| CTA tarjetas | «Consultar recurso» |
| Empty state | «Biblioteca en preparación» |

#### NOTICIAS (`noticias/page.tsx`)

| Antes | Después |
| --- | --- |
| «Noticias y novedades» | «Noticias y vida seminarista» |
| «vida académica e institucional» | «comunidad de formación del SEM» |

#### CONTACTO (`contacto/page.tsx`, `page-defaults.ts`)

| Antes | Después |
| --- | --- |
| «información académica o consultas generales» | «orientación vocacional o consultas sobre la formación ministerial» |
| «¿Cómo podemos ayudarte?» | «¿Cómo podemos acompañarte?» |

### Textos pendientes (CMS en producción / admin)

Los siguientes términos permanecen en **paneles de administración** y no afectan al visitante público:

- Categoría CMS «Contenido» en registry de bloques (nombre técnico interno)
- Labels admin: «Contenido», «Biblioteca multimedia corporativa»
- `asset-paths.ts` comentario «plataforma» (código, no UI pública)

---

## 2. Auditoría fotográfica

### Inventario de assets actuales

| Asset | Ubicación | Clasificación | Propuesta de reemplazo |
| --- | --- | --- | --- |
| `hero-institutional.svg` | `/images/` | **Mantener** | Ilustración institucional SEM — coherente con identidad |
| `logo-sem.svg`, `logo-ipn.svg`, isotipos | `/images/` | **Mantener** | Marca oficial |
| `gallery-1.svg` | `/images/` | **Reemplazar** | Foto: capilla / oración comunitaria |
| `gallery-2.svg` | `/images/` | **Reemplazar** | Foto: aula con estudio bíblico |
| `gallery-3.svg` | `/images/` | **Reemplazar** | Foto: biblioteca / estanterías teológicas |
| `gallery-4.svg` | `/images/` | **Reemplazar** | Foto: comunidad seminarista / discipulado |
| `online-pastoral.jpg` | `/images/demo/programs/` | **Reemplazar** | **Archivo ausente** — Biblia abierta + docente en contexto pastoral |
| `online-pastors.jpg` | `/images/demo/programs/` | **Reemplazar** | **Archivo ausente** — Grupo en estudio bíblico |
| `online-brothers.jpg` | `/images/demo/programs/` | **Reemplazar** | **Archivo ausente** — Seminaristas tomando notas con Escrituras |
| `online-admission.jpg` | `/images/demo/programs/` | **Reemplazar** | **Archivo ausente** — Ceremonia / comunidad de admisión |
| `hero-online.jpg` | `/images/demo/programs/` | **Reemplazar** | **Archivo ausente** — Estudiante con Biblia (no laptop como protagonista) |
| `hero-premium-student.jpg` | Referenciado en asset-paths | **Reemplazar** | **Archivo ausente** — Retrato editorial seminarista |

### Criterio de reemplazo unificado

Todas las fotografías de reemplazo deben cumplir [§4–5 de EDITORIAL-ART-DIRECTION.md](../design/EDITORIAL-ART-DIRECTION.md):

- Temperatura cálida-neutra, saturación contenida
- Biblia o contexto teológico visible
- Evitar: coworking, stock genérico, tecnología como protagonista

### Línea editorial propuesta

Serie fotográfica «Formación SEM» con 6 escenas: estudio bíblico individual, mesa de discipulado, biblioteca, oración grupal, aula docente, graduación. Preset de color único documentado en Fase 2.

**Actualización OT-MEDIA-SEM-001:** biblioteca oficial en `public/media/` con 21 assets catalogados. Ver [PHOTO-AUDIT.md](./PHOTO-AUDIT.md) y [PHOTOGRAPHY-GUIDE.md](../design/PHOTOGRAPHY-GUIDE.md).

---

## 3. Auditoría de componentes

Componentes que **visualmente** pueden percibirse como SaaS / marketplace y requieren variante editorial (Fase 3 — sin duplicar componentes):

| Componente | Ubicación | Percepción actual | Variante editorial propuesta |
| --- | --- | --- | --- |
| `PortalFeatureGrid` / `FeatureGridBlockSection` | Home (si activo) | Grid de «features» tipo producto | Overline «Vocación», cards como tarjetas editoriales |
| `HeroFeatures` / `hero-premium__features` | Hero | Lista de beneficios tipo landing SaaS | Renombrar a «Beneficios formativos»; tipografía editorial (Fase 3) |
| `PortalCatalogCard` | Programas | Card estilo marketplace | Variante `editorial` con más aire, badge generación (Fase 3) |
| `SeminariosCarousel` | Home seminarios | Carrusel tipo catálogo de cursos | Tratamiento «Formación continua» con meta ministerial |
| `PortalCTAPremium` + stats | Home CTA | Métricas tipo startup | Stats con lenguaje pastoral (ya parcialmente aplicado) |
| `PortalTimeline` | Ruta formativa | Timeline tipo workflow | Ya usa «Ruta formativa» — refinar iconografía (Fase 3) |
| `ResourceCard` | Recursos destacados | Cards tipo blog/marketing | Badge tipo material formativo, menos aspecto widget |
| `ProgramsListClient` filtros | `/programas` | Pills tipo e-commerce | Mantener funcionalidad; copy ya institucional |
| `StatsInstitution` | Stats bloque | Números tipo landing comercial | Enfocar en trayectoria ministerial, no conversión |

**Nota:** En Fase 1 solo se actualizó copy. Las variantes visuales editoriales se implementan en Fase 3 sin forks paralelos.

---

## 4. Biblioteca editorial gráfica

**Estado:** ✅ Completada en OT-EDITORIAL-ASSETS-001

Estructura y catálogo completo en [`docs/design/EDITORIAL-ASSETS.md`](../design/EDITORIAL-ASSETS.md).

```
public/editorial/
├── patterns/        (15)
├── textures/        (10)
├── gradients/       (5)
├── overlays/        (6)
├── dividers/        (5)
├── seals/           (18)
├── icons/           (10)
├── backgrounds/     (6)
└── illustrations/   (6)
```

Integración: `src/styles/editorial-assets.css`, `src/lib/editorial/assets.ts`, `npm run generate:editorial`.

Assets SVG/CSS poblados. Aplicación visual en componentes (hero, footer) → Fases 2–3.

---

## 5. Test de identidad ministerial por página

| Página | Biblia | Servicio | Comunidad | Formación | Misión | ¿Parece LMS? |
| --- | --- | --- | --- | --- | --- | --- |
| Home | Contextual | ✅ | ✅ | ✅ | ✅ | ⚠️ Parcial — hero pendiente Fase 2 |
| Programas | ✅ | ✅ | — | ✅ | ✅ | ⚠️ Cards catálogo — Fase 3 |
| Equipo | — | ✅ | ✅ | ✅ | ✅ | ✅ No |
| Biblioteca | ✅ | — | — | ✅ | — | ✅ No |
| Noticias | — | — | ✅ | ✅ | ✅ | ✅ No |
| Contacto | — | ✅ | ✅ | ✅ | ✅ | ✅ No |

---

## 6. Pendientes — fases siguientes

| Fase | Alcance | Estado |
| --- | --- | --- |
| **Fase 2** | Gradientes institucionales (`--gradient-*`), hero editorial, footer refinado, guía fotográfica con preset | ⚪ Pendiente |
| **Fase 3** | Variantes editoriales de cards, timeline, microdetalles (versículos, sellos, divisores) | ⚪ Pendiente |
| **Fase 4** | Sustitución física de fotografías en Media Library, Visual QA checklist §15 en CI | ⚪ Pendiente |

### Explícitamente no modificado en Fase 1

- Gradientes globales
- Hero (componente y tratamiento visual)
- Footer (componente y tratamiento visual)
- Animaciones
- Layouts
- Tokens de color
- Rutas existentes
- Funcionalidades

---

## 7. Archivos modificados

| Archivo | Tipo de cambio |
| --- | --- |
| `src/lib/cms/home-portal-001.ts` | Copy institucional home |
| `src/lib/cms/page-defaults.ts` | Defaults CMS y seed blocks |
| `src/lib/portal/institutional-demo.ts` | Demo/fallback copy |
| `src/lib/portal/sem-why-study-content.ts` | Showcase experiencia aprendizaje |
| `src/lib/content/seed.ts` | Roles docentes, campus virtual |
| `src/lib/portal/content.ts` | `fetchLibrary()` |
| `src/app/(site)/biblioteca/page.tsx` | **Nueva** página biblioteca |
| `src/app/(site)/programas/page.tsx` | Metadata editorial |
| `src/app/(site)/equipo/page.tsx` | Copy y secciones |
| `src/app/(site)/noticias/page.tsx` | Copy institucional |
| `src/app/(site)/contacto/page.tsx` | Copy pastoral |
| `src/components/portal/ProgramsPageContent.tsx` | Título programas formativos |
| `src/components/portal/ecosystem/EcosystemSectionContent.tsx` | Empty state material formativo |
| `src/components/portal/cards/LibraryCard.tsx` | CTA «Consultar recurso» |
| `public/editorial/**` | Estructura biblioteca gráfica |

---

## 8. Verificación

```bash
npm run check:branding   # 0 incidencias requerido
npm run build            # Sin errores requerido
```

---

*Auditoría generada como entregable de OT-PORTAL-003 Fase 1. Toda pantalla pública debe cumplir [EDITORIAL-ART-DIRECTION.md](../design/EDITORIAL-ART-DIRECTION.md) además del Experience Kit.*
