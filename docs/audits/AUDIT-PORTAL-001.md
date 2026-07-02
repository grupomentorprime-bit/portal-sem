# AUDIT-PORTAL-001 — Home Institucional Definitivo

| Atributo | Valor |
| --- | --- |
| Código | OT-PORTAL-001 |
| Dependencia | EP-000 ✅ |
| Fecha | 2026-07-01 |
| Alcance | Home pública `/` — narrativa de captación |

---

## Resumen ejecutivo

OT-PORTAL-001 entrega el home institucional del SEM como **recorrido narrativo continuo** de nueve bloques CMS más footer global. Se introduce el bloque `audience_profiles`, se unifica metodología en flujo visual de seis pasos y se fija contenido canónico con migración automática al cargar la home.

---

## Verificación de secciones

| # | Sección | Bloque | Resultado |
| --- | --- | --- | --- |
| 01 | Hero | `hero` | ✅ Mensaje, CTA, trust indicators |
| 02 | Programas destacados | `academic_offer` | ✅ Grid premium Content Engine |
| 03 | ¿Este seminario es para ti? | `audience_profiles` | ✅ 5 perfiles visuales |
| 04 | Metodología | `modality` | ✅ 6 pasos iconográficos |
| 05 | Equipo académico | `people` | ✅ Foto, cargo, descripción |
| 06 | Testimonios | `testimonials` | ✅ 4 con generación + iglesia |
| 07 | Ruta de admisión | `admission_process` | ✅ Timeline 5 pasos |
| 08 | FAQ | `faq` | ✅ 5 preguntas canónicas |
| 09 | CTA final | `cta_premium` | ✅ Enfoque distinto al hero |
| 10 | Footer | `footer_premium` | ✅ Contacto, legal, enlaces institucionales |

---

## Validación técnica

```bash
npm run check:branding   # ✓ 0 incidencias (755 archivos)
npm run build            # ✓ passed
```

| Verificación | Estado |
| --- | --- |
| Registry bloque `audience_profiles` | ✅ |
| Migración `applyPortal001HomeMigration` | ✅ Runtime en `loadHomePage` |
| Seed template `buildPortal001HomeBlocks` | ✅ |
| TypeScript estricto | ✅ |
| Branding estricto | ✅ |

---

## CMS y contenido

| Área | Administrable | Notas |
| --- | --- | --- |
| Hero | ✅ | Settings en Page Builder |
| Programas | ✅ | Query `academy_programs` |
| Perfil postulante | ✅ | `audience_profiles.settings` |
| Metodología | ✅ | Items en bloque `modality` |
| Equipo | ✅ | Query `academy_teachers` |
| Testimonios | ✅ | Query `academy_testimonials` + campo `program` |
| Admisión | ✅ | Steps en `admission_process` |
| FAQ | ✅ | Items en bloque `faq` |
| CTA final | ✅ | `cta_premium` settings |
| Footer | ✅ | Config sitio + menús |

Fallbacks demo (`institutional-demo.ts`) solo cuando el CMS no tiene ítems publicados.

---

## Calidad UX / rendimiento (criterios aprobados)

| Criterio | Estado | Método |
| --- | --- | --- |
| Responsive 390–1920 px | 🟡 Pendiente QA manual | DevTools breakpoints |
| Lighthouse ≥ 95 (4 categorías) | 🟡 Pendiente QA manual | Chrome Lighthouse en `/` producción |
| WCAG AA | 🟡 Pendiente QA manual | axe / contraste DS |
| CLS imperceptible | 🟡 Pendiente QA manual | Lighthouse + observación visual |
| Imágenes optimizadas / lazy | ✅ | Patrones existentes portal + `next/image` donde aplica |

> Los criterios Lighthouse y WCAG requieren verificación en entorno desplegado con assets reales. La implementación sigue patrones del Experience Kit y ACCESSIBILITY.md.

---

## Procedimiento QA recomendado

1. `npm run dev` → abrir `http://localhost:3000/`
2. Verificar orden de secciones y CTAs a `/admision`
3. Probar 390 px, 768 px, 1920 px — sin scroll horizontal
4. Chrome DevTools → Lighthouse (Mobile + Desktop) — objetivo ≥ 95
5. Extensión axe — sin violaciones críticas AA
6. Admin → Pages → Home — editar copy de un bloque y confirmar reflejo en público

---

## Conclusión

El home cumple el alcance funcional y técnico de OT-PORTAL-001. Queda como **referencia de calidad** para EP-001. La verificación Lighthouse/WCAG en producción se documenta como paso de cierre operativo antes del go-live definitivo.

---

## Referencias

- OT: [OT-PORTAL-001](../ot/OT-PORTAL-001.md)
- Épica: [EP-001](../strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)
- Migración: `src/lib/cms/home-portal-001.ts`
