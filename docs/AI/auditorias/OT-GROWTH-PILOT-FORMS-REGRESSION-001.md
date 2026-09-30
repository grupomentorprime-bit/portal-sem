# OT-GROWTH-PILOT-FORMS-REGRESSION-001 — Cierre

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PILOT-FORMS-REGRESSION-001 |
| Fecha | 2026-09-18 |
| Estado | **APTO** (código en `master` `400e80a`; flujo Mentor Prime validado en la base productiva) |

## Causa

UX-FORMS-SIMPLE-001 (**v32**) **no revirtió** el SSOT de `page.tsx` (no tocó esas rutas).

La regresión observable (“Portal no configurado.”) vuelve cuando el tenant admin se obtiene **solo** de `getOperationalSiteConfig()` → `institution.tenant`, y ese camino queda vacío: con Espacio activo en sesión el shell sigue mostrando “Mentor Prime Capacitación” (lista de spaces), pero si `site_config` no alimenta tenant (o el fallback cae al **Host** de plataforma `growthos…`, que no es el Site del piloto) la página de Formularios corta con el mensaje.

Eso es más frágil que Menús (`getSessionActiveTenantId`) y que el layout (sesión primero).

**Archivo/línea (antes):** `src/app/admin/portal/forms/page.tsx` L8–11 — `tenantId` solo desde `config?.institution.tenant` (mismo patrón en `[id]`, convocatorias, asuntos-estudiantiles).

Datos Mentor Prime en Mongo: tenant/site/`site_config` OK; formulario `solicita-informacion-sobre-nuestros-cursos` presente. No es reprovisionamiento.

## Corrección

En las 4 rutas admin de formularios del fix original:

1. `getSessionActiveTenantId()` (Espacio activo) — prioritario  
2. `getOperationalSiteConfig()` — respaldo SSOT / nombre institucional  
3. Sin `getTenantContext` / sin Host / sin hardcode mentor-prime

## Pruebas

| Suite | Resultado |
| --- | --- |
| `pilot-forms-fix-001` | **4/4 PASS** |
| `growth-ux-forms-simple-001` | **PASS** |
| `growth-ux-forms-human-001` | **PASS** |
| Regresión SaaS (`saas-host-resolve` / `saas-isolation` / `saas-multi-space`) | **15/15 PASS** |

**Total suites pedidas + regresión SaaS: PASS (0 fail).**

## Veredicto

**APTO** — commit `400e80a` en `master`.

Flujo en el Espacio `mentor-prime-capacitacion` (base productiva, 2026-09-23): tres envíos del mismo correo → **1 Persona**, **1 Oportunidad** `inquiry` abierta, nextAction **«Contactar a la persona»**. El mismo envío con host de SEM responde 404 y no crea Persona. `growthos.mentorprime.cl` responde 503 (host de plataforma, sin Domain del Espacio): no mezcla Espacios. El formulario de captación quedó publicado (`active` + `visible`). El host público del Espacio sigue siendo `mentor-prime-capacitacion.localhost:3000`; falta un Domain de producción para abrirlo en `growthos`.
