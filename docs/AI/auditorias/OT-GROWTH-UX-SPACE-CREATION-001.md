# OT-GROWTH-UX-SPACE-CREATION-001 — Crear Espacios para cualquier organización

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-SPACE-CREATION-001 |
| Tipo | Diseño / UX |
| Agente | AGENTE 1 — Diseño / UX |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-PLATFORM-ADMIN-003](../../validation/OT-GROWTH-PLATFORM-ADMIN-003/README.md) |
| Estado | **CERRADA · APTO VISUAL** |
| Alcance | Modal **Crear Espacio** en Platform Admin — categorías horizontales, identificador automático, formulario simple |
| Fuera de alcance | Multi-tenant · IAM · permisos · aprovisionamiento nuevo · Growth Core · Automatizaciones · Mensajes · Ventas · Platform Admin fuera del modal · onboarding paralelo · motores |

**Restricciones cumplidas:** reutiliza `POST /api/platform/spaces` → `createPlatformSpace` → `provisionTenantFoundation`; sin segundo onboarding; sin lógica por rubro; tipo no oculta capacidades.

---

## Gate final

**APTO VISUAL**

Crear Espacio queda entendible para cualquier organización o negocio: categorías base amplias, identificador propuesto desde el nombre, sin pedir «Nombre del Sitio» ni protagonizar «Slug». Growth OS se presenta como plataforma horizontal.

---

## 1. Estado inicial

| Pieza | Antes |
| --- | --- |
| Tipo | Solo **Institución** · **Academia** |
| Slug | Campo manual con etiqueta técnica «Slug» |
| Nombre del Sitio | Campo obligatorio duplicado del nombre |
| Dominio | «Dominio o subdominio inicial» |
| Copy | Enfoque implícito educación |

---

## 2. Cambios UX

| Área | Después |
| --- | --- |
| Nombre | **Nombre del Espacio** (ej. Mentor Capacitación) |
| Tipo | **¿Qué tipo de organización es?** → Empresa · Educación · Organización social · Comunidad o iglesia · Profesional independiente · Otro |
| Dirección web | **Dirección web inicial** (se propone `{id}.localhost:3000` al escribir el nombre) |
| Identificador | Propuesto automáticamente (`mentor-capacitacion`); en **Opciones avanzadas** como «Identificador del Espacio» |
| Nombre del Sitio | Ya no se pide; se envía el mismo nombre del Espacio |
| Dueño inicial | Solo en opciones avanzadas (flujo Platform Admin) |
| Copy modal | «Agrega una organización o negocio a Growth OS.» |

La categoría **no** limita módulos (Sitio, Personas, Ventas, Mensajes, Campañas, Automatizaciones, Analítica). Ejemplos de mapeo mental: Panadería → Empresa; Mentor Capacitación → Educación; Fundación → Organización social.

---

## 3. Archivos

### Creados

| Archivo | Rol |
| --- | --- |
| `src/lib/platform/space-organization-types.ts` | Catálogo de categorías + set permitido en creación |
| `scripts/capture-growth-ux-space-creation-001.ts` | Capturas Playwright |
| `tests/baseline/growth-ux-space-creation-001.test.ts` | Regresión superficie / copy / categorías |
| `docs/AI/auditorias/OT-GROWTH-UX-SPACE-CREATION-001-evidence/*` | Evidencia visual |
| `docs/AI/auditorias/OT-GROWTH-UX-SPACE-CREATION-001.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/components/platform/PlatformCreateSpacePanel.tsx` | Formulario horizontal + id automático |
| `src/lib/platform/space-labels.ts` | Labels de categorías nuevas (+ legacy) |
| `src/core/tenant/create-platform-space.ts` | Acepta categorías nuevas; slug sin acentos |
| `src/core/tenant/types.ts` | Documenta `TenantType` ampliado |
| `tests/baseline/platform-create-space.test.ts` | Caso slug con acentos |

### No tocados (según OT)

IAM · permisos · `provisionTenantFoundation` (motor) · Growth Core · Mensajes · Ventas · Automatizaciones · Platform Admin fuera del modal · seguridad · shells.

---

## 4. Capturas

Directorio: [`OT-GROWTH-UX-SPACE-CREATION-001-evidence/`](./OT-GROWTH-UX-SPACE-CREATION-001-evidence/)

| # | Archivo | Qué valida |
| --- | --- | --- |
| 1 | `01-desktop-crear-espacio.png` | Desktop · Mentor Capacitación · Educación · id propuesto |
| 2 | `02-desktop-avanzadas.png` | Identificador + dueño en avanzadas |
| 3 | `03-mobile-crear-espacio.png` | Móvil 390×844 · Empresa (Panadería Central) |

---

## 5. Handoff — Agente 2 (funcional / backend)

Mínimo ya aplicado en Agente 1 para que el modal no falle al persistir:

- `isSpaceCreationType` acepta `business | education | social | community | independent | other` (+ legacy `institution | academy`).
- `normalizeSpaceSlug` elimina acentos (NFD) para alinear con la propuesta UX.

**Pendiente / no improvisado aquí:**

1. **Migración de labels legacy** — Espacios existentes siguen como `institution` / `academy` en catálogo (labels legacy). Si producto quiere remapear SEM→Educación, ADL→Educación, hacerlo con migración explícita (no forzar en UI).
2. **`siteName` en API** — ~~hoy sigue obligatorio~~ → **cerrado en [OT-GROWTH-UX-SPACE-CREATION-002](./OT-GROWTH-UX-SPACE-CREATION-002.md)** (`siteName = name` si vacío).
3. **Host en entornos con `PLATFORM_BASE_DOMAIN`** — ~~la UI propone `{id}.localhost:3000` (dev)~~ → **cerrado en 002** (`proposeInitialSpaceHost` + prop desde `resolvePlatformBaseDomain`).
4. **Recomendación de config inicial por categoría** — fuera de alcance; no crear packs por rubro. Solo documentar que el tipo podrá orientar defaults futuros.
5. **Filtro de catálogo** — `typeLabel` ya usa `labelTenantType`; aparecerán las nuevas etiquetas al crear Espacios nuevos. Sin cambios de filtro requeridos.

**Handoff funcional:** [OT-GROWTH-UX-SPACE-CREATION-002](./OT-GROWTH-UX-SPACE-CREATION-002.md) · **CERRADA · APTO**.

**No hacer:** variantes de producto por rubro; ocultar módulos según tipo; onboarding paralelo; tocar Growth Core / IAM.

---

## 6. Validación

```bash
npx tsx --test tests/baseline/growth-ux-space-creation-001.test.ts
npx tsx --env-file=.env scripts/capture-growth-ux-space-creation-001.ts
```

Criterios:

- [x] Categorías sin enfoque solo educativo
- [x] Identificador automático desde el nombre
- [x] Sin «Slug» / sin «Nombre del Sitio» duplicado
- [x] Tipo no bloquea capacidades (solo clasificación)
- [x] Flujo existente reutilizado
- [x] Desktop + móvil capturados

## Veredicto

**APTO VISUAL** — Crear Espacio comunica Growth OS como plataforma para cualquier organización; contrato de creación ampliado al mínimo para las categorías; handoff claro para Agente 2 en host de plataforma y defaults futuros.
