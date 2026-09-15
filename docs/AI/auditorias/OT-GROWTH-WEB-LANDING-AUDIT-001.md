# OT-GROWTH-WEB-LANDING-AUDIT-001 — Sitio web + Landing pages — revisión de base existente

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-WEB-LANDING-AUDIT-001 |
| Tipo | Auditoría UX / producto (sin implementación) |
| Agente | AGENTE 1 — Diseño / UX |
| Fecha | 2026-09-14 |
| Entrada | Growth OS · menú «Sitio web» · CMS `cms_pages` · Experience Studio · Experience Forms · branding / dominios · [OT-PORTAL-SAAS-000](./OT-PORTAL-SAAS-000-AUDITORIA.md) · [OT-GROWTH-CAMPAIGNS-AUDIT-001](./OT-GROWTH-CAMPAIGNS-AUDIT-001.md) |
| Estado | **CERRADA · APTO CON AJUSTES — EVOLUCIONAR LO EXISTENTE** |
| Alcance | Definir cómo Growth OS crea sitio institucional, landings, campaña, servicio/curso y contacto **sin** segundo CMS ni constructor paralelo |
| Fuera de alcance | Implementación · tocar backend · nuevo CMS · editor por tipo · seeds productivos · DNS real |

**Restricciones cumplidas:** solo diagnóstico y propuesta UX; sin código de producto; sin abrir OT de implementación automáticamente.

---

## Gate final

# APTO CON AJUSTES — REUTILIZAR / EVOLUCIONAR

**Sí: se puede evolucionar lo existente a un único constructor de páginas reutilizable.**

El Portal Educativo SaaS **ya es** el constructor:

`cms_pages` + plantillas + bloques + Experience Studio + PortalRenderer + formularios + branding + hosts.

No hace falta un segundo CMS, ni un builder de landings aparte, ni un editor distinto por tipo de página.

| Opción | Veredicto |
| --- | --- |
| **A** — Crear Growth Web Builder paralelo | Rechazada: duplica CMS, bloques, publish y URLs |
| **B** — Evolucionar Sitio web existente | **Elegida** — un solo motor de páginas; tipos = plantillas/objetivo, no productos |
| **C** — Solo Experience Forms como «landings» | Rechazada como modelo único: sirve captación, no sitio institucional |

La respuesta preferida del brief se sostiene con evidencia: **reutilizar y reordenar la IA de producto**, no reinventar el editor.

---

## Pregunta central

> ¿Podemos evolucionar lo existente a un único constructor de páginas reutilizable?

**Sí.** El hueco no es motor técnico; es **modelo de producto y navegación**: hoy «Sitio web» mezcla CMS, catálogo académico, admisión, comunicaciones y un atajo a Experience Studio que ya redirige a páginas. Además conviven **dos experiencias de «armar una landing»** (página CMS vs experiencia pública del formulario). Growth OS debe presentar **una** superficie: Sitio → Páginas (mismo editor), con formularios y dominio como satélites.

---

## 1. Qué ya existe

### 1.1 Portal Educativo SaaS + CMS

| Pieza | Ubicación real | Estado |
| --- | --- | --- |
| Páginas | colección `cms_pages` · `src/lib/cms/pages.ts` | Draft / published / scheduled / archived · SEO · versionado |
| Contrato página | `CmsPage` en `src/types/page.ts` | `title`, `slug`, `template`, `blocks[]`, `seo` |
| Plantillas tipadas | `PAGE_TEMPLATES` | `institutional`, `landing`, `program`, `news`, `team`, `library`, `contact` |
| Plantillas sembradas | `DEFAULT_TEMPLATES` | Solo **Home**, **Landing**, **Contacto** (3 de 7) |
| Render público | `PortalRenderer` + `loadPublishedPage` | Home, rutas fijas y `/(site)/[slug]` |
| Menús | `cms_menus` · `/admin/menus` | Navegación del portal |
| Medios | `/admin/media` | Imágenes/archivos por Espacio |
| Config sitio | `SiteConfig` / branding / SEO / contacto | `/admin/config` («Institución») |

### 1.2 Editor / bloques

| Pieza | Estado |
| --- | --- |
| Experience Studio | `src/components/visual-builder/*` — canvas, inspector, historial, preview device, publish |
| Entrada editor | `/admin/pages/[id]` → `PageEditorClient` → **Experience Studio** (un solo editor de páginas) |
| Atajo nav «Editor visual» | `/admin/experience-studio` → **redirect a `/admin/pages`** |
| Paleta de bloques | `DEFAULT_BLOCK_DEFINITIONS` — ~37 tipos, categorías Portada / Contenido / Conversión / etc. |
| Registry portal | `PORTAL_BLOCK_REGISTRY` + secciones `portal/blocks/*` |
| Bloque formulario Growth | `experience_form` — vincula Experience Form en la página |

**Conclusión editor:** ya hay un constructor visual de páginas. No hay que inventar otro.

### 1.3 Páginas públicas actuales

| Ruta | Naturaleza |
| --- | --- |
| `/` | Home CMS (`cms_pages` home) |
| `/contacto`, `/institucion`, … | CMS vía `PortalCmsPage` / slug publicado |
| `/(site)/[slug]` | Página CMS dinámica publicada |
| `/programas`, `/programas/[slug]` | **Catálogo** (plantilla de producto académica, no `cms_pages`) |
| `/formularios/[id]` | **Experience Form** + `experience_form_experience` (landing del formulario) |
| Noticias / eventos / avisos / agenda / biblioteca | Listados de contenido + detalle |

### 1.4 Catálogo (servicio / curso)

- Admin: `/admin/content/programs`, `/admin/content/courses` (dentro del grupo nav Sitio web hoy).
- Público: detalle de programa es **vista fija de catálogo**, no una página armada con bloques.
- Bloques CMS `programs` / `academic_offer` / `seminarios_home` **leen** el catálogo; no lo reemplazan.

### 1.5 Formularios Experience Forms

| Pieza | Rol |
| --- | --- |
| Definición + submissions | Motor de captación (Growth ingest → Persona / Oportunidad) |
| `/admin/portal/forms` | Centro de formularios |
| `experience_form_experience` | Config de **experiencia pública** del form (hero, info cards, FAQ, form shell, SEO) |
| `FormExperienceEditor` | **Segundo constructor** orientado a la URL del formulario |
| Bloque `experience_form` en CMS | Embebe el form dentro de una página del sitio |

Captación medible en Growth **ya existe** vía formularios (y Campañas lo trata como fuente inbound).

### 1.6 Branding por Espacio + dominios

| Pieza | Dueño |
| --- | --- |
| Branding (logo, colores, favicon, hero) | `SiteConfig.branding` por Espacio |
| Hosts / dominio primario | Plataforma / provision Espacio (`primaryDomain`, hosts) — no hay módulo «Dominio» dentro de Sitio web admin |
| SEO institucional | `SiteConfig.seo` + SEO por página |

### 1.7 Navegación «Sitio web» actual

Grupo `sitio-web` en `nav-domains.ts` (zona tools del sidebar Growth OS), hoy incluye:

1. Portal (`/admin/pages`)
2. Menús
3. Editor visual (redirect a páginas)
4. Institución (config / branding)
5. Autoridades
6. Programas / Cursos (catálogo)
7. Formularios + Operación de formularios
8. Centro de admisión
9. Comunicaciones + Medios

**Lectura UX:** el grupo funciona como «todo lo público del portal», no como el modelo deseado *Sitio → Páginas / Landings / Formularios / Dominio / Ajustes*.

---

## 2. Qué podemos reutilizar

| Capacidad deseada | Reutilizar |
| --- | --- |
| Crear página | `POST /api/cms/pages` + listado `PageListClient` |
| Elegir objetivo / tipo | Campo `template` + `CmsTemplate` (ampliar plantillas sembradas; UI de creación por objetivo) |
| Agregar / ordenar bloques | Experience Studio + `BlockPalette` / library |
| Editar textos / imágenes / botones | Inspector de bloques + Media picker + settings por tipo |
| Vincular formulario | Bloque `experience_form` (+ forms center existente) |
| Publicar | `status: published` + versionado ya en `cms_pages` |
| URL | `slug` + `/(site)/[slug]` (y hosts del Espacio) |
| Dominio | Hosts de plataforma / Espacio (exponer en Ajustes del sitio, no nuevo motor DNS) |
| Medir captación | Experience Forms → ingest Growth (Personas / Oportunidades / Actividad / Analítica) |
| Branding | `SiteConfig.branding` |
| Menú institucional | `cms_menus` |
| Landing de captación | Plantilla `landing` + bloques Hero / CTA / FAQ / `experience_form` |
| Contacto | Plantilla `contact` + `contact_hub` / `quick_contact` / form |
| Servicio/curso en página | Plantilla `program` + bloque oferta / CTA / form (catálogo sigue siendo SSOT del ítem) |

### Mapeo de bloques pedidos → existentes

| Bloque pedido | Existe hoy | Nota UX |
| --- | --- | --- |
| Hero | `hero` | Listo |
| Texto | `text`, `presentation`, `markdown` | Listo |
| Imagen | **No hay bloque `image` dedicado** | Cubierto por hero / gallery / media en settings; gap menor de naming |
| Beneficios | `feature_grid`, `scholarships` | Listo (copy a menudo education-default) |
| Servicios/cursos | `programs`, `academic_offer`, `resources` | Listo vía catálogo |
| Testimonios | `testimonials` | Listo |
| CTA | `cta_premium` (`cta` legacy) | Listo |
| Formulario | `experience_form` (+ `contact` legacy) | Preferir Experience Form |
| FAQ | `faq` | Listo |
| Equipo | `people` (`teachers` legacy) | Listo |
| Contacto | `contact_hub`, `quick_contact` | Listo |
| Footer | `footer_premium` (+ config portal) | Listo |

**No hace falta un catálogo nuevo de bloques para V1.** Hace falta curar la paleta Growth (mostrar primero conversión / contenido genérico) y sembrar plantillas por objetivo.

---

## 3. Qué falta (máximo 3 brechas reales)

Solo tres huecos de producto/UX bloquean el modelo deseado. El resto es refinamiento.

### Brecha 1 — IA de «Sitio web» vs modelo Growth deseado

Hoy el usuario no ve:

```text
Sitio web → Páginas · Landing pages · Formularios · Dominio · Ajustes
```

Ve un cajón institucional amplio (catálogo, admisión, comunicaciones, autoridades).  
**Falta:** reordenar la navegación y el lenguaje de producto alrededor de **páginas + formularios + ajustes**, sin inventar otra app.

### Brecha 2 — Dos caminos para «armar una landing»

1. Página CMS (`cms_pages` + Experience Studio)  
2. Experiencia pública del formulario (`FormExperienceEditor` + `/formularios/[id]`)

Ambos son válidos técnicamente; juntos **rompen la promesa de un único constructor**.  
**Falta:** decisión de producto UX — en V1, la landing de captación «oficial» Growth es una **página** que embebe el formulario; la experiencia del form se trata como capa del formulario (no como segundo sitio).

### Brecha 3 — Creación orientada a objetivo (no a ID técnico)

Crear página hoy pide ID / título / slug y toma la primera plantilla disponible.  
**Falta:** flujo «Crear página → elegir objetivo (normal / captación / servicio-curso / contacto) → semilla de bloques → abrir el mismo editor». Tipos = plantillas, **no** editores separados.

*(Fuera de las 3: bloque imagen dedicado, multi-site por tenant, DNS self-serve, page builder del detalle de programa — ninguno es bloqueante V1.)*

---

## 4. Arquitectura UX recomendada

### 4.1 Principio

**Un documento de página (`cms_pages`) · un editor (Experience Studio) · muchos objetivos (plantillas).**

```text
Growth OS
└── Sitio web
    ├── Páginas          → listado cms_pages (todos los tipos)
    ├── Formularios      → Experience Forms (definición + captación)
    ├── Menús            → cms_menus (sitio institucional)
    ├── Dominio          → lectura/ajuste hosts del Espacio (plataforma)
    └── Ajustes del sitio → branding, SEO, contacto (SiteConfig)
```

Landings / campaña / servicio / contacto **no** son menús hermanos con editores propios: son **filtros o badges de objetivo** sobre el mismo listado de Páginas.

### 4.2 Flujo usuario (V1)

1. **Crear página** → modal/wizard corto: título + objetivo.  
2. **Elegir objetivo** → aplica `CmsTemplate` (landing / program / contact / institutional).  
3. **Agregar bloques** → paleta curada en Experience Studio.  
4. **Editar** textos, medias, CTAs en inspector.  
5. **Vincular formulario** → bloque `experience_form` (selector de form existente).  
6. **Publicar** → status published (preview device ya existe).  
7. **URL / dominio** → slug bajo el host del Espacio; Dominio en Ajustes.  
8. **Medir** → submissions del form en Growth (Personas / Oportunidades / Campañas / Analítica); la página no necesita un analytics engine propio.

### 4.3 Relación con Campañas

Campañas Growth orquesta captación; **no** construye HTML.  
Una campaña puede apuntar a `formId` y, opcionalmente, `pageId` como contexto de landing ([OT-GROWTH-CAMPAIGNS-CONTRACT-002](./OT-GROWTH-CAMPAIGNS-CONTRACT-002.md)). El constructor de la página sigue siendo Sitio web.

### 4.4 Catálogo vs página de servicio

- **SSOT del servicio/curso:** catálogo (`content` programs/courses).  
- **Página de marketing del servicio:** `cms_pages` con plantilla `program` (bloques + CTA + form).  
- V1 no obliga a reemplazar `/programas/[slug]` por CMS; basta poder publicar una página de campaña/servicio en `/[slug]`.

---

## 5. Vista de navegación propuesta

### 5.1 Grupo Sitio web (Growth OS)

| Ítem | Destino | Rol |
| --- | --- | --- |
| **Páginas** | `/admin/pages` | Único listado + entrada al constructor |
| **Formularios** | `/admin/portal/forms` | Captación (ya Growth-ready) |
| **Menús** | `/admin/menus` | Nav del sitio institucional |
| **Dominio** | superficie Ajustes/hosts del Espacio | URL pública (sin panel DNS nuevo en V1 si ya vive en plataforma) |
| **Ajustes del sitio** | `/admin/config` (branding / SEO / contacto) | Identidad del sitio |

### 5.2 Qué sale del primer nivel Sitio web (sin borrar capacidades)

| Hoy en Sitio web | Destino UX propuesto |
| --- | --- |
| Editor visual | Eliminar del nav (ya es `/admin/pages/[id]`) |
| Autoridades / Programas / Cursos | **Institución** o **Catálogo** (otro grupo), no «constructor» |
| Comunicaciones / Medios | Contenido / Medios (herramienta satélite; Medios accesible desde el editor) |
| Centro de admisión / Operación formularios | Operación académica o Formularios → operación |

### 5.3 Dentro de Páginas (mismo editor)

Filtros / badges de objetivo:

| Objetivo | Plantilla | Semilla de bloques (orientativa) |
| --- | --- | --- |
| Página normal | `institutional` | Hero · Texto · Feature · CTA · Footer |
| Landing de captación | `landing` | Hero · Beneficios · FAQ · Form · CTA |
| Servicio / curso | `program` | Hero · Oferta/beneficios · Testimonios · Form/CTA |
| Contacto | `contact` | Texto · Contact hub · Form opcional |

**Un solo Experience Studio** para los cuatro.

---

## 6. Alcance mínimo V1

1. **Reordenar nav Sitio web** al modelo Páginas / Formularios / Menús / Dominio / Ajustes (sin nuevo CMS).  
2. **Wizard de creación por objetivo** sobre plantillas existentes (`landing`, `contact`, `program` sembrada, `institutional`).  
3. **Paleta Growth curada** en el mismo editor (priorizar bloques de la tabla §2; ocultar o degradar legacy `cta` / `teachers` / SEM-only).  
4. **Landing de captación = página + bloque `experience_form`** como camino feliz documentado.  
5. **Ajustes del sitio** = branding/SEO ya existentes; Dominio = exponer host del Espacio.  
6. **Medición** = reutilizar captación Growth existente (no analytics de página paralelo).

Opcional V1 suave: badge «Captación» en listado si la página tiene bloque `experience_form`.

---

## 7. Qué NO debemos construir

| No construir | Por qué |
| --- | --- |
| Segundo CMS / `growth_pages` | `cms_pages` ya es SSOT de páginas |
| Editor separado por tipo | Tipos = plantillas; un Experience Studio |
| Webflow/Framer clone | Ya hay constructor de bloques + preview |
| Nuevo motor de bloques | 37 tipos + registry portal bastan |
| Landing product solo en Form Experience | Duplica el constructor; usar página + form |
| Reemplazar catálogo programas por CMS | Catálogo sigue siendo SSOT del ítem académico |
| Multi-site por Espacio | Un sitio por Espacio (`SiteConfig`) alcanza V1 |
| Panel DNS/Cloudflare en Growth | Dominio = hosts de plataforma |
| Analytics de pageviews propio | Captación se mide en Growth vía formularios/oportunidades |
| Bloque «Imagen» obligatorio en V1 | Gallery/hero/media cubren el caso |

---

## 8. Inventario rápido de componentes reutilizables

| Capa | Componentes / libs |
| --- | --- |
| Admin listado | `PageListClient`, kit admin tables |
| Editor | `ExperienceStudio`, `StudioCanvas`, `StudioInspector`, `StudioComponentLibrary` |
| Preview | `BlockPreview`, `PreviewDevice`, `PortalBlockSection` |
| Forms UX | `FormExperienceEditor` (capa del form, no del sitio), bloque `experience_form` |
| Público | `PortalRenderer`, `PortalCmsPage`, `FormPublicExperience` |
| Branding | `core/branding/resolve`, config Institución |

---

## 9. Decisión de producto (congelar)

| Decisión | Valor |
| --- | --- |
| ¿Constructor único? | **Sí** — Experience Studio sobre `cms_pages` |
| ¿Tipos de página? | Plantillas / objetivo — **no** productos ni rutas de editor distintas |
| ¿Landing Growth? | Página publicada + formulario vinculado |
| ¿Form Experience? | Sigue existiendo como **skin del form**; no competir como «sitio» |
| ¿Sitio web en Growth? | Misma superficie Portal; **IA y flujo** alineados al modelo deseado |
| ¿V1 mide qué? | Captación (leads/oportunidades), no vanity pageviews |

---

## Gate de cierre

| Criterio | Resultado |
| --- | --- |
| ¿Segundo CMS necesario? | **No** |
| ¿Evolucionar lo existente? | **Sí** |
| ¿Brechas reales ≤ 3? | **Sí** — IA Sitio · dualidad landing form vs página · creación por objetivo |
| ¿Listo para contrato UX / implement OT? | **APTO CON AJUSTES** tras congelar §9 |

**Siguiente paso sugerido (no abierto aquí):** `OT-GROWTH-WEB-LANDING-CONTRACT-002` — contrato de IA, wizard de objetivos, plantillas V1 y regla Form Experience vs página, sin tocar backend de publish/blocks.
