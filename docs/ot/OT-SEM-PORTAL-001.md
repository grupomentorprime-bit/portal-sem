# OT-SEM-PORTAL-001 — Home Premium del Seminario

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-PORTAL-001 |
| Versión | 1.5.0 |
| Prioridad | Crítica |
| Estado | Fase 1 en progreso |
| Enfoque | **SEM-first** — entrega del portal del seminario, no Portal Engine genérico |

## Objetivo

Entregar la **Home Premium del Portal SEM**, visualmente alineada con el mockup aprobado, completamente dinámica y administrable desde el CMS existente.

**No es** construir el Portal Engine de AprendeHoy. Esa abstracción queda para una fase posterior ([OT-PORTAL-UX-001](./OT-PORTAL-UX-001.md), diferida).

El SEM es el primer cliente; la prioridad es **salida del portal**, no generalización multi-tenant.

## Alcance

### Incluye

- Evolución incremental de la Home actual (`PortalHome`) hacia experiencia premium
- Mejoras visuales y de UX en componentes **ya existentes** donde sea suficiente
- Creación **solo** de componentes nuevos que el mockup requiera y no existan
- Integración exclusiva vía Content Engine, Page Builder y Menu Engine (sin Mongo directo desde UI)
- Cumplimiento de Manual de Marca, Moodboard, Design System y ARQ-003

### Excluye (explícitamente)

- Refactorización masiva de arquitectura
- Nueva estructura de carpetas tipo `portal/navigation/MegaMenu/` desacoplada del SEM
- Colección `portal_hero` ni abstracciones multi-tenant nuevas
- Eliminación o reemplazo total de `PortalShell`, `PortalHome` o rutas `(site)/`
- Abstracción a Portal Engine genérico (Fase 2)

## Dependencias

| OT | Estado |
| --- | --- |
| OT-SEM-INFRA-001 | ✅ |
| OT-SEM-CMS-001 | ✅ |
| OT-SEM-CMS-002 | ✅ |
| OT-SEM-CMS-003 | ✅ |
| OT-SEM-CMS-004 | ✅ |
| OT-SEM-CMS-005 | ✅ |
| OT-SEM-DESIGN-001 / 002 | ✅ |
| OT-SEM-DOC-001 | ✅ |

## Lectura obligatoria

Antes de escribir código:

- [HANDBOOK](../HANDBOOK.md)
- [ARQ-003](../architecture/ARQ-003.md)
- [UX-SEM-001](../ux/UX-SEM-001.md)
- [MANUAL-DE-MARCA](../design/MANUAL-DE-MARCA.md)
- [MOODBOARD](../design/MOODBOARD.md)
- [DESIGN-SYSTEM](../design/DESIGN-SYSTEM.md)
- [OT-STANDARD](../development/OT-STANDARD.md)

## Arquitectura

**Principio:** evolucionar, no reemplazar.

```
src/app/(site)/page.tsx          → sin cambio de ruta
src/components/portal/PortalHome → composición premium de la Home
src/components/portal/PortalShell → layout público (header + main + footer)
src/lib/portal/*                 → fetch vía Content Engine / CMS services
src/lib/cms/pages.ts             → bloques Page Builder para Home (slug "/")
```

### Inventario actual reutilizable

| Existente | Uso en Home Premium |
| --- | --- |
| `PortalShell` | Layout oficial del sitio público |
| `PortalHeader` / `PortalFooter` | Navegación y pie (mejorar estética, no reescribir) |
| `PortalHero` | Hero fullscreen (evolucionar; slider solo si mockup lo exige y CMS lo soporta) |
| `PortalHome` | Orquestador de secciones desde bloques CMS |
| `PortalSection`, `PortalContainer` | Sistema de layout |
| `PortalSectionHeader` | Títulos dinámicos (sin texto hardcodeado) |
| Cards en `portal/cards/` | ProgramCard, NewsCard, TeamCard, StatCard, EventCard |
| `lib/portal/content.ts` | Programas, noticias, equipo vía Content Engine |
| `lib/portal/blocks.ts` | Extracción de settings desde Page Builder |
| `institutional/*` | **No usar en producción** — referencia visual legacy con datos mock |

### Componentes nuevos (solo si el mockup lo requiere)

Evaluar caso a caso antes de crear:

| Componente candidato | Condición |
| --- | --- |
| Hero con múltiples slides | Solo si mockup lo exige **y** se modela en Page Builder o Content Engine existente |
| Mega menú en header | Solo si mockup lo exige; extender `PortalHeader` + `cms_menus`, no carpeta paralela |
| Secciones faltantes (galería, testimonios, versículo) | Reutilizar bloques Page Builder o componer con cards existentes |
| Animaciones premium | CSS / tokens existentes primero; Framer Motion solo si justificado |

**Regla:** cada componente nuevo debe justificarse contra el mockup. Si un bloque CMS ya cubre la sección, no crear componente duplicado.

## UX

Referencia: [UX-SEM-001](../ux/UX-SEM-001.md)

Prioridades visuales (mockup):

- Header sticky con blur al scroll (parcialmente implementado en `PortalHeader`)
- Hero impactante con CTAs desde CMS
- Secciones con ritmo visual claro (presentación, programas, stats, equipo, noticias, CTA)
- Responsive: desktop, tablet, mobile
- Accesibilidad WCAG AA

## Diseño

- Tokens y variables CSS del Design System — **prohibido** colores/padding hardcodeados
- Tipografía institucional (`.text-display-*`, `.text-body`, etc.)
- Cards con estética `.institutional-card` / `PortalCard` según corresponda
- Catálogo de referencia: `/internal/design-system`

## APIs

Sin APIs nuevas salvo necesidad estricta del mockup. Datos desde:

| Fuente | Uso |
| --- | --- |
| `getPublishedPageBySlug("/", tenant)` | Bloques de la Home |
| `fetchPrograms`, `fetchNews`, `fetchTeam` | Secciones dinámicas |
| `getPortalContext()` | Config, logos, menús, navegación |

## Base de datos

Sin colecciones nuevas en esta fase. Hero y secciones se configuran con:

- `cms_config` — branding, SEO, institución
- Page Builder — bloques de la Home (`/`)
- Content Engine — programas, noticias, eventos, equipo
- `cms_menus` — navegación header/footer/mobile

## Componentes

### Archivos principales a tocar

| Archivo | Tipo de cambio |
| --- | --- |
| `src/components/portal/PortalHome.tsx` | Composición premium, secciones faltantes del mockup |
| `src/components/portal/PortalHero.tsx` | Ajustes visuales al mockup |
| `src/components/portal/layout/PortalHeader.tsx` | Premium polish (blur, CTA, menú) |
| `src/components/portal/layout/PortalFooter.tsx` | Alineación visual mockup |
| `src/app/globals.css` | Solo tokens/animaciones necesarias |
| Bloques Page Builder existentes | Settings adicionales si el CMS lo requiere |

### Prohibido

- Texto institucional hardcodeado en JSX
- Datos mock (`lib/institutional/home-content.ts`) en rutas de producción
- Duplicar cards (`institutional/ProgramCard` vs `portal/ProgramCard`)
- Refactor masivo renombrando carpetas o extrayendo capa genérica

## Seguridad

Sin cambios. Mantener acceso a datos solo vía server components y API Routes.

## Validaciones

- Todo contenido visible editable desde CMS o Content Engine
- `npm run lint` sin errores
- `npm run build` exitoso
- Lighthouse: Performance >90, Accessibility >95 en Home

## Documentación

Al cerrar la OT:

- [ ] Actualizar [UX-SEM-001](../ux/UX-SEM-001.md) con decisiones de Home Premium
- [ ] Actualizar [HANDBOOK](../HANDBOOK.md) si cambia flujo de composición
- [ ] [CHANGELOG](../../CHANGELOG.md) v1.5.0
- [ ] [RELEASES](../../RELEASES.md)
- [ ] [README](../../README.md) roadmap

## Fase 1 — Header + Hero Premium ✅

**Fecha:** 2025-06-29 (implementación incremental)

### Entregado

- [x] `PortalHeader` blanco premium con blur, menú CMS, Ingresar + Postular ahora
- [x] `PortalBrandMark` con fallback textual sin ícono roto
- [x] `PortalHero` layout premium (azul institucional + imagen destacada + overlay)
- [x] `PortalHeroBenefits` bajo hero (badge CMS o stats)
- [x] Quick-links CMS: Ingresar, Postular ahora, Aula virtual
- [x] Documentación: [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md)

### Pendiente Fase 2+

- [ ] Secciones restantes del mockup (ritmo visual completo)
- [ ] Footer premium polish
- [ ] Lighthouse >90 en producción

---

## Criterios de aceptación (Fase 1)

- [x] Header premium operativo (Fase 1)
- [x] Hero premium operativo (Fase 1)
- [ ] Home visualmente alineada con mockup aprobado (completa)
- [ ] 100 % contenido dinámico (CMS + Content Engine)
- [ ] Sin refactor masivo de arquitectura
- [ ] Componentes existentes reutilizados donde sea posible
- [ ] Header, Hero y secciones premium operativos
- [ ] Responsive validado
- [ ] Manual de Marca, Moodboard y Design System respetados
- [ ] ARQ-003 cumplido (datos vía server, no Mongo en cliente)
- [ ] Lint y build exitosos
- [ ] Documentación y versionado actualizados

## Restricciones

- **No** iniciar OT-PORTAL-UX-001 (Portal Engine genérico) en paralelo
- **No** crear abstracciones multi-tenant hasta que el portal SEM esté en producción
- Priorizar entrega sobre perfección arquitectónica

## Fase 2 (futuro)

Cuando la Home Premium del SEM esté en producción y validada:

→ [OT-PORTAL-UX-001 — Portal Engine Foundation](./OT-PORTAL-UX-001.md)

Abstraer componentes probados en producción hacia motor reutilizable AprendeHoy.

---

> Estructura conforme a [OT-STANDARD](../development/OT-STANDARD.md)
