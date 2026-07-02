# OT-UX-HOME-001 — Home Premium Redesign (MASTER)

| Atributo | Valor |
| --- | --- |
| OT | OT-UX-HOME-001 |
| Épica | EP-UX-001 — Portal Experience Design v1.0 |
| Prioridad | P0 — Máxima |
| Estado | ✅ Completada |
| Tipo | Solo composición visual — sin arquitectura ni Experience Kit |

## Objetivo

Rediseñar completamente la Home del portal institucional para convertirla en la referencia visual del proyecto AprendeHoy, con impacto comparable a una universidad internacional moderna.

## Restricciones respetadas

- Sin nuevos componentes base, wrappers ni registries
- Sin modificar Experience Kit (módulos LOCKED)
- Sin modificar APIs ni CMS
- Solo composición, layout, espaciado, jerarquía, tipografía, animaciones, color y ritmo visual

## Cambios por sección

### 1. Hero

- Viewport completo (`100dvh` menos header)
- Overlay fotográfico más profundo (gradiente editorial)
- Indicadores tipo pill con dot activo expandido
- Tarjeta flotante con sombra dramática
- Features con separador sutil

### 2. Oferta Académica

- Header centrado (no layout catálogo lateral)
- Grid asimétrico: destacado full-width en tablet, 3 columnas en desktop
- Cards sin `max-width` — respiran en el contenedor
- Imágenes 16:9 más altas, body con más padding
- Meta con separador superior

### 3. ¿Por qué estudiar?

- Layout bento 12 columnas (editorial, no 4 cajas iguales)
- Iconos más grandes, padding generoso
- Fondos alternados sutiles por tarjeta

### 4. Ruta Formativa

- Header centrado
- Línea de progresión horizontal con gradiente de estados
- Marcadores más grandes con sombra
- Conectores verticales con gradiente

### 5. Equipo Docente

- Header centrado
- Fotografías 4:5 protagonistas
- Overlay en hover para profundidad
- Cards alineadas a la izquierda (perfil editorial)

### 6. Noticias

- Layout revista: noticia principal 2 filas + 2 secundarias horizontales
- Tipografía escalada en destacada
- Secundarias con imagen lateral

### 7. CTA Premium

- Fondo con textura sutil y gradiente dramático
- Shell glassmorphism ampliado
- Título hasta 3.5rem, botones más grandes
- Stats con separador superior

### 8. Contacto

- Mapa con `border-radius` 2xl y sombra premium
- Canales con hover elevado
- Botones de acción más grandes (WhatsApp prioritario)
- Layout 55/45 información/mapa

### 9. Footer

- Estilos scoped vía `body:has(.portal-home-experience)`
- Gradiente de transición desde contacto
- Branding institucional reforzado

## Archivos modificados

| Archivo | Rol |
| --- | --- |
| `src/styles/home-premium-experience.css` | Capa de composición — entregable principal |
| `src/lib/portal/home-experience.ts` | Padding y ritmo por sección |
| `src/components/portal/experience/home/HomeExperienceSection.tsx` | Delay de reveal por índice |

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Home consistente Hero → Footer | ✅ |
| Sin apariencia de plantilla CMS | ✅ |
| Lenguaje visual unificado | ✅ |
| Experience Kit intacto | ✅ |
| Sin deuda técnica | ✅ |

## Verificación

```bash
npx tsc --noEmit
npm run dev
```

Visitar `/` y revisar flujo completo en desktop (1280px+), tablet (768px) y móvil (390px).

## Referencias

- [OT-UX-001](./OT-UX-001.md) — Home Premium Experience (base)
- [EP-UX-001](../ux/EP-UX-001-PORTAL-EXPERIENCE-DESIGN.md) — Principios de composición
