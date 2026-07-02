# OT-PORTAL-001 — Home Institucional Definitivo

| Atributo | Valor |
| --- | --- |
| OT | OT-PORTAL-001 |
| Épica | [EP-001 — Portal Institucional Premium](../strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md) |
| Prioridad | 🔴 Alta |
| Dependencia | EP-000 ✅ |
| Estado | ✅ Completada |
| Tipo | Producto / Experiencia |
| Versión narrativa | `portal-001` |

---

## Objetivo aprobado

Diseñar e implementar el **Home Institucional definitivo del SEM** como la principal herramienta de captación de postulantes, utilizando exclusivamente el **Experience Kit** establecido en EP-000.

El visitante debe percibir al SEM como una institución consolidada desde el primer minuto. La página comunica, en orden:

1. Quiénes somos  
2. Qué ofrecemos  
3. Por qué confiar en nosotros  
4. Cómo estudiar con nosotros  
5. Cómo postular  

---

## Alcance definitivo — narrativa continua

| # | Sección | Bloque CMS | Estado |
| --- | --- | --- | --- |
| 01 | Hero | `hero` | ✅ Pulido (mensaje, CTA `/admision`, foto, indicadores de confianza) |
| 02 | Programas destacados | `academic_offer` | ✅ Ajustes editoriales; audiencia extraída a bloque propio |
| 03 | ¿Este seminario es para ti? | `audience_profiles` | ✅ Nuevo bloque — 5 criterios visuales |
| 04 | Metodología | `modality` | ✅ Flujo iconográfico (6 pasos) vía `MethodologyHomeExperience` |
| 05 | Equipo académico | `people` | ✅ Tarjetas con foto, cargo y bio (CMS + demo) |
| 06 | Testimonios | `testimonials` | ✅ 4 testimonios con foto, generación e iglesia |
| 07 | Ruta de admisión | `admission_process` | ✅ Timeline Explora → Postula → Evaluación → Matrícula → Inicio |
| 08 | Preguntas frecuentes | `faq` | ✅ 5 preguntas canónicas admisión/formación |
| 09 | CTA final | `cta_premium` | ✅ Cierre distinto al hero, orientado a conversión |
| 10 | Footer institucional | `PortalShell` / `footer_premium` | ✅ Global (contacto, redes, biblioteca, legal, IPN) |

### Fuera de alcance

- CRM / postulación formal (EP-002)
- Campus virtual (EP-003)
- Nuevos tokens o reglas de branding (EP-000 cerrada)
- Noticias y contact hub en la narrativa home (retirados del orden canónico)

---

## Orden narrativo canónico

Definido en `PORTAL_001_HOME_BLOCK_ORDER` (`src/lib/cms/home-portal-001.ts`):

```
hero → academic_offer → audience_profiles → modality → people →
testimonials → admission_process → faq → cta_premium
```

La migración se aplica en `loadHomePage()` para páginas home existentes en CMS.

---

## Criterios de aceptación

| Criterio | Verificación |
| --- | --- |
| Narrativa continua (10 secciones) | QA visual 390 / 768 / 1920 px |
| Solo Experience Kit y tokens SEM | `npm run check:branding` ✅ |
| Build sin errores | `npm run build` ✅ |
| Contenido administrable desde CMS | Bloques + settings en Page Builder; fallbacks demo solo si vacío |
| CTA admisión en hero y cierre | Enlaces a `/admision` |
| Componentes reutilizables | Bloques en registry; experiencias home en `src/components/portal/home/` |
| Lighthouse ≥ 95 (Perf, A11y, BP, SEO) | Auditoría manual — ver [AUDIT-PORTAL-001](../audits/AUDIT-PORTAL-001.md) |
| WCAG AA | Tokens, contraste y patrones DS; revisión manual en audit |
| Sin CLS perceptible | Imágenes con dimensiones / lazy donde aplica |
| Documentación OT + AUDIT + CHANGELOG | ✅ |

---

## Entregables

| Artefacto | Ubicación |
| --- | --- |
| Contenido canónico y migración | `src/lib/cms/home-portal-001.ts` |
| Bloque `audience_profiles` | `src/components/portal/home/audience/` |
| Metodología home | `src/components/portal/home/methodology/` |
| Estilos home premium | `src/styles/home-premium/*.css` |
| Seed / template actualizado | `src/lib/cms/page-defaults.ts`, `templates.ts` |
| Demo fallbacks | `src/lib/portal/institutional-demo.ts` |
| Campo CMS testimonios `program` | `src/types/content.ts` |
| Audit | [AUDIT-PORTAL-001](../audits/AUDIT-PORTAL-001.md) |

---

## Referencias

- Design System: [INTRODUCTION.md](../design/INTRODUCTION.md)
- Checklist PR: [PULL_REQUEST_CHECKLIST.md](../design/PULL_REQUEST_CHECKLIST.md)
- Catálogo: `/internal/design-system`
- Épica: [EP-001](../strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)

---

> Primera OT de producto del portal: establece el estándar de calidad para todas las futuras páginas públicas.
