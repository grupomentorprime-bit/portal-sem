# OT-PORTAL-UX-001 — Portal Engine Foundation

| Atributo | Valor |
| --- | --- |
| OT | OT-PORTAL-UX-001 |
| Versión | 2.0.0 (planificada) |
| Prioridad | Alta |
| Estado | **Diferida — Fase 2** |
| Prerequisito | [OT-SEM-PORTAL-001](./OT-SEM-PORTAL-001.md) completada y en producción |

## Decisión de estrategia

Tras revisión del roadmap (junio 2026), esta OT **no se implementará ahora**.

**Motivo:** Construir un Portal Engine completamente desacoplado retrasaría la salida del Portal del Seminario.

**Nuevo enfoque:**

1. **Fase 1** — [OT-SEM-PORTAL-001](./OT-SEM-PORTAL-001.md): Home Premium del SEM reutilizando infraestructura existente
2. **Fase 2** — Esta OT: abstraer componentes probados hacia Portal Engine AprendeHoy multi-tenant

## Objetivo (cuando se reactive)

Convertir los componentes validados en producción del portal SEM en un motor reutilizable para cualquier institución AprendeHoy, sin duplicar código.

## Alcance original (referencia)

- Portal Engine desacoplado del SEM
- MegaMenu, Hero Slider, sistema de secciones genérico
- Colección `portal_hero`, abstracciones multi-tenant
- Componentes en `src/components/portal/` 100 % institution-agnostic

> El diseño detallado se replanteará al iniciar Fase 2, basándose en lo construido en OT-SEM-PORTAL-001.

## Relación con OT-SEM-PORTAL-001

| OT-SEM-PORTAL-001 (ahora) | OT-PORTAL-UX-001 (después) |
| --- | --- |
| Home Premium SEM específica | Abstracción multi-tenant |
| Evolución incremental | Refactor controlado post-validación |
| CMS existente | Extensiones genéricas si aplican |
| Entrega rápida | Escalabilidad AprendeHoy |

---

> No iniciar implementación hasta completar OT-SEM-PORTAL-001.
