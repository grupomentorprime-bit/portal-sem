# EP-UX-001 — Portal Experience Design v1.0

**Estado:** En curso  
**Objetivo:** Transformar el Experience Kit en un portal moderno, elegante y memorable, manteniendo la arquitectura ya construida.

## Principio rector

> Menos elementos, más calidad.

No diseñamos bloques individualmente. Cada sección responde tres preguntas:

| Pregunta | Ejemplo Hero | Ejemplo CTA |
| --- | --- | --- |
| ¿Qué quiere **sentir** el usuario? | Inspiración | Decisión |
| ¿Qué **acción** esperamos? | Explorar | Postular |
| ¿Cómo **conecta** con la siguiente sección? | Invita a descubrir la oferta | Cierra la narrativa |

## Referencias de calidad (principios, no copia)

Inspiración en la experiencia de: Stripe, Linear, Notion, Vercel, Webflow, Framer, Intercom.

Principios adoptados:

- Mucho espacio en blanco
- Tipografía protagonista
- Pocas sombras, muy suaves
- Fotografías grandes
- Microanimaciones discretas
- Excelente ritmo visual
- Consistencia absoluta

## Home Premium — flujo canónico

```
Header → Hero Premium → Oferta Académica → ¿Por qué estudiar? →
Ruta Formativa → Equipo Docente → Noticias y Eventos → CTA Premium → Contacto → Footer
```

## Capa de composición (OT-UX-001)

La presentación Home Premium **no modifica componentes LOCKED**. Se aplica vía:

| Capa | Ubicación |
| --- | --- |
| Config secciones | `src/lib/portal/home-experience.ts` |
| Wrapper + reveal | `src/components/portal/experience/home/` |
| Estilos composición | `src/styles/home-premium-experience.css` |
| Activación | `PortalRenderer` cuando `slug === "/"` |

### Ritmo vertical (desktop)

| Sección | Padding | Fondo |
| --- | --- | --- |
| Hero | 120px bottom | Institucional (componente) |
| Oferta Académica | 140px | Blanco |
| Feature Grid | 140px | Gris muy claro |
| Timeline | 140px | Blanco |
| People | 140px | Degradado sutil |
| News | 140px | Blanco |
| CTA Premium | 160px | Azul institucional |
| Contact Hub | 120px | Blanco |

### Tipografía Home

| Nivel | Tamaño |
| --- | --- |
| Hero | 72px (clamp) |
| Secciones | 48px |
| Cards | 24px |
| Cuerpo | 18px |

### Animaciones permitidas

Fade · Slide · Zoom 1.03 · Elevación — nunca exageradas.

## Reglas

1. No modificar arquitectura ni módulos LOCKED del Experience Kit.
2. Mejoras de diseño vía composición, tokens y CSS de capa.
3. Sin líneas divisorias — solo espacio.
4. Cards unificadas en Home (radio, sombra, hover).
5. CTA debe romper el ritmo como cierre.

## OTs

| OT | Alcance |
| --- | --- |
| [OT-UX-001](./ot/OT-UX-001.md) | Home Premium Experience |

## Referencias

- [HOME-PREMIUM-SEM.md](./HOME-PREMIUM-SEM.md) — historial técnico SEM
- Experience Kit — `docs/core/CORE-*.md`
