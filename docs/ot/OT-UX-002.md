# OT-UX-002 — Home Experience Premium (Fase 1)

| Atributo | Valor |
| --- | --- |
| OT | OT-UX-002 |
| Épica | EP-UX-002 — Home Experience Premium |
| Prioridad | Crítica |
| Estado | ✅ Completada |
| Tipo | UX / Contenido / Experiencia |

## Objetivo

Eliminar la sensación de "portal en construcción" en la Home del SEM mediante contenido institucional demo y fallbacks automáticos, sin modificar arquitectura ni Experience Kit.

## Implementación

### Fallbacks automáticos (Home)

Archivo: `src/lib/portal/institutional-demo.ts`

Cuando la Home (`/`) no tiene contenido CMS, se muestran datos institucionales demo:

| Sección | Contenido demo |
| --- | --- |
| Oferta Académica | Licenciatura en Teología, Diplomado Liderazgo, Curso Defiende tu Fe |
| Feature Grid | 4 pilares institucionales |
| Ruta Formativa | Vocación → Formación Bíblica → Práctica Ministerial → Servicio Cristiano |
| Equipo Docente | 4 perfiles (González, Cuevas, Cisterna, Lara) |
| Noticias | 3 noticias institucionales |
| CTA Premium | Stats + imagen + copy institucional |
| Contacto | WhatsApp, email, dirección, horario, redes |

### Seed MongoDB

- `ensureHomeInstitutionalContent()` en `PortalHome` — seed automático si `academy_programs` está vacío
- `src/lib/content/seed.ts` actualizado con contenido OT-UX-002

### Block sections

Fallbacks aplicados en (solo Home vía `pageSlug`):

- `AcademicOfferBlockSection`
- `FeatureGridBlockSection`
- `TimelineBlockSection`
- `PeopleBlockSection`
- `NewsBlockSection`
- `CtaPremiumBlockSection`

Contacto enriquecido vía `enrichPortalContextForHome()` en `PortalHome`.

## Criterios de aceptación

- [x] Desaparecen estados vacíos en Home
- [x] Contenido institucional visible en todas las secciones
- [x] Sin cajas "en preparación" en Home
- [x] Arquitectura y Experience Kit intactos
- [x] TypeScript sin errores

## Referencias

- [OT-UX-001](./OT-UX-001.md) — Composición visual Home Premium
- [EP-UX-001](../ux/EP-UX-001-PORTAL-EXPERIENCE-DESIGN.md)
