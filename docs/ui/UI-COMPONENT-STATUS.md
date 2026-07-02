# UI Component Status — Home Portal SEM

Registro oficial de componentes visuales y su estado de bloqueo (OT-ARCH-UX-001).  
**Dirección de arte v2:** [HOME-PREMIUM-v2-ART-DIRECTION.md](../design/HOME-PREMIUM-v2-ART-DIRECTION.md) (OT-DESIGN-HOME-001)

## Narrativa Home v2

| Acto | Componente | Pregunta emocional | Versión | Estado |
| --- | --- | --- | --- | --- |
| 1 | Hero | Inspirar | v1 | **LOCKED** |
| 2 | Programas | ¿Qué puedes estudiar? | v2 | IN DEVELOPMENT |
| 3 | Vocación | ¿Por qué hacerlo? | v2 | PENDING |
| 4 | Ruta Formativa | ¿Cómo crecerás? | v2 | PENDING |
| 5 | Docentes | ¿Quién te acompañará? | v2 | PENDING |
| 6 | Comunidad | Vida e historias | v2 | PLANNED |
| 7 | Noticias | Revista institucional | v2 | PENDING |
| 8 | CTA | Cierre emocional | v2 | PENDING |
| 9 | Contacto | Cercanía | v2 | PENDING |
| — | Header | Navegación | v1 | **LOCKED** |
| — | Footer | Institucional | v1 | **LOCKED** |

## Registro técnico

| Componente | `data-block` | Stylesheet | Versión | Estado | Unlock OT |
| --- | --- | --- | --- | --- | --- |
| Header Premium | — | `globals.css` (header) | v1 | **LOCKED** | OT-UNLOCK-HEADER-001 |
| Hero Premium | `hero` | `hero-premium.css` + `home-premium/hero-home.css` | v1 | **LOCKED** | OT-UNLOCK-HERO-001 |
| Programas | `academic_offer` | `home-premium/programs-home.css` | v2 | IN DEVELOPMENT | — |
| Vocación | `feature_grid` | `home-premium/why-study-home.css` | v2 | PENDING | — |
| Ruta Formativa | `timeline` | `timeline.css` + `home-premium/timeline-home.css` | v2 | PENDING | — |
| Docentes | `people` | `people-grid.css` + `home-premium/teachers-home.css` | v2 | PENDING | — |
| Comunidad | *(planificado)* | — | v2 | PLANNED | — |
| Noticias | `news` | `news-grid.css` + `home-premium/news-home.css` | v2 | PENDING | — |
| CTA Premium | `cta_premium` | `cta-premium.css` + `home-premium/cta-home.css` | v2 | PENDING | — |
| Contacto | `contact_hub` | `contact-hub.css` + `home-premium/contact-home.css` | v2 | PENDING | — |
| Footer Premium | — | `footer-premium.css` + `home-premium/footer-home.css` | v1 | **LOCKED** | OT-UNLOCK-FOOTER-001 |

## Leyenda

- **LOCKED** — Aprobado. No modificar sin OT de desbloqueo.
- **IN DEVELOPMENT** — Implementación v2 en curso (requiere Fase 1 aprobada).
- **PENDING** — Pendiente de diseño v2 (Fase 1).
- **PLANNED** — Bloque narrativo definido; arquitectura CMS por definir.

## Metodología v2 (OT-DESIGN-HOME-001)

1. **Fase 1 — Diseño:** mockup/captura aprobada (1920 / 1366 / 1024 / 390)
2. **Fase 2 — Implementación:** código = diseño aprobado, CSS scoped `[data-block]`
3. **Fase 3 — Lock:** componente pasa a LOCKED; cambios futuros con Antes/Después

## Validación obligatoria al cerrar cualquier OT visual

Verificar siempre (aunque la OT no los modifique):

| Breakpoint | Viewport |
| --- | --- |
| Desktop | 1920×1080 |
| Notebook | 1366×768 |
| Tablet | 1024×768 |
| Mobile | 390×844 |

- Header
- Hero
- Footer

## Referencias

- Política: [UI-LOCK-POLICY.md](./UI-LOCK-POLICY.md)
- Arte v2: [HOME-PREMIUM-v2-ART-DIRECTION.md](../design/HOME-PREMIUM-v2-ART-DIRECTION.md)
- Registro en código: `src/lib/ui/ui-lock-registry.ts`
