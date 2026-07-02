# Guía Fotográfica Institucional — SEM

**Código:** OT-MEDIA-SEM-001  
**Versión:** v1.0  
**Épica:** [EP-001 — Portal Institucional Premium](../strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)  
**Complementa:** [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md) · [EDITORIAL-ASSETS.md](./EDITORIAL-ASSETS.md)

---

## Qué es este documento

Estándar visual oficial para **todas las fotografías** del Seminario Eclesiástico Mayor y base de la **Dirección de Producción Audiovisual** (foto, video, testimonios, redes).

No es un almacén de archivos. Es el criterio que hace reconocible una imagen del SEM sin ver el logotipo.

| Documento | Función |
| --- | --- |
| EDITORIAL-ART-DIRECTION | Qué comunicar |
| EDITORIAL-ASSETS | Patrones, sellos, SVG |
| **PHOTOGRAPHY-GUIDE** | Cómo fotografiar, tratar y publicar |

---

## Biblioteca

```
public/media/
├── catalog.json           # Metadata maestra
├── formation/
├── bible/
├── community/
├── faculty/
├── students/
├── library/
├── worship/
├── graduation/
├── resources/
├── hero/
└── backgrounds/

Cada asset:
  {category}/{id}/source.jpg
  {category}/{id}/variants/w{400|768|1080|1440|1920}.{avif|webp|jpg}
```

**Regenerar optimizaciones:** `npm run build:institutional-media`  
**Componente:** `InstitutionalImage` (`src/components/portal/media/`)

---

## Categorías y subcategorías

### Formación

| Subcategoría | Uso |
| --- | --- |
| Aula virtual | Metodología, campus virtual |
| Estudiantes | Vida formativa |
| Docente enseñando | Equipo, programas |
| Evaluaciones | Agenda, noticias |
| Material formativo | Biblioteca, cards |

### Biblia

| Subcategoría | Uso |
| --- | --- |
| Biblia abierta | Hero, identidad |
| Estudio bíblico | Programas, admisión |
| Toma de apuntes | Cards, modalidad |
| Lectura personal | Testimonios, devocional |

### Comunidad

| Subcategoría | Uso |
| --- | --- |
| Conversaciones | Testimonios |
| Compañerismo | Galería, noticias |
| Trabajo colaborativo | Programas |
| Oración en grupo | Admisión, hero secundario |

### Ministerio

| Subcategoría | Uso |
| --- | --- |
| Predicación | Programas pastores |
| Servicio | CTA, vocación |
| Liderazgo | Equipo, perfiles |
| Consejería | Admisión |
| Evangelización | Solo si aplica al contexto SEM |

### Institucional

| Subcategoría | Uso |
| --- | --- |
| Logo | Marca (vector preferido) |
| Oficinas | Contacto, institución |
| Campus virtual | Metodología |
| Certificados | Graduación, admisión |
| Graduaciones | Noticias, hero eventos |

### Recursos

| Subcategoría | Uso |
| --- | --- |
| Biblioteca | Página biblioteca |
| Libros | Cards biblioteca |
| Cuadernos | Material formativo |
| Material académico | Programas |

---

## Composición

| Regla | Criterio |
| --- | --- |
| Regla de tercios | Sujeto principal en intersección de tercios |
| Aire | Mínimo 30% espacio negativo para titulares |
| Encuadres | Entregar horizontal **y** vertical cuando sea posible |
| Profundidad | Preferir planos medios con contexto teológico visible |
| Horizonte | Nivelado; evitar dutch angle |

**Espacio negativo:** las fotos hero y banner deben permitir overlay de texto sin tapar rostros ni Biblia.

---

## Color e iluminación

| Parámetro | Estándar |
| --- | --- |
| Temperatura | Cálida-neutra uniforme en todo el catálogo |
| Contraste | Medio-alto; legible bajo overlays `--sem-primary` |
| Saturación | Contenida; sobriedad editorial |
| Luz | Natural siempre que sea posible; lateral o ambiente real |
| Preset | Un único preset LUT/documentado por producción (pendiente sesión) |

Aplicar overlay institucional (`/editorial/overlays/`) antes de publicar en hero/CTA.

---

## Personas

- Mostrar **personas reales** del SEM o perfiles auténticos del ministerio chileno.
- No modelos corporativos ni stock «startup».
- Si se usa banco de imágenes: perfiles cercanos a pastores, seminaristas, comunidad evangélica/anglicana/metodista.
- Consentimiento firmado para uso web, redes y campus.

---

## Vestimenta y ambiente

| Evitar | Preferir |
| --- | --- |
| Traje corporativo / coworking | Ropa formal sencilla |
| Oficina empresarial | Aula, capilla, biblioteca |
| Tecnología como protagonista | Biblia, libros, comunidad visible |
| Sonrisas stock sin narrativa | Gestos naturales en contexto ministerial |

---

## Metadata obligatoria

Cada imagen en `catalog.json`:

```json
{
  "id": "bible-open-scripture",
  "title": "Biblia abierta",
  "description": "...",
  "orientation": "landscape",
  "recommended_section": ["hero", "programs"],
  "keywords": ["biblia", "escrituras"],
  "photographer": "Nombre / SEM",
  "license": "SEM-INTERNAL | SEM-EDITORIAL-PLACEHOLDER | ...",
  "status": "approved | provisional | pending | rejected",
  "focal_point": { "x": 0.5, "y": 0.35 }
}
```

| Campo | Descripción |
| --- | --- |
| `title` | Título institucional |
| `description` | Uso editorial y contexto |
| `orientation` | `landscape` \| `portrait` \| `square` |
| `recommended_section` | Secciones del portal |
| `keywords` | Búsqueda CMS / media library |
| `photographer` | Autoría |
| `license` | Derechos de uso |
| `status` | Flujo de aprobación |
| `focal_point` | Crop inteligente (0–1) |

---

## Optimización

Generada automáticamente por `build:institutional-media`:

| Formato | Anchos | Calidad orientativa |
| --- | --- | --- |
| AVIF | 400–1920 | ~62 |
| WebP | 400–1920 | ~82 |
| JPEG | 400–1920 | ~85 (fallback) |

Plus: `blurDataURL` para placeholder en `InstitutionalImage`.

---

## Componente InstitutionalImage

```tsx
import { InstitutionalImage } from "@/components/portal/media";

<InstitutionalImage
  assetId="hero-ministerial-call"
  alt="Formación bíblica para el ministerio"
  variant="hero"
  overlay
  priority
/>
```

| Variant | Uso | Aspecto |
| --- | --- | --- |
| `hero` | Portada principal | 16:9 |
| `card` | Programas, noticias | 4:3 |
| `banner` | Banners secundarios | 21:9 |
| `gallery` | Galería institucional | 1:1 |
| `avatar` | Testimonios, equipo | 1:1 circular |

Features: lazy loading, blur placeholder, crop vía `focal_point`, overlay opcional.

---

## Ejemplos correctos

| Escena | Por qué funciona |
| --- | --- |
| Biblia abierta con luz lateral, escritorio simple | Protagonista teológico, temperatura cálida |
| Grupo pequeño en oración, ojos cerrados | Comunidad auténtica, sin pose comercial |
| Docente explicando texto bíblico | Autoridad académica + pastoral |
| Graduación con entrega de certificado SEM | Institucionalidad, emoción contenida |
| Estudiante con cuaderno y Biblia (no laptop solo) | Formación, tecnología como soporte |

---

## Ejemplos incorrectos

| Escena | Por qué rechazar |
| --- | --- |
| Persona sonriendo a cámara en coworking | Startup / marketplace |
| Laptop en primer plano sin Biblia | Tecnología protagonista |
| Traje ejecutivo en oficina de vidrio | Corporativo, no seminario |
| Stock «diversidad» genérica sin contexto | Intercambiable con cualquier LMS |
| Saturación alta, HDR agresivo | Publicidad, no editorial |
| Watermark de banco de imágenes visible | Incumple licencia |

---

## Dirección de Producción Audiovisual

El mismo estándar aplica a **todo contenido visual** del SEM:

| Formato | Aplicación | Criterios heredados |
| --- | --- | --- |
| **Fotografía** | Portal, CMS, redes | Esta guía |
| **Video testimonial** | Home, admisión, YouTube | Composición, luz natural, vestimenta |
| **Reels / cápsulas** | Instagram, YouTube Shorts | Misma temperatura de color; subtítulos institucionales |
| **Entrevistas** | Noticias, podcast video | Fondo sobrio; logo SEM discreto |
| **Clases demostrativas** | Admisión, campus preview | Biblia visible; docente real |

### Checklist audiovisual (futuro)

1. ¿Cumple preset de color foto/video?
2. ¿Audio limpio en testimonios?
3. ¿Lower third con tipografía Experience Kit?
4. ¿Duración adecuada por canal (web vs redes)?
5. ¿Metadatos en catalog.json / media CMS?

**OT futura sugerida:** producción de banco de videos institucionales bajo este mismo estándar.

---

## Flujo de aprobación

```
Captura / selección
      ↓
Revisión composición + vestimenta (esta guía)
      ↓
Tratamiento color (preset único)
      ↓
npm run build:institutional-media
      ↓
status: approved en catalog.json
      ↓
Publicación portal / CMS
```

| Status | Significado |
| --- | --- |
| `approved` | Listo para producción |
| `provisional` | Placeholder editorial aceptado temporalmente |
| `pending` | Slot reservado; falta sesión fotográfica |
| `rejected` | No cumple estándar; no publicar |

---

## Prohibiciones

1. Publicar sin metadata completa.
2. Colores fuera del preset o sin overlay en hero.
3. Recortes que eliminen contexto bíblico cuando era protagonista.
4. Mezclar estilos de tratamiento entre fotos de la misma página.
5. Usar imágenes rechazadas listadas en [PHOTO-AUDIT.md](../audits/PHOTO-AUDIT.md).

---

## Cierre de identidad visual

Con **OT-MEDIA-SEM-001** se completa la base visual del SEM:

| Capa | OT | Estado |
| --- | --- | --- |
| Experience Kit | EP-000 | ✅ |
| Dirección editorial | OT-PORTAL-003 | ✅ |
| Assets gráficos | OT-EDITORIAL-ASSETS-001 | ✅ |
| **Fotografía** | **OT-MEDIA-SEM-001** | ✅ |

A partir de aquí el esfuerzo recomendado pasa a **EP-002 — Experiencia del Postulante**: postulación, matrícula y vida académica sobre identidad consolidada.

---

## Referencias

- [PHOTO-AUDIT.md](../audits/PHOTO-AUDIT.md)
- [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md)
- [EDITORIAL-ASSETS.md](./EDITORIAL-ASSETS.md)

---

*Guía permanente. Toda fotografía publicada en el portal SEM debe cumplir este estándar.*
