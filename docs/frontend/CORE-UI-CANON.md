# CORE-UI-CANON — Canon Oficial del Core UI v1.0

| Atributo | Valor |
| --- | --- |
| Documento | CORE-UI-CANON |
| Versión | 1.0.0 |
| OT | OT-CORE-UI-002 |
| Épica | EP-CORE-001 — Consolidación del Core UI |
| Estado | **LOCKED** (canon publicado) |
| Fecha | 2026-06-30 |
| Owner | Platform Core / Frontend |

> Este documento es la **única fuente de verdad** sobre qué componentes están autorizados para desarrollo público en AprendeHoy Learning OS. Gobierna todos los tenants y portales institucionales.

---

## 1. Propósito

Definir oficialmente el **Core UI v1.0**: el conjunto obligatorio de componentes reutilizables, sus estados de ciclo de vida y las reglas de desarrollo asociadas.

Relacionado con:

- [UI-INVENTORY.md](./UI-INVENTORY.md) — Auditoría OT-CORE-UI-001
- [OT-CORE-UI-002.md](../ot/OT-CORE-UI-002.md) — Canonización
- DOC-000 — Frontend Constitution (pendiente en repo)

---

## 2. Estados oficiales

Todo componente en `src/components/` tiene **exactamente uno** de estos estados:

| Estado | Significado | Regla |
| --- | --- | --- |
| **CANONICAL** | Componente oficial autorizado para desarrollo público | Obligatorio en código nuevo |
| **LOCKED** | Canon congelado; solo bugs, a11y, performance | No rediseño sin nueva versión |
| **INTERNAL** | Admin, CMS, identidad, media — no es Core UI público | No usar en rutas `(site)/` |
| **EXPERIMENTAL** | Showcase, prototipo, sin adopción en producción | No usar en features nuevas |
| **DEPRECATED** | Superseded; mantenido por compatibilidad | **Prohibido** en desarrollo nuevo |

No existen otras clasificaciones informales.

---

## 3. Árbol oficial del Frontend

```
src/components/
│
├── ui/                    CANONICAL — Primitivos atómicos (Button, Input, Card…)
├── layout/                CANONICAL — Layout primitives (target fusión OT-006)
├── portal/                CANONICAL — Composición pública CMS-driven
│
├── config/                INTERNAL
├── content/               INTERNAL
├── media/                 INTERNAL
├── menu/                  INTERNAL
├── page-builder/          INTERNAL (preview migra hacia portal/)
├── identity/              INTERNAL
├── events/                INTERNAL
├── workflow/              INTERNAL
├── design-system/         EXPERIMENTAL
│
├── institutional/         DEPRECATED — No usar en código nuevo
├── blocks/                DEPRECATED — Puente legacy; delega a portal/
└── navigation/            DEPRECATED — Huérfano; reemplazado por portal/layout/
```

**Regla:** No crear nuevos dominios de primer nivel sin ADR.

---

## 4. Componentes canónicos obligatorios

Los siguientes son los **únicos componentes autorizados** para nuevos desarrollos públicos.

### 4.1 Orquestación

| Nombre | Ubicación | Propósito | Estado | Reemplaza | Versión |
| --- | --- | --- | --- | --- | --- |
| PortalShell | `portal/PortalShell.tsx` | Shell público (header, footer, topbar) | CANONICAL | SiteShell | — |
| PortalRenderer | `portal/PortalRenderer.tsx` | Motor CMS-driven de páginas | CANONICAL | BlockRenderer (público) | v2.0 |
| PortalHome | `portal/PortalHome.tsx` | Contenedor Home → Renderer | CANONICAL | HomeInstitutional | — |
| PortalBlockSection | `portal/PortalBlockSection.tsx` | Switch de bloques CMS | CANONICAL | — | — |
| PortalCmsPage | `portal/PortalCmsPage.tsx` | Páginas CMS con breadcrumb | CANONICAL | — | — |

### 4.2 Shell y layout

| Nombre | Ubicación | Propósito | Estado | Reemplaza | Versión |
| --- | --- | --- | --- | --- | --- |
| PortalHeader | `portal/layout/PortalHeader.tsx` | Navegación principal premium | CANONICAL | NavbarPremium, SiteHeader | candidato v1.0 |
| PortalFooter | `portal/layout/PortalFooter.tsx` | Footer institucional CMS | **LOCKED** | InstitutionalFooter | v1.0 |
| PortalTopBar | `portal/layout/PortalTopBar.tsx` | Barra superior configurable | CANONICAL | — | — |
| PortalMobileNav | `portal/layout/PortalMobileNav.tsx` | Menú móvil drawer | CANONICAL | NavMenu (mobile) | — |
| PortalContainer | `portal/layout/PortalContainer.tsx` | Contenedor de ancho máximo | CANONICAL | layout/Container* | — |
| PortalSection | `portal/layout/PortalContainer.tsx` | Sección vertical con padding | CANONICAL | layout/Section* | — |
| PortalBreadcrumb | `portal/layout/PortalBreadcrumb.tsx` | Migas de pan | CANONICAL | ui/breadcrumb | — |
| PortalCTA | `portal/layout/PortalCTA.tsx` | Call-to-action de bloque | CANONICAL | CTASection | — |
| PortalBrandMark | `portal/PortalBrandMark.tsx` | Logo institucional | CANONICAL | — | — |

\*Fusión con `layout/` planificada en OT-CORE-UI-006.

### 4.3 Hero

| Nombre | Ubicación | Propósito | Estado | Reemplaza | Versión |
| --- | --- | --- | --- | --- | --- |
| HeroPremiumSection | `portal/sections/HeroPremiumSection.tsx` | Hero carousel premium | **LOCKED** | HeroInstitutional, PortalHero, HeroCarousel | **v1.0** |
| HeroPremiumImage | `portal/sections/HeroPremiumImage.tsx` | Imagen optimizada hero | **LOCKED** | — | v1.0 |
| HeroPremiumInteractiveShell | `portal/sections/HeroPremiumInteractiveShell.tsx` | Shell interactivo hero | **LOCKED** | — | v1.0 |
| HeroPortalSection | `portal/sections/HeroPortalSection.tsx` | Resolver server → Premium | CANONICAL | — | — |
| HeroBlockSection | `portal/blocks/HeroBlockSection.tsx` | Adaptador bloque CMS | CANONICAL | — | — |

Ver [CORE-HERO-v1.md](../core/CORE-HERO-v1.md).

### 4.4 Cards y medios

| Nombre | Ubicación | Propósito | Estado | Reemplaza | Versión |
| --- | --- | --- | --- | --- | --- |
| PortalCard | `portal/cards/PortalCard.tsx` | Wrapper base de tarjeta | CANONICAL | InstitutionalCard | — |
| CardMedia | `portal/cards/CardMedia.tsx` | Media optimizada para cards | CANONICAL | — | — |
| ProgramCard | `portal/cards/ProgramCard.tsx` | Tarjeta de programa | CANONICAL | institutional/ProgramCard | — |
| NewsCard | `portal/cards/NewsCard.tsx` | Tarjeta de noticia | CANONICAL | institutional/NewsCard | — |
| EventCard | `portal/cards/EventCard.tsx` | Tarjeta de evento | CANONICAL | institutional/EventCard | — |
| TeamCard | `portal/cards/TeamCard.tsx` | Tarjeta de equipo | CANONICAL | TeacherCard | — |
| TestimonialCard | `portal/cards/TestimonialCard.tsx` | Testimonio | CANONICAL | institutional/TestimonialCard | — |
| StatCard | `portal/cards/StatCard.tsx` | Estadística individual | CANONICAL | StatsInstitution (ítem) | — |
| FeatureCard | `portal/cards/FeatureCard.tsx` | Feature / highlight | CANONICAL | — | — |
| AcademicAgendaCard | `portal/cards/AcademicAgendaCard.tsx` | Agenda académica | CANONICAL | — | — |
| InstitutionalNoticeCard | `portal/cards/InstitutionalNoticeCard.tsx` | Avisos | CANONICAL | — | — |
| LibraryCard | `portal/cards/LibraryCard.tsx` | Biblioteca / recursos | CANONICAL | — | — |

### 4.5 Nombres canónicos de dominio (alias oficiales)

Algunos nombres del canon de producto se implementan como composición de componentes existentes:

| Nombre canónico | Implementación actual | Ubicación | Estado |
| --- | --- | --- | --- |
| **PortalBanner** | PortalTopBar | `portal/layout/PortalTopBar.tsx` | CANONICAL |
| **PortalCarousel** | Carrusel integrado en Hero Premium | `portal/sections/HeroPremiumSection.tsx` | **LOCKED** v1.0 |
| **PortalFeature** | FeatureCard en sección institucional | `portal/cards/FeatureCard.tsx` | CANONICAL |
| **PortalTimeline** | Pasos de admisión / proceso | `portal/conversion/AdmissionProcessSection.tsx` | CANONICAL |
| **PortalStats** | StatCard + StatsSectionContent | `portal/cards/StatCard.tsx`, `portal/institution/InstitutionSectionContent.tsx` | CANONICAL |

### 4.6 Secciones de contenido (bloques CMS)

| Área | Componentes canónicos |
| --- | --- |
| Institucional | `WhyStudySectionContent`, `ModalitySectionContent`, `GallerySectionContent`, `StatsSectionContent`, `TestimonialsSectionContent`, `VerseSectionContent` |
| Ecosistema | `NewsSectionContent`, `EventsSectionContent`, `LibrarySectionContent`, `ResourcesSectionContent`, `AcademicAgendaSectionContent`, `InstitutionalNoticesSectionContent` |
| Conversión | `AdmissionProcessSection`, `ScholarshipsSection`, `FaqSection`, `QuickContactSection`, `AllianceSection` |
| Programas / Equipo | `ProgramsSectionContent`, `TeachersSectionContent` |

Ubicación base: `portal/institution/`, `portal/ecosystem/`, `portal/conversion/`, `portal/blocks/`.

### 4.7 Primitivos UI (`ui/`)

| Componente | Estado | Uso |
| --- | --- | --- |
| button, input, textarea, label, select, switch, checkbox, radio | CANONICAL | Formularios admin + portal |
| card, badge, alert, modal, accordion, avatar | CANONICAL | Admin + portal |
| shared (focusRing) | CANONICAL | Shell y cards portal |
| CursorProvider | CANONICAL | Efecto cursor tenant |
| hero, navbar, footer, cta, breadcrumb, pagination | EXPERIMENTAL | Catálogo `/internal/design-system` |

---

## 5. Tabla de duplicidades (18 pares)

| # | Legacy (DEPRECATED) | Oficial (CANONICAL) | Estado legacy | Estrategia de migración |
| ---: | --- | --- | --- | --- |
| 1 | NavbarPremium | PortalHeader | DEPRECATED | Preview CMS migrado; eliminar en v2.0 |
| 2 | InstitutionalFooter | PortalFooter | DEPRECATED | Solo showcase; eliminar en v2.0 |
| 3 | SiteShell | PortalShell | DEPRECATED | Huérfano; eliminar en v2.0 |
| 4 | SiteHeader | PortalHeader | DEPRECATED | Huérfano; eliminar en v2.0 |
| 5 | SiteFooter | PortalFooter | DEPRECATED | Huérfano; eliminar en v2.0 |
| 6 | NavMenu | PortalHeader / PortalMobileNav | DEPRECATED | Huérfano; eliminar en v2.0 |
| 7 | HomeInstitutional | PortalHome | DEPRECATED | Huérfano; eliminar en v2.0 |
| 8 | HeroInstitutional | HeroPremiumSection | DEPRECATED | Preview CMS migrado (OT-002) |
| 9 | PortalHero | HeroPremiumSection | DEPRECATED | Fallback legacy en HeroBlockSection |
| 10 | HeroCarousel | HeroPremiumSection | DEPRECATED | Huérfano; eliminar en v2.0 |
| 11 | InstitutionalCard | PortalCard | DEPRECATED | Cards legacy en institutional/ |
| 12 | ProgramCard (inst.) | portal/ProgramCard | DEPRECATED | Solo institutional/ |
| 13 | NewsCard (inst.) | portal/NewsCard | DEPRECATED | Solo institutional/ |
| 14 | EventCard (inst.) | portal/EventCard | DEPRECATED | Solo institutional/ |
| 15 | TeacherCard | TeamCard | DEPRECATED | TeachersGrid migrado (OT-002) |
| 16 | TestimonialCard (inst.) | portal/TestimonialCard | DEPRECATED | Grids delegan a portal |
| 17 | CTASection | PortalCTA | DEPRECATED | Preview CMS migrado (OT-002) |
| 18 | StatsInstitution | StatsSectionContent / StatCard | DEPRECATED | Preview CMS migrado (OT-002) |
| 19 | SectionTitle | PortalSectionHeader | DEPRECATED | blocks/ aún referencian en algunos |
| 20 | VerseBlock | VerseSectionContent | DEPRECATED | Preview CMS migrado (OT-002) |
| 21 | layout/Container | PortalContainer | CANONICAL dual | Fusión OT-006 |
| 22 | layout/Section | PortalSection | CANONICAL dual | Fusión OT-006 |
| 23 | ui/navbar | PortalHeader | EXPERIMENTAL | No adoptar |
| 24 | ui/footer | PortalFooter | EXPERIMENTAL | No adoptar |
| 25 | ui/hero | HeroPremiumSection | EXPERIMENTAL | No adoptar |

---

## 6. Componentes huérfanos — decisión v1.0

| Componente | Decisión | Justificación |
| --- | --- | --- |
| SiteShell (+ SiteHeader, SiteFooter, NavMenu) | **Eliminar en Core UI v2.0** | 0 rutas activas; reemplazado por PortalShell |
| HomeInstitutional | **Eliminar en Core UI v2.0** | Sin ruta; reemplazado por PortalHome |
| HeroCarousel | **Eliminar en Core UI v2.0** | Lógica en HeroPremiumSection |
| InstitutionSection | **Fusionar en Core UI v2.0** | Reemplazado por bloques en PortalRenderer |
| AcademicEcosystemSection | **Fusionar en Core UI v2.0** | Reemplazado por bloques en PortalRenderer |
| PortalHero / PortalHeroBenefits | **Eliminar en Core UI v2.0** | Fallback legacy; usar HeroPremiumSection |

No se eliminan archivos en v1.0.

---

## 7. Pipelines de renderizado

### 7.1 Producción (CANONICAL)

```text
(site)/layout.tsx
      ↓
PortalShell
      ↓
PortalRenderer
      ↓
PortalBlockSection
      ↓
portal/blocks/* → portal sections / cards
```

### 7.2 Preview CMS (migración OT-002)

**Antes:**

```text
BlockRenderer → institutional/ → (mezcla) portal/
```

**Ahora (objetivo alcanzado para bloques críticos):**

```text
BlockRenderer → portal/* (HeroPremiumSection, PortalCTA, StatsSectionContent…)
             → blocks/*Grid (delegación a portal — DEPRECATED capa)
```

**Futuro (Core UI v2.0):**

```text
Page Builder Preview → PortalBlockSection / PortalRenderer
```

Plan documentado; `blocks/*` permanece como capa DEPRECATED hasta v2.0.

---

## 8. Reglas de desarrollo

1. **Ningún desarrollo nuevo** podrá utilizar componentes marcados como `DEPRECATED`.
2. **Todo desarrollo público** debe usar únicamente componentes `CANONICAL` o `LOCKED`.
3. Componentes `LOCKED` no se rediseñan sin nueva versión (ver DOC-000 §16).
4. Componentes `INTERNAL` no se importan desde rutas `(site)/`.
5. Componentes `EXPERIMENTAL` no se adoptan en producción sin OT de promoción a CANONICAL.
6. Nuevos dominios en `src/components/` requieren ADR.
7. Toda duplicidad nueva es **rechazada en code review**.

---

## 9. Validación arquitectónica (OT-CORE-UI-002)

| Verificación | Resultado |
| --- | --- |
| Portal público usa componentes canónicos | ✅ `(site)/` → `portal/` + `ui/` primitivos |
| Preview CMS migrado (bloques críticos) | ✅ hero, cta, stats, verse, teachers → portal |
| Sin dependencias circulares detectadas | ✅ portal → ui; deprecated → portal/ui |
| Duplicidades clasificadas | ✅ §5 |
| Legacy marcado `@deprecated` | ✅ institutional/, navigation/, blocks/, huérfanos portal |
| Build exitoso | Verificar con `npm run build` |

---

## 10. Roadmap EP-CORE-001

| OT | Tema | Dependencia |
| --- | --- | --- |
| OT-CORE-UI-001 | Inventario | ✅ |
| OT-CORE-UI-002 | Canonización | ✅ |
| OT-CORE-UI-003 | Design Tokens | ✅ [DOC-002](./DOC-002-DESIGN-TOKENS.md) |
| OT-CORE-UI-004 | Breakpoints | Pendiente |
| OT-CORE-UI-005 | Branding Multi-tenant | Pendiente |
| OT-CORE-UI-006 | Layout System | Pendiente |
| OT-CORE-UI-007 | Responsive Certification | Pendiente |
| OT-CORE-UI-008 | DOC-000 → DOC-012 | Pendiente |
| OT-CORE-UI-009 | UI Freeze v1.0 | Pendiente |

---

## Referencias

- **[DOC-002 — Design Tokens](./DOC-002-DESIGN-TOKENS.md)** — Sistema oficial de tokens (OT-CORE-UI-003)
- [UI-INVENTORY.md](./UI-INVENTORY.md)
- [PORTAL-ENGINE.md](../core/PORTAL-ENGINE.md)
- [CORE-HERO-v1.md](../core/CORE-HERO-v1.md)
- [HANDBOOK.md](../HANDBOOK.md) — Reglas de desarrollo Core UI
