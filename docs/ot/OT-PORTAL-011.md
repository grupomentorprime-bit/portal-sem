# OT-PORTAL-011 — Hero Premium SEM (Pixel Perfect)

| Atributo | Valor |
| --- | --- |
| OT | OT-PORTAL-011 |
| Versión | 2.4.2 |
| Prioridad | Alta |
| Estado | Completada (revisión pixel-perfect aplicada) |
| Alcance | Solo UI — sin cambios en CMS, Portal Engine ni modelo de bloques |

## Objetivo

Ajustar la implementación de OT-PORTAL-010 para alcanzar fidelidad visual 95–98% respecto a la maqueta oficial de referencia.

## Cambios UI

### Header (90px, fondo blanco)
- Variante `portal-header-premium--hero` reemplaza el header oscuro anterior.
- Logo premium: icono SEM + texto grande + divisor + nombre institucional.
- Nav con estado activo (`Inicio` subrayado en teal).
- Botones: buscar circular, Ingresar, Postular ahora → con medidas de la maqueta.
- Top bar oculta en home premium vía CSS (`body:has(.portal-main--hero-premium)`).

### Hero
- `min-height: 88vh` en área principal.
- Grid estricto **45% / 55%**.
- Fondo con radial + linear gradients + glows de profundidad.
- Curva decorativa turquesa SVG 4px desde el centro inferior hacia la imagen.
- Tipografía: H1 62–70px, descripción 22px, beneficios 16px/13px.
- Tarjeta flotante: `bottom: 9%`, `right: 4%`, sombra premium + blur.
- Imagen: `object-fit: cover`, borde redondeado izquierdo, bleed al borde derecho.
- Fallback obligatorio: `/images/hero-premium-fallback.jpg` (sin placeholder ni ícono).

### Beneficios
- Grid de 5 columnas en desktop con divisores verticales.

## Archivos modificados

- `src/app/globals.css`
- `src/components/portal/layout/PortalHeader.tsx`
- `src/components/portal/PortalBrandMark.tsx`
- `src/components/portal/sections/HeroPremiumSection.tsx`
- `src/components/portal/sections/HeroPremiumImage.tsx`
- `src/components/portal/PortalShell.tsx` (clase UI + offset 90px)
- `src/lib/cms/asset-paths.ts`
- `public/images/hero-premium-fallback.jpg`

## Validación

- `npm run lint` — OK
- `npm run build` — OK

## Revisión pixel-perfect (post-feedback)

| Punto | Ajuste |
| --- | --- |
| P0 Logo | Icono 64px, SEM 2–2.375rem/900, institución en 2 líneas compactas, más aire hacia el menú |
| P0 Fotografía | Extraída de la maqueta oficial → `/images/hero-premium-official.jpg` |
| Curva turquesa | Reubicada al panel de imagen, trazo corto 3px, ya no atraviesa toda la pantalla |
| Panel derecho | Grid 42/58, bleed ampliado hacia el borde |
| Tarjeta blanca | `bottom: 12%`, `right: 2%`, sombra premium reforzada |
| Iluminación | Más radiales, glow detrás del texto, línea teal bajo el H1 |
| Botones | Mayor altura, padding, radio y sombra del primario |
| Beneficios | Más padding vertical, iconos 2.75rem, texto secundario más claro |
| Header | Más padding horizontal y separación entre elementos |
| H1 | Hasta 4.5rem (72px) con mayor impacto |

## Nota de plataforma

La variante `sem_premium` del bloque Hero ya es reutilizable como **Hero Premium** de Learning OS: cualquier tenant puede adoptar la misma composición cambiando branding, imagen (`heroMediaId`), textos y beneficios desde CMS, sin modificar código.
