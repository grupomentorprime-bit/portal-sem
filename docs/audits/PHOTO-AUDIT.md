# Auditoría Fotográfica — SEM

**Código:** OT-MEDIA-SEM-001  
**Fecha:** 2026-07-01  
**Guía:** [PHOTOGRAPHY-GUIDE.md](../design/PHOTOGRAPHY-GUIDE.md)  
**Catálogo:** `public/media/catalog.json`

---

## Resumen

| Estado | Cantidad |
| --- | --- |
| Aprobadas | 4 |
| Provisionales (editorial raster) | 16 |
| Pendientes | 1 |
| Rechazadas (legacy) | 12 |

La biblioteca oficial cuenta con **21 assets catalogados**, optimizados en AVIF/WebP/JPEG y consumibles vía `InstitutionalImage`.

---

## Imágenes aprobadas

Assets listos para uso en producción (`status: approved`).

| ID | Categoría | Título | Sección recomendada |
| --- | --- | --- | --- |
| `background-programs` | backgrounds | Fondo programas formativos | programs |
| `background-equipo` | backgrounds | Fondo equipo docente | equipo |
| `background-biblioteca` | backgrounds | Fondo biblioteca | biblioteca |
| `background-noticias` | backgrounds | Fondo noticias | noticias |

> Nota: fondos derivados de ilustraciones editoriales SEM — coherentes con marca, sustituibles por fotografía cuando exista sesión.

---

## Imágenes provisionales

Placeholders editoriales rasterizados. Aceptados temporalmente hasta sesión fotográfica real (`status: provisional`).

| ID | Categoría | Reemplazo sugerido |
| --- | --- | --- |
| `formation-virtual-classroom` | formation | Seminarista con Biblia en estudio online real |
| `formation-study-session` | formation | Mesa de estudio con libros teológicos |
| `bible-open-scripture` | bible | Biblia abierta luz natural, encuadre horizontal |
| `bible-study-notes` | bible | Manos anotando texto bíblico |
| `bible-personal-reading` | bible | Lectura devocional, vertical |
| `community-fellowship` | community | Diálogo grupal post-jornada |
| `community-group-prayer` | community | Oración en círculo, capilla o aula |
| `community-collaborative` | community | Trabajo en grupo con material bíblico |
| `faculty-teaching` | faculty | **Prioridad alta** — docente SEM real |
| `students-notes` | students | Seminarista tomando apuntes |
| `library-shelves` | library | Estantería biblioteca SEM o teológica |
| `library-books` | library | Primer plano libros de teología |
| `worship-prayer` | worship | Oración individual o grupal |
| `worship-ministry` | worship | Servicio pastoral en contexto real |
| `resources-notebooks` | resources | Cuadernos + Biblia en escritorio |
| `hero-ministerial-call` | hero | **Prioridad crítica** — hero fotográfico con espacio para titular |

---

## Pendientes

| ID | Categoría | Motivo |
| --- | --- | --- |
| `graduation-ceremony` | graduation | Requiere cobertura de ceremonia real; slot reservado |

### Slots sin asset (crear en próxima sesión)

| Subcategoría | Prioridad |
| --- | --- |
| Evaluaciones presenciales | Media |
| Certificados / entrega título | Alta (post-graduación) |
| Oficinas SEM / contacto | Baja |
| Predicación en púlpito | Media |
| Consejería pastoral | Media |
| Evangelización (si aplica) | Baja |

---

## Imágenes rechazadas

No utilizar en portal. Sustituir por asset de `public/media/catalog.json`.

| Asset legacy | Ubicación | Motivo de rechazo | Reemplazo |
| --- | --- | --- | --- |
| `gallery-1.svg` | `/images/` | Ilustración genérica sin narrativa ministerial | `worship-prayer` o sesión capilla |
| `gallery-2.svg` | `/images/` | No comunica formación bíblica | `formation-study-session` |
| `gallery-3.svg` | `/images/` | Placeholder abstracto | `library-shelves` |
| `gallery-4.svg` | `/images/` | Personas sin contexto | `community-fellowship` |
| `online-pastoral.jpg` | `/images/demo/programs/` | Ausente / stock online genérico | `formation-virtual-classroom` → foto real |
| `online-pastors.jpg` | `/images/demo/programs/` | Ausente / estética LMS | `faculty-teaching` → foto real |
| `online-brothers.jpg` | `/images/demo/programs/` | Ausente | `students-notes` → foto real |
| `online-admission.jpg` | `/images/demo/programs/` | Ausente | `community-group-prayer` |
| `hero-online.jpg` | `/images/demo/programs/` | Ausente / laptop protagonista | `hero-ministerial-call` |
| `hero-premium-student.jpg` | asset-paths | Ausente / stock educativo | `hero-ministerial-call` |
| `hero-institutional.svg` | `/images/` | Mantener solo como fallback SVG hasta hero foto | `hero-ministerial-call` |
| Imágenes programa demo | `institutional-demo.ts` | Rutas a demo inexistentes | IDs del catálogo por generación |

---

## Reemplazos sugeridos por página

| Página | Asset actual (legacy) | Asset catálogo objetivo |
| --- | --- | --- |
| Home hero | hero CMS / demo | `hero-ministerial-call` |
| Home metodología | — | `formation-virtual-classroom` |
| Home audiencia | `hero-online.jpg` | `bible-study-notes` |
| Programas cards | `PROGRAM_DEMO_IMAGES.*` | `bible-open-scripture`, `students-notes` |
| Equipo | `gallery-4.svg` | `faculty-teaching` (retratos reales) |
| Biblioteca | — | `library-shelves` |
| Noticias | `gallery-*.svg` | `graduation-ceremony`, `community-fellowship` |
| Testimonios avatar | `gallery-4.svg` | Retratos reales `variant="avatar"` |
| CTA premium | `hero-institutional.svg` | `worship-ministry` + overlay |

---

## Integración técnica

```bash
# Añadir foto: colocar source en public/media/{category}/{id}/source.jpg
# Actualizar catalog.json (metadata)
npm run build:institutional-media   # regenera variantes + blur

# En componentes:
<InstitutionalImage assetId="hero-ministerial-call" variant="hero" overlay />
```

---

## Próximos pasos

1. **Sesión fotográfica SEM** — cubrir slots provisionales y pendientes.
2. **Preset LUT único** — documentar en PHOTOGRAPHY-GUIDE § Color.
3. **Migrar referencias legacy** — `program-demo-assets.ts`, `institutional-demo.ts`, seed CMS.
4. **Video** — aplicar mismo estándar (Dirección de Producción Audiovisual).

---

## Criterios de cierre OT-MEDIA-SEM-001

| Criterio | Estado |
| --- | --- |
| Estructura `public/media/` | ✅ |
| Metadata por imagen | ✅ `catalog.json` |
| AVIF + WebP + JPEG multi-size | ✅ |
| `InstitutionalImage` | ✅ |
| PHOTOGRAPHY-GUIDE.md | ✅ |
| PHOTO-AUDIT.md | ✅ |
| `npm run build` | Verificar |

---

*Con esta auditoría se cierra la capa fotográfica de la identidad visual SEM. Siguiente épica recomendada: EP-002 Experiencia del Postulante.*
