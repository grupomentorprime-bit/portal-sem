# OT-UX-001 — Home Premium Experience

| Atributo | Valor |
| --- | --- |
| OT | OT-UX-001 |
| Épica | EP-UX-001 — Portal Experience Design v1.0 |
| Prioridad | Alta |
| Estado | ✅ Completada |
| Tipo | Solo diseño — sin funcionalidades nuevas |

## Objetivo

Elevar la Home a una experiencia de universidad de primer nivel: una narrativa continua, elegante y memorable.

## Alcance implementado

### 1. Composición Home Premium

- Wrapper `portal-home-experience` en Home vía `PortalRenderer`
- `HomeExperienceSection` con metadatos emocionales y superficies alternadas
- `HomeExperienceReveal` — fade + slide al entrar en viewport

### 2. Ritmo visual

- Padding por sección (120–160px desktop, clamp responsive)
- Fondos alternados: blanco → soft → blanco → gradient → blanco → CTA institucional → blanco
- Neutralización de padding duplicado en `PortalSection` internos

### 3. Tipografía

- Hero 72px · Secciones 48px · Cards 24px · Cuerpo 18px (clamp responsive)

### 4. Cards unificadas

- Mismo radio, sombra suave, hover con elevación en Home
- Zoom 1.03 en fotografías al hover

### 5. CTA como cierre

- Sección full-bleed azul institucional
- Shell glassmorphism sobre fondo primario

### 6. Plantilla Home

- Orden canónico en `DEFAULT_TEMPLATES.home`
- Copy actualizado: Ruta Formativa, Equipo Docente, Noticias y Eventos

## Archivos

| Archivo | Rol |
| --- | --- |
| `src/lib/portal/home-experience.ts` | Config secciones |
| `src/components/portal/experience/home/*` | Wrapper + reveal |
| `src/styles/home-premium-experience.css` | Estilos composición |
| `src/components/portal/PortalRenderer.tsx` | Activación Home |
| `src/lib/cms/page-defaults.ts` | Plantilla y defaults |

## Criterios de aceptación

- [x] Home se siente como experiencia única
- [x] Sin bloques pegados — ritmo vertical claro
- [x] Lenguaje visual compartido (cards, tipografía, sombras)
- [x] Responsive 360px – 2560px
- [x] Sin modificar arquitectura ni componentes LOCKED

## Verificación

```bash
npx tsc --noEmit
npm run dev
```

Visitar `/` y revisar flujo completo en desktop, tablet y móvil.

## Referencias

- [EP-UX-001](./EP-UX-001-PORTAL-EXPERIENCE-DESIGN.md)
