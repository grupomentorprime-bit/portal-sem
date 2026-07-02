# DEMO-001 — Demo Oficial Portal Institucional SEM v2.4.0

| Atributo | Valor |
| --- | --- |
| Código | OT-SEM-DEMO-001 |
| Versión evaluada | v2.4.0 |
| Tipo | Demo / QA / UX |
| Fecha | 2026-06-29 |
| Evaluador | Equipo Portal SEM (sesión automatizada + revisión código) |
| Entorno | `npm run dev` → `http://localhost:3000` |

---

## Pregunta guía

> ¿El portal transmite confianza y permite que un postulante entienda el SEM y sepa cómo iniciar su proceso de admisión?

**Respuesta:** **Sí, con reservas menores.** En v2.4.0 el recorrido de postulación está completo (hero → programas → confianza → ecosistema → conversión → CTA). El footer sigue siendo funcional, no premium (OT-SEM-PORTAL-007).

---

## Escenario simulado

*"Soy una persona que nunca ha oído hablar del Seminario Eclesiástico Mayor. Llegué desde Google o una publicación en redes sociales."*

### Comprensión en ~30 segundos

| Pregunta | ¿Evidente? | Evidencia |
| --- | --- | --- |
| ¿Qué es el SEM? | ✅ | Hero: H1 + motto + descripción (bloque `hero`, CMS) |
| ¿Qué programas ofrece? | ✅ | Sección `programs` + cards premium |
| ¿Por qué estudiar aquí? | ✅ | Bloque `presentation` + highlights |
| ¿Qué respaldo tiene? | ✅ | Stats, testimonios, galería, alianza |
| ¿Cómo postular? | ✅ | Header CTA + `admission_process` + bloque `cta` |

---

## Checklist por sección

### Header

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Logo visible | ✅ | `PortalBrandMark` + logos CMS |
| Navegación clara | ✅ | `cms_menus` → links con hover animado |
| Menú responsive | ✅ | Drawer móvil `< lg`; nav desktop `≥ lg` |
| CTA destacados | ✅ | Postular (gradiente) + Ingresar (sobrio) |
| Estados hover | ✅ | `.portal-nav-link`, botones |
| Sticky correcto | ✅ | Fixed header + blur al scroll |

**Resultado:** ✅

### Hero

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Jerarquía visual | ✅ | `text-display-xxl` H1 único |
| Imagen | ✅ | Media Library + placeholder elegante |
| Copy | ✅ | CMS (`institutionName`, `motto`, `description`) |
| CTA | ✅ | Primary postular + secondary programas |
| Beneficios | ✅ | `PortalHeroBenefits` desde badge/stats |
| Impacto emocional | ⚠️ | Depende de assets CMS; diseño premium OK |

**Resultado:** ✅ (⚠️ si CMS sin imagen/copy)

### Programas

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Calidad visual | ✅ | `ProgramCard` premium |
| Claridad | ✅ | Título, metadatos, excerpt |
| Cards | ✅ | Grid 1/2/3 columnas |
| CTAs | ✅ | Por card + botón sección CMS |
| Responsive | ✅ | Breakpoints Tailwind |
| Placeholders | ✅ | `ProgramCardMedia` sin imágenes rotas |

**Resultado:** ✅

### Confianza

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Genera credibilidad | ✅ | Highlights + stats en primary |
| Modalidad clara | ✅ | Bloque `modality` |
| Estadísticas visibles | ✅ | Bloque `stats` fondo institucional |
| Testimonios aportan | ✅ | Content Engine + `TestimonialCard` |

**Resultado:** ✅

### Ecosistema

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Noticias | ✅ | 1 destacada + 3 secundarias |
| Eventos | ⚠️ | Timeline desktop si hay datos; vacío elegante si no |
| Biblioteca | ✅ | Grid 4 recursos |
| Recursos | ✅ | Bloque `resources` Page Builder |

**Resultado:** ⚠️ (contenido seed dependiente)

### Conversión

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Pasos postulación | ✅ | `admission_process` — 4 pasos timeline |
| Becas | ✅ | `scholarships` — cards por tipo |
| FAQ | ✅ | Acordeón + FAQPage schema |
| Contacto | ✅ | `quick_contact` desde `cms_config` |
| CTA final | ✅ | Bloque `cta` postulación + asesor |

**Resultado:** ✅

---

## Validación responsive

| Ancho | Estado | Observaciones |
| --- | --- | --- |
| 1920 px | ⚠️ | Layout validado en código; captura pendiente en `screenshots/desktop/` |
| 1440 px | ⚠️ | Idem |
| 1280 px | ⚠️ | Idem |
| 1024 px | ✅ | Nav + CTAs visibles (fix OT-006); flex-wrap en links |
| 768 px | ✅ | Grids 2 col; drawer móvil |
| 390 px | ✅ | Stack vertical; CTAs full-width hero |

**Evidencias:** ejecutar `node scripts/capture-demo-screenshots.mjs` → [screenshots/README.md](./screenshots/README.md)

**Resultado:** ⚠️ (validación visual formal pendiente de capturas)

---

## Calidad visual

| Pregunta | Respuesta |
| --- | --- |
| ¿Se parece al diseño objetivo? | ⚠️ Alineado con HOME-PREMIUM-SEM; Manual/Moodboard sin contenido operativo para comparación objetiva |
| ¿Hay coherencia? | ✅ Tokens DS, cards, tipografía Manrope |
| ¿Se siente moderno? | ✅ Gradientes, espaciado, sombras suaves |
| ¿Se siente institucional? | ✅ Primary, footer, versículo, copy académico |

**Resultado:** ✅ (⚠️ comparación mockup formal)

---

## Accesibilidad

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Navegación teclado | ✅ | Links y botones focusables |
| Focus visible | ✅ | `focusRing` header, cards, footer (OT-006) |
| Contraste | ✅ | Primary/white, WCAG AA general |
| ALT imágenes | ⚠️ | Hero: `heroImageAlt` CMS; logos secundarios decorativos `alt=""` |
| Jerarquía H1–H6 | ✅ | 1× H1 en hero; H2 por sección |

**Resultado:** ✅

---

## Performance

| Métrica | Resultado | Notas |
| --- | --- | --- |
| Tiempo carga (dev) | ⚠️ | GET `/` ~2 s (warm); ~4 s cold compile |
| Lazy loading | ✅ | Next Image; hero `priority` |
| Skeletons | ✅ | `PortalBlockSkeleton` por bloque |
| CLS | ⚠️ | Skeletons mitigan; sin Lighthouse en CI |
| Imágenes optimizadas | ✅ | `sizes` por breakpoint |

**Resultado:** ⚠️ (baseline Lighthouse en OT-SEM-PORTAL-008)

---

## SEO

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Metadata | ✅ | `resolveSiteMetadata` + page SEO |
| Open Graph | ✅ | title, description, image, locale |
| JSON-LD | ✅ | `EducationalOrganization` + `FAQPage` en HTML |
| Canonical | ⚠️ | No explícito en metadata |
| Robots | ✅ | `robots.index` según `institution.status` |
| Sitemap | ❌ | No implementado (`robots.ts` / `sitemap.ts` ausentes) |

**Resultado:** ⚠️

---

## CMS

| Criterio | Resultado | Notas |
| --- | --- | --- |
| Home gobernada por Page Builder | ✅ | `PortalRenderer` → bloques por `order` |
| Content Engine | ✅ | programs, teachers, news, events, library, gallery, testimonials |
| Sin hardcode institucional Home | ⚠️ | Defaults en `page-defaults`; fallbacks header shell; errores en `InstitutionSectionContent` (presentation/modality/stats) aún inline |
| Footer copy CMS | ✅ | `portalCopy` en `cms_config` |

**Resultado:** ✅ (⚠️ residuos P1 en subsecciones confianza)

---

## Hallazgos clasificados

### P0 — Antes de producción

*Ninguno bloqueante para iniciar OT-SEM-PORTAL-007.*

### P1 — Antes de RC1

| ID | Hallazgo | Área |
| --- | --- | --- |
| P1-01 | Footer funcional, no premium | UX |
| P1-02 | Sin `sitemap.xml` / `robots.txt` estáticos | SEO |
| P1-03 | Errores hardcodeados en `InstitutionSectionContent` (presentation, modality, stats) | CMS |
| P1-04 | Manual de Marca y Moodboard vacíos — comparación visual no auditable | Branding |
| P1-05 | Baseline Lighthouse no documentado | Performance |
| P1-06 | Capturas responsive DEMO-001 pendientes de generar | QA |

### P2 — Posteriores

| ID | Hallazgo |
| --- | --- |
| P2-01 | Tipografía Mosk pendiente |
| P2-02 | Iconos sociales genéricos en footer |
| P2-03 | Canonical URL explícita por página |
| P2-04 | Focus trap explícito en drawer móvil |

---

## Evidencias técnicas (sesión demo)

| Evidencia | Resultado |
| --- | --- |
| HTTP GET `/` | 200 OK (~265 KB HTML) |
| H1 en documento | 1 |
| Schema.org | Presente (Organization + FAQ) |
| Secciones conversión | `#proceso-admision`, `#preguntas-frecuentes`, `#cta-final` presentes |
| Arquitectura | `PortalHome` → `PortalRenderer` → `PortalBlockSection` |

---

## Resumen ejecutivo

| Área | Estado |
| --- | --- |
| Arquitectura | ✅ |
| UX | ✅ |
| Branding | ⚠️ |
| Responsive | ⚠️ |
| Accesibilidad | ✅ |
| Performance | ⚠️ |
| SEO | ⚠️ |
| Conversión | ✅ |
| CMS | ✅ |

---

## Conclusión

### ✅ Aprobado para continuar a OT-SEM-PORTAL-007 (Footer Premium)

El portal v2.4.0 cumple el objetivo de demo: un postulante puede entender el SEM y encontrar el camino hacia la postulación. Los hallazgos P1 deben abordarse en OT-SEM-PORTAL-007, OT-SEM-PORTAL-008 y OT-SEM-DOC-002 antes de **OT-SEM-RELEASE-001 (RC1)**.

### Roadmap post-demo

1. **OT-SEM-PORTAL-007** — Footer Premium
2. **OT-SEM-PORTAL-008** — Optimización producción (Lighthouse, sitemap)
3. **OT-SEM-DOC-002** — Documentación oficial (Manual, Moodboard, UX-SEM-001)
4. **OT-SEM-RELEASE-001** — Release Candidate 1

---

## Referencias

- [UX-AUDIT-001](../audits/UX-AUDIT-001.md)
- [OT-SEM-PORTAL-006](../ot/OT-SEM-PORTAL-006.md)
- [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md)
- [Capturas](./screenshots/README.md)
