# UX-AUDIT-001 — Auditoría Integral UX/UI del Portal Institucional SEM

| Atributo | Valor |
| --- | --- |
| Código | OT-SEM-UX-AUDIT-001 |
| Versión | 1.0 |
| Prioridad | Crítica |
| Tipo | Auditoría de Producto |
| Estado | Completada |
| Fecha | 2026-06-29 |
| Alcance | Home pública v2.3.0 (Header, Hero, Programas, Confianza, Ecosistema Académico) |

---

## Resumen ejecutivo

El Portal Institucional SEM ha alcanzado un nivel **premium sólido** en las fases OT-SEM-PORTAL-001 a 005: arquitectura Content Engine respetada en la mayoría de secciones, Design System aplicado con tokens centralizados, componentes reutilizables y estados loading/empty/error consistentes.

La auditoría identifica **brechas de producto** antes de Conversión, Footer Premium y Producción: documentación de referencia incompleta (Manual de Marca, Moodboard, UX-SEM-001), desalineación del storytelling en Home (sección Equipo y Alianza fuera de secuencia), textos UI hardcodeados, detalles de accesibilidad en imágenes y navegación en breakpoint intermedio, y un bug visual en la timeline de eventos.

**Veredicto general:** apto para continuar el roadmap con mejoras priorizadas; no bloqueante para OT-SEM-PORTAL-006, pero sí recomendable resolver hallazgos críticos de storytelling y accesibilidad en paralelo o dentro de las próximas OTs.

---

## Matriz de auditoría

| Área | Estado | Observaciones | Prioridad |
| --- | --- | --- | --- |
| Branding | 🟡 | Tokens y paleta DS correctos; Manual de Marca y Moodboard sin contenido operativo; tipografía Mosk pendiente; logos decorativos con `alt=""` aceptable solo si hay texto adyacente | Media |
| Header | 🟡 | Premium funcional; nav principal oculta entre 1024–1279 px mientras CTAs sí aparecen (lg vs xl); fallbacks «Ingresar» / «Postular ahora» hardcodeados | Alta |
| Hero | 🟡 | H1 y copy desde CMS; imagen hero con `alt` vacío por defecto; beneficios pueden caer en stats del bloque CMS como fallback opaco | Media |
| Programas | 🟢 | Patrón arquitectónico de referencia: `ProgramsSection` → `resolveBlockContent` → cards premium | — |
| Confianza | 🟢 | 6 subsecciones CMS; galería cumple rol de «vida académica»; estados y cards premium coherentes | — |
| Ecosistema | 🟡 | 4 subsecciones dinámicas; CTAs de tarjetas hardcodeados («Leer más», «Ver evento»); timeline desktop con clases CSS desalineadas (`eco-event-*` vs `eco-events-*`); mobile noticias en lista vertical (aceptable, no carrusel) | Alta |
| Responsive | 🟡 | Grids y contenedores correctos en breakpoints estándar; gap de navegación 1024–1280 px; validación visual en 1920/1440 no automatizada | Media |
| Accesibilidad | 🟡 | `focusRing` en header/cards; `<main>` presente; footer sin focus visible en enlaces; hero/testimonial/logo secundario con `alt` vacío; mobile drawer sin focus trap explícito | Alta |
| Performance | 🟡 | Hero `priority` OK para LCP; Suspense + skeletons; sin métricas Lighthouse en repo; imágenes Next.js con sizes razonables | Media |
| CMS | 🟡 | Mayoría vía Content Engine; sección Equipo usa `fetchTeam` directo en `PortalHome` (no bloque `teachers` + `resolveBlockContent`); empty states y labels UI hardcodeados | Alta |
| Arquitectura | 🟡 | Sin Mongo en componentes portal; `PortalHome` mezcla orquestación declarativa (sections) con secciones inline (Equipo, Alianza); orden Home no sigue plantilla CMS | Media |

**Leyenda:** 🟢 Conforme · 🟡 Mejorable · 🔴 Crítico

---

## 1. Identidad de Marca

### Fortalezas

- Paleta institucional aplicada vía tokens CSS (`--primary`, `--secondary`, `--accent`) alineada con [DESIGN-SYSTEM.md](../design/DESIGN-SYSTEM.md).
- Logos desde `cms_config.branding` y Media Library (`PortalBrandMark`, header, footer).
- Tipografía Manrope con escala institucional (`text-display-xxl`, `text-display-l`, `text-body`, `text-caption`).
- Footer en color primary refuerza identidad institucional.

### Hallazgos

| ID | Hallazgo | Evidencia |
| --- | --- | --- |
| BR-01 | Manual de Marca y Moodboard son placeholders sin criterios verificables | `docs/design/MANUAL-DE-MARCA.md`, `docs/design/MOODBOARD.md` |
| BR-02 | Tipografía Mosk (objetivo de marca) no integrada | DESIGN-SYSTEM.md § Tipografía |
| BR-03 | Colores de marca configurables en CMS pueden desviarse del manual si no hay validación | `layout.tsx` inyecta `--brand-*` desde config |
| BR-04 | Imagen hero institucional sin texto alternativo descriptivo | `PortalHeroMedia.tsx` — `alt` default `""` |

### Recomendaciones

- Completar Manual de Marca y Moodboard con reglas verificables (OT documental).
- Añadir campo `heroImageAlt` en bloque hero o Media Library metadata.
- Validar contraste cuando se personalicen colores desde CMS.

---

## 2. Moodboard

### Fortalezas

- Sensación «universidad moderna + institución seria» coherente con [HOME-PREMIUM-SEM.md](../ux/HOME-PREMIUM-SEM.md): espaciado generoso, cards con sombras suaves, gradientes institucionales en hero y CTAs.
- Placeholders elegantes cuando faltan imágenes (hero, programas, cards ecosystem).
- Secciones alternas (`muted`) crean ritmo visual.

### Hallazgos

| ID | Hallazgo | Impacto |
| --- | --- | --- |
| MB-01 | Sin moodboard visual en repo para comparación objetiva | Riesgo de deriva subjetiva en futuras OTs |
| MB-02 | Footer funcional pero no «premium» vs mockup esperado | Percepción de cierre débil |
| MB-03 | Bloque Alianza institucional visualmente más simple que el resto | Rompe uniformidad premium |

### Recomendaciones

- Incorporar referencias visuales al Moodboard (capturas o Figma).
- OT-SEM-PORTAL-007 — Footer Premium.

---

## 3. UX — Recorrido del visitante

| Pregunta | ¿Evidente? | Dónde responde | Gap |
| --- | --- | --- | --- |
| ¿Qué es el SEM? | Parcial | Hero (nombre, motto, descripción presentation) | Depende 100 % de configuración CMS |
| ¿Qué ofrece? | Sí | Programas + highlights confianza | — |
| ¿Por qué confiar? | Sí | InstitutionSection (6 bloques) | — |
| ¿Qué puedo estudiar? | Sí | Programas + enlace `/programas` | CTA secundario hero puede no apuntar a programas si CMS incompleto |
| ¿Cómo postulo? | Parcial | Header «Postular», hero primary, CTA final | CTA final puede ocultarse si bloque `cta` vacío; fallback «Contacto» genérico |

### Fortalezas

- Múltiples puntos de conversión (header, hero, CTA final).
- Navegación principal desde `cms_menus`.
- Breadcrumbs en páginas internas.

### Hallazgos

| ID | Hallazgo |
| --- | --- |
| UX-01 | Sección Equipo interrumpe flujo entre Confianza y Ecosistema |
| UX-02 | CTA final con fallback «Contacto» si no hay bloque `cta` configurado |
| UX-03 | Sin ancla clara «Postular» en ecosystem; conversión concentrada arriba/abajo |

---

## 4. Storytelling — Orden de secciones

### Secuencia esperada (OT)

```text
Hero → Programas → Confianza → Vida Académica → Noticias → Eventos → Biblioteca → Recursos → Postulación → Footer
```

### Secuencia implementada (`PortalHome.tsx`)

```text
Hero (+ Benefits)
→ Programas
→ Confianza (incluye Galería = Vida estudiantil)
→ Equipo docente          ← fuera de secuencia esperada
→ Ecosistema (Noticias, Eventos, Biblioteca, Recursos)
→ Alianza institucional   ← no contemplada en storytelling
→ CTA final
→ Footer (PortalShell)
```

### Análisis

| Elemento | Estado |
| --- | --- |
| Hero | ✅ |
| Programas | ✅ |
| Confianza | ✅ |
| Vida Académica | ✅ dentro de `InstitutionSection` (gallery) |
| Noticias / Eventos / Biblioteca / Recursos | ✅ en `AcademicEcosystemSection` |
| Postulación | 🟡 CTA final parcial; header/hero complementan |
| Footer | 🟡 Existe; pendiente premium (OT-007) |

| ID | Hallazgo | Prioridad |
| --- | --- | --- |
| ST-01 | `PortalHome` no respeta orden de bloques de plantilla CMS (`home` template) | Alta |
| ST-02 | Sección Equipo hardcodeada en Home; bloque `teachers` no está en plantilla home | Alta |
| ST-03 | Alianza institucional no documentada en storytelling oficial | Baja |

### Recomendación

Unificar orden Home con Page Builder: mover Equipo a bloque `teachers` en plantilla o posicionarlo post-ecosystem según decisión de producto; eliminar lógica inline en `PortalHome`.

---

## 5. Design System

### Fortalezas

- Tokens centralizados en `globals.css` y `src/design/`.
- Componentes base en `src/components/ui/` (`Button`, `Badge`, inputs).
- `focusRing` compartido en componentes interactivos del portal.
- Cards premium unificadas (`PortalCard`, `ProgramCard`, `NewsCard`, etc.).
- Iconografía Lucide con tamaños desde `@/design`.

### Hallazgos

| ID | Hallazgo | Ubicación |
| --- | --- | --- |
| DS-01 | Estilos portal-specific fuera de `ui/` (`portal-btn-apply`, `eco-*`, `trust-*`) — aceptable como capa institucional pero no catalogados en design-system page | `globals.css` |
| DS-02 | CTAs de cards con `<span>` estilizado en lugar de componente `Button` | `NewsCard`, `EventCard`, `LibraryCard` |
| DS-03 | Footer links sin `focusRing` | `PortalFooter.tsx` |
| DS-04 | Redes sociales usan icono genérico `Share2` para todas las plataformas | `PortalFooter.tsx` |

### Recomendación

Documentar capa «portal premium» en Design System; unificar CTAs de cards con variante link del DS.

---

## 6. Responsive

### Breakpoints evaluados (código + clases Tailwind)

| Ancho | Header | Hero | Programas | Confianza | Ecosistema |
| --- | --- | --- | --- | --- | --- |
| 1920 px | ✅ max-width 1400 | ✅ layout 42/58 | ✅ grid 3 col | ✅ grids adaptativos | ✅ 1+3 noticias, timeline |
| 1440 px | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1280 px | ✅ nav visible (xl) | ✅ | ✅ | ✅ | ✅ |
| 1024 px | 🟡 nav oculta, CTAs visibles | ✅ stack | ✅ 2–3 col | ✅ | ✅ timeline activa |
| 768 px | ✅ drawer | ✅ | ✅ 2 col | ✅ | ✅ cards eventos |
| 390 px | ✅ drawer | ✅ | ✅ 1 col | ✅ | ✅ lista vertical noticias |

| ID | Hallazgo | Prioridad |
| --- | --- | --- |
| RS-01 | Entre 1024–1279 px: CTAs visibles pero navegación principal oculta hasta `xl` (1280) | Alta |
| RS-02 | Noticias mobile: lista vertical (spec permitía carrusel); densidad alta con 4 ítems | Baja |

---

## 7. Accesibilidad (objetivo WCAG AA)

### Fortalezas

- `lang="es"` en `<html>`.
- Landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`.
- Un solo `<h1>` en hero.
- Skeletons con `aria-busy` donde corresponde.
- TestimonialCard con `role="img"` y `aria-label` en rating.
- Contraste general favorable (texto primary sobre fondos claros; footer inverse).

### Hallazgos

| ID | Hallazgo | WCAG | Prioridad |
| --- | --- | --- | --- |
| A11Y-01 | Hero image `alt=""` cuando hay imagen significativa | 1.1.1 | Alta |
| A11Y-02 | Logo secundario IPN `alt=""` en header/footer | 1.1.1 | Media |
| A11Y-03 | Footer enlaces sin indicador focus visible | 2.4.7 | Media |
| A11Y-04 | Mobile nav dialog sin focus trap documentado | 2.4.3 | Media |
| A11Y-05 | Fechas en `<time>` sin atributo `dateTime` ISO | 1.3.1 | Baja |
| A11Y-06 | CTAs «Leer más» / «Ver evento» repetidos sin contexto en aria | 2.4.4 | Baja |

---

## 8. Performance

### Fortalezas

- `PortalHeroMedia` con `priority` para LCP.
- `Suspense` en Programas, Confianza y Ecosistema.
- Skeletons evitan layout shift parcial.
- Next.js `Image` con `sizes` por breakpoint.
- Cards secundarias sin `priority` (lazy implícito).

### Hallazgos

| ID | Hallazgo | Prioridad |
| --- | --- | --- |
| PF-01 | Sin baseline Lighthouse en CI ni documentación de métricas | Media |
| PF-02 | Múltiples secciones async en Home pueden acumular TTFB en cold start | Media |
| PF-03 | Sin `loading="lazy"` explícito en galería (Next Image lo gestiona) | Baja |

### Recomendación

OT-SEM-PORTAL-008 — establecer budget LCP < 2.5 s, CLS < 0.1, INP < 200 ms en entorno productivo.

---

## 9. CMS — Contenido dinámico

### Fortalezas

| Sección | Patrón | Colección / fuente |
| --- | --- | --- |
| Header / Footer | `getPortalContext` | `cms_config`, `cms_menus` |
| Hero | Bloque `hero` + presentation | CMS + Media Library |
| Programas | `resolveBlockContent` | `academy_programs` |
| Confianza | Bloques + Content Engine | `academy_gallery`, `academy_testimonials`, inline stats |
| Ecosistema | `resolveBlockContent` | `content_news`, `content_events`, `content_library` |
| Recursos destacados | Bloque `resources` | Page Builder `items[]` |

### Hallazgos

| ID | Hallazgo | Tipo |
| --- | --- | --- |
| CMS-01 | Sección Equipo en `PortalHome` llama `fetchTeam()` directamente, no usa bloque `teachers` ni `resolveBlockContent` | Bypass de patrón |
| CMS-02 | Empty states, mensajes de error y CTAs de cards en español hardcodeado | Texto UI |
| CMS-03 | Fallbacks header: «Ingresar», «Postular ahora», «Contacto» | Texto UI |
| CMS-04 | Footer: título «Contacto», link «Administración» hardcodeados | Texto UI |
| CMS-05 | Bloque `teachers` registrado en Page Builder pero ausente en plantilla `home` | Inconsistencia |

### Nota

`fetchTeam` sí usa Content Engine (`executeContentQuery` → `academy_team`); el hallazgo es de **patrón arquitectónico**, no de acceso directo a MongoDB.

---

## 10. Arquitectura

### Fortalezas

- Componentes portal sin import de `mongodb`.
- Patrón establecido: `*Section` (server) → `*SectionContent` (UI) → `resolveBlockContent`.
- Page Builder grids delegan a componentes portal (sin duplicación mayor).
- Media vía `resolveMediaRef` / `mediaId`.

### Hallazgos

| ID | Hallazgo |
| --- | --- |
| AR-01 | `PortalHome` orquesta secciones fijas + 2 bloques inline (Equipo, Alianza) |
| AR-02 | Orden visual Home ≠ orden bloques plantilla CMS |
| AR-03 | Bug CSS timeline: `EventCard` usa `eco-event-timeline__*` pero estilos en `eco-events-timeline__*` |
| AR-04 | Documentos obligatorios ARQ-003 y UX-SEM-001 sin contenido operativo |

---

## Fortalezas consolidadas

1. **Arquitectura Content Engine madura** en Programas, Confianza y Ecosistema.
2. **Design System aplicado** con tokens, tipografía y componentes base consistentes.
3. **Header premium** con navegación CMS, CTAs diferenciados y mobile drawer.
4. **Estados UX completos** (loading, empty, error) en secciones principales.
5. **Cards premium reutilizables** como referencia para futuras secciones.
6. **SEO preparado** con slugs `/noticias/{slug}`, `/eventos/{slug}`, `/biblioteca/{slug}`.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Deriva visual por Manual/Moodboard vacíos | Alta | Medio | OT documental de marca |
| Conversión débil si CMS incompleto | Media | Alto | OT-SEM-PORTAL-006 con defaults y validación |
| Regresiones responsive en 1024–1280 | Media | Medio | Ajustar breakpoint nav en OT dedicada |
| Timeline eventos sin marcadores visuales | Alta | Bajo | Corregir clases CSS (quick fix) |
| Lighthouse bajo en producción | Media | Medio | OT-SEM-PORTAL-008 |
| Deuda `PortalHome` monolítico | Media | Medio | Refactor hacia renderizado por bloques CMS |

---

## Acciones priorizadas

### P0 — Antes / durante OT-SEM-PORTAL-006 (Conversión)

| # | Acción | Origen | OT sugerida |
| --- | --- | --- | --- |
| 1 | Garantizar CTA postulación visible y configurable en hero + CTA final + bloque dedicado | UX-02, UX-03 | OT-SEM-PORTAL-006 |
| 2 | Corregir clases CSS timeline eventos | AR-03 | Fix en 006 o hotfix |
| 3 | Resolver gap navegación 1024–1279 px | RS-01 | OT-SEM-PORTAL-006 o sub-tarea |

### P1 — OT-SEM-PORTAL-007 (Footer Premium)

| # | Acción | Origen |
| --- | --- | --- |
| 4 | Footer premium alineado a mockup | MB-02 |
| 5 | Focus visible en enlaces footer | A11Y-03 |
| 6 | Iconos sociales por plataforma | DS-04 |
| 7 | Externalizar «Contacto» y links legales 100 % CMS | CMS-04 |

### P2 — OT-SEM-PORTAL-008 (Producción)

| # | Acción | Origen |
| --- | --- | --- |
| 8 | Baseline Lighthouse + budgets | PF-01 |
| 9 | Optimizar cadena Suspense / caching Home | PF-02 |
| 10 | Alt descriptivo hero desde CMS/Media | A11Y-01, BR-04 |

### P3 — Deuda estructural (nueva OT recomendada)

| # | Acción | Origen |
| --- | --- | --- |
| 11 | Migrar Equipo a `TeachersSection` + bloque en plantilla home | CMS-01, ST-02 |
| 12 | `PortalHome` renderice orden desde bloques CMS publicados | ST-01, AR-01 |
| 13 | Completar Manual de Marca, Moodboard, UX-SEM-001, ARQ-003 | BR-01, MB-01 |
| 14 | i18n/CMS para empty states y labels de cards | CMS-02 |
| 15 | Decisión producto: Alianza institucional (mantener/mover/CMS) | ST-03 |

---

## Roadmap actualizado (post-auditoría)

| Fase | OT | Estado | Notas |
| --- | --- | --- | --- |
| Home Premium Fase 1 | OT-SEM-PORTAL-001 → 005 | ✅ Completado | v2.3.0 |
| **Auditoría UX/UI** | **OT-SEM-UX-AUDIT-001** | **✅ Completado** | Este documento |
| Conversión y Postulación | OT-SEM-PORTAL-006 | 📋 Pendiente | P0 de auditoría |
| Footer Premium | OT-SEM-PORTAL-007 | 📋 Pendiente | P1 de auditoría |
| Optimización Producción | OT-SEM-PORTAL-008 | 📋 Pendiente | Lighthouse, perf |
| Refactor Home por bloques CMS | OT-SEM-PORTAL-009 (propuesta) | 📋 Propuesta | P3 — storytelling |
| Portal Engine AprendeHoy | OT-PORTAL-UX-001 | ⏸ Diferida | Fase 2 |

---

## Referencias auditadas

- [HANDBOOK.md](../HANDBOOK.md)
- [ARQ-003.md](../architecture/ARQ-003.md)
- [UX-SEM-001.md](../ux/UX-SEM-001.md)
- [DESIGN-SYSTEM.md](../design/DESIGN-SYSTEM.md)
- [DESIGN-LANGUAGE.md](../design/DESIGN-LANGUAGE.md)
- [MANUAL-DE-MARCA.md](../design/MANUAL-DE-MARCA.md)
- [MOODBOARD.md](../design/MOODBOARD.md)
- [HOME-PREMIUM-SEM.md](../ux/HOME-PREMIUM-SEM.md)
- OT-SEM-PORTAL-001 → 005

---

## Criterios de aceptación

- [x] Auditoría completa de secciones en alcance
- [x] Documento `docs/audits/UX-AUDIT-001.md` incorporado
- [x] Roadmap actualizado
- [x] Lista priorizada de mejoras (P0–P3)
- [x] Sin cambios funcionales en código

---

## Próximas OTs

1. **OT-SEM-PORTAL-006** — Conversión y Postulación
2. **OT-SEM-PORTAL-007** — Footer Premium
3. **OT-SEM-PORTAL-008** — Optimización para Producción
