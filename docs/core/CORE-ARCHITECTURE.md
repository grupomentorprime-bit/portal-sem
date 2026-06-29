# Core Architecture — AprendeHoy Multi-Tenant v1.5.0

## Resumen de auditoría (OT-CORE-001)

| Área | Estado | Acciones |
|------|--------|----------|
| Branding | ✅ | `src/core/branding` resuelve logo/hero/favicon desde config; fallbacks genéricos en `PLATFORM_ASSET_FALLBACKS` |
| Navegación | ✅ | Menús CMS: `main`, `footer`, `mobile`, `legal`, `quick-links`; sin columnas hardcodeadas en footer |
| Portal | ✅ | Home y páginas consumen Content Engine + bloques CMS; eliminada ruta fija `/ipn-chile` (CMS `[slug]`) |
| CMS / tenantId | ✅ | Páginas y contenido filtran por `tenant`; menús con campo `tenant` opcional |
| Media Library | ✅ | Rutas `media/{tenant}/…`; guard de tenant en APIs |
| Seguridad | ✅ | `assertActiveTenant` deny-by-default en APIs públicas sensibles |
| Performance | ⚡ | Cache existente (`unstable_cache`); lazy en imágenes Next.js; revisión Lighthouse pendiente en entorno productivo |
| UX / a11y | ⚡ | Empty states, skeletons portal; dark mode tokens preparados en CSS |
| Design System | ⚡ | Componentes UI centralizados; legacy `institutional/*` conservados para bloques CMS |

## Capas

```
Presentación (React)
    ↓
src/core/          ← interfaces tenant-agnósticas
src/lib/portal/    ← composición portal público
src/lib/cms/       ← persistencia CMS
src/lib/content/   ← Content Engine
    ↓
MongoDB
```

## Módulos core

| Módulo | Responsabilidad |
|--------|-----------------|
| `core/tenant` | Contexto del tenant activo (config + branding + nav) |
| `core/branding` | Resolución de assets visuales |
| `core/navigation` | Menús header/footer/legal/quick-links |
| `core/seo` | Metadatos y títulos de página |
| `core/security` | Validación de tenant en requests |
| `core/workflow` | Interfaces futuras (admisión, matrícula) |
| `core/forms` | Interfaces formularios multi-tenant |
| `core/search` | Interfaces búsqueda unificada |
| `core/analytics` | Interfaces telemetría |
| `core/notifications` | Interfaces notificaciones |

## Reglas

1. **Nunca** hardcodear nombre, logo o colores de un tenant en componentes de producción.
2. Toda consulta de contenido incluye `tenant` / `tenantId`.
3. APIs que reciben `tenant` validan contra el tenant activo de la instancia.
4. Fallbacks de plataforma solo cuando el tenant no ha configurado branding.

## Referencias

- `docs/core/TENANT-GUIDELINES.md`
- `docs/core/PLATFORM-CONVENTIONS.md`
- `docs/PORTAL-UX.md`
