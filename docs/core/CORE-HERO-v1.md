# CORE HERO v1.0

**Estado:** LOCKED

Módulo Core del portal AprendeHoy. Diseño visual congelado en código; contenido 100% administrable desde CMS.

## Contrato de datos

- Slides anidados: `content`, `multimedia`, `actions`, `floatingCard`, `benefits`, etc.
- Publicación: `draft` | `published` | `scheduled` | `archived`
- Programación: `showFrom` / `showUntil`
- Prioridad: `principal` | `featured` | `normal`
- Versión de módulo: `cms_config.modules.heroPortal.version = 2`

## Permitido

- Corrección de bugs
- Mejoras de rendimiento
- Accesibilidad
- Nuevos **tipos de contenido** (video, countdown, formularios) **sin alterar la estructura del layout**

## No permitido

- Cambiar el layout del Hero Premium
- Cambiar el HTML base o CSS estructural
- Crear variantes visuales por tenant
- Modificar `HeroPremiumSection` / `HeroPremiumInteractiveShell` para casos puntuales

## Archivos Core (no tocar sin OT)

| Área | Archivos |
|------|----------|
| Tipos | `src/types/hero-portal.ts` |
| Normalización | `src/lib/cms/hero-portal-normalize.ts` |
| Render | `src/components/portal/sections/HeroPremium*.tsx` |
| Estilos | `hero-premium.css` (bloque `.hero-premium`) |
| Migración | `src/core/migrations/001-hero-v2.ts` |
| Canon | [CORE-UI-CANON.md](../frontend/CORE-UI-CANON.md) — HeroPremiumSection = **PortalCarousel** oficial |

## Relación con Core UI

`HeroPremiumSection` es el único Hero autorizado (LOCKED v1.0). Reemplaza `HeroInstitutional`, `PortalHero` y `HeroCarousel` (DEPRECATED). Ver duplicidades en [CORE-UI-CANON.md §5](../frontend/CORE-UI-CANON.md#5-tabla-de-duplicidades-18-pares).

## OTs cerradas

- OT-HERO-006 — Modelo de datos definitivo
- OT-CORE-HERO-002 — Migración esquema v2 + Migration Framework

## Próximo foco de plataforma

Portal CMS (Programas, Noticias, Equipo, Biblioteca, Footer, Menú) → CRM & Admisiones → Gestión Académica → Finanzas.
