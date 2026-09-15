# OT-GROWTH-WEB-LANDING-IMPLEMENT-001 — Sitio web V1 — ordenar y simplificar

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-WEB-LANDING-IMPLEMENT-001 |
| Tipo | Implementación UX / producto (AGENTE 1 — Diseño / UX) |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-WEB-LANDING-AUDIT-001](./OT-GROWTH-WEB-LANDING-AUDIT-001.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Reordenar Sitio web · crear página por objetivo · paleta Growth · lenguaje humano · Dominio lectura · Form Experience como skin del form |
| Fuera de alcance | Nuevo CMS · nuevo editor · motor de bloques · DNS · analytics · Meta · Ventas · seguridad · multi-tenant · PortalRenderer · publish backend |

**Restricciones cumplidas:** sin segundo constructor; sin tocar motores congelados; capacidades reubicadas (no borradas); no se abre otra OT automáticamente.

---

## Gate final

# APTO

Sitio web V1 queda como **un solo constructor de páginas** (`cms_pages` + Experience Studio), con navegación Growth, creación por objetivo y lenguaje humano. Form Experience sigue como presentación del formulario, no como segundo sitio.

---

## 1. Qué se implementó

### 1.1 Navegación «Sitio web»

Orden aplicado:

```text
Sitio web
→ Páginas
→ Formularios
→ Menús
→ Dominio
→ Ajustes del sitio
```

Salieron del primer nivel (sin borrar rutas):

| Antes en Sitio web | Destino |
| --- | --- |
| Editor visual | Fuera del nav primario (redirect `/admin/experience-studio` → Páginas; enlace en supplemental) |
| Autoridades / Programas / Cursos | Grupo **Institución** |
| Comunicaciones / Medios | Grupo **Institución** |
| Centro de admisión / Operación de formularios | Grupo **Institución** |

### 1.2 Crear página por objetivo

Botón **Crear página** → wizard:

1. ¿Qué quieres crear?
2. Nombre de la página + Dirección de la página
3. Crea `cms_pages` con plantilla tipada + bloques sembrados
4. Abre el **mismo** editor (`/admin/pages/[id]` → Experience Studio)

| Objetivo UI | `template` | Semilla de bloques |
| --- | --- | --- |
| Página normal | `institutional` | Hero · Texto · Beneficios · CTA · Footer |
| Landing de captación | `landing` | Hero · Beneficios · FAQ · Formulario · CTA · Footer |
| Servicio o curso | `program` | Hero · Servicios/cursos · Beneficios · Testimonios · Formulario · CTA · Footer |
| Contacto | `contact` | Texto · Contacto · Formulario · Footer |

ID interno y slug se derivan del nombre; no se piden al usuario como campos técnicos.

### 1.3 Landing oficial Growth

Regla aplicada en producto:

**Landing = página (`cms_pages`) + bloques + bloque Formulario (`experience_form`).**

`FormExperienceEditor` permanece como skin del enlace público del formulario. En la ficha del form:

- Pestaña **Presentación** (antes «Experiencia»)
- Copy que remite a Sitio web → Páginas para landings de captación

### 1.4 Paleta de bloques

Catálogo existente; priorización Growth + nombres humanos:

Hero · Texto · Beneficios · Servicios/cursos · Testimonios · CTA · Formulario · FAQ · Equipo · Contacto · Footer

Sin motor nuevo.

### 1.5 Dominio

Nueva superficie de **solo lectura** `/admin/site/domain`: hosts del Espacio. Sin panel DNS.

### 1.6 Lenguaje

UI de listado/editor/wizard sin protagonismo de ID, slug técnico, CMS ni «Experience Studio» como marca de producto.

---

## 2. Archivos

### Creado

| Archivo | Rol |
| --- | --- |
| `src/lib/cms/page-objectives.ts` | Objetivos → plantilla + semilla |
| `src/lib/cms/growth-block-palette.ts` | Prioridad y labels humanos |
| `src/components/page-builder/CreatePageWizard.tsx` | Flujo Crear página |
| `src/app/admin/site/domain/page.tsx` | Dominio (lectura) |
| `tests/baseline/growth-web-landing-001.test.ts` | Casos de regresión V1 |
| `docs/AI/auditorias/OT-GROWTH-WEB-LANDING-IMPLEMENT-001.md` | Esta acta |

### Modificado

| Archivo | Cambio |
| --- | --- |
| `src/lib/admin/nav-domains.ts` | Sitio web V1 + grupo Institución |
| `src/components/page-builder/PageListClient.tsx` | Wizard, filtros por objetivo, copy humano |
| `src/lib/cms/page-defaults.ts` | Labels + plantillas institutional/landing/program/contact |
| `src/components/visual-builder/StudioComponentLibrary.tsx` | Paleta priorizada |
| `src/components/page-builder/SortableBlocks.tsx` | Labels humanos |
| `src/components/visual-builder/StudioToolbar.tsx` | Breadcrumb «Editar» |
| `src/components/page-builder/PageSettings.tsx` | Nombre / Dirección |
| `src/components/admin/forms/FormDetailClient.tsx` | Presentación ≠ constructor de sitio |
| `src/components/admin/forms/FormsCenterClient.tsx` | Breadcrumbs Sitio web |
| `src/components/menu/MenuListClient.tsx` | Breadcrumbs Sitio web |
| `src/components/page-builder/index.ts` | Export wizard |

### No tocado (congelado)

Motor `cms_pages` · publish · PortalRenderer · catálogo académico · backend de bloques · formularios Growth (definición/ingest) · DNS · analytics · Meta · Ventas · seguridad · multi-tenant.

---

## 3. Validación

| Criterio | Resultado |
| --- | --- |
| Nav Sitio web nueva | OK — test baseline |
| Capacidades no borradas | OK — grupo Institución + supplemental |
| Crear normal / landing / servicio / contacto | OK — wizard + semillas tipadas |
| Mismo editor | OK — `/admin/pages/[id]` |
| Insertar formulario | OK — bloque `experience_form` en semillas landing/servicio/contacto |
| Publicar | Sin cambios de motor (toolbar Publicar existente) |
| Desktop / mobile preview | Sin cambios (device switcher existente) |
| Cero segundo CMS/editor | OK — Form Experience acotado a skin |
| Tests | `growth-web-landing-001` + `growth-os-admin-shell-002` — 12/12 pass |

---

## 4. Veredicto

| Criterio | Resultado |
| --- | --- |
| Evolucionar constructor existente | Cumplido |
| Sin segundo CMS / editor de páginas | Cumplido |
| NO TOCAR respetado | Cumplido |
| Entregable + gate | **APTO** |

**No se abre otra OT automáticamente.**
