# CORE CTA PREMIUM v1.0

**Estado:** LOCKED

Módulo oficial de Call To Action de AprendeHoy. No es un CTA del SEM ni de un tenant específico: un único componente para postular, matricularse, contactar, inscribirse, donar, agendar reuniones, etc.

## Principio

Un único CTA Module para toda la plataforma. Las variantes visuales y los textos son configuración CMS — no componentes distintos.

## Casos de uso

| Acción | Ejemplo de botón |
| --- | --- |
| Postular | Postular ahora |
| Matricularse | Iniciar matrícula |
| Información | Solicitar información |
| Contacto | Contactar |
| Inscripción | Inscribirse |
| Descarga | Descargar folleto |
| Evento | Confirmar asistencia |
| Donación | Donar |
| Reunión | Agendar reunión |
| Catálogo | Ver programas |

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalCTAPremium` | Contenedor premium con variantes |
| `PortalCTAContent` | Eyebrow, título, descripción |
| `PortalCTAButtons` | Hasta 3 botones configurables |
| `PortalCTAStats` | Estadísticas opcionales |
| `PortalCTAImage` | Imagen opcional (lazy, CLS = 0) |
| `PortalCTASkeleton` | Loading idéntico al layout |

Ruta: `src/components/portal/experience/cta-premium/`

## Variantes

| Variante | Uso |
| --- | --- |
| `center` | Contenido centrado, sin imagen |
| `split` | 50/50 texto e imagen en desktop |
| `banner` | Horizontal compacto |
| `minimal` | CTA ligero con borde sutil |
| `highlight` | Fondo primary, texto inverso |

## Contrato CMS — bloque `cta_premium`

### Sección

| Campo | Tipo |
| --- | --- |
| `overline` | string (eyebrow) |
| `title` | string |
| `description` | string |
| `variant` | `center` \| `split` \| `banner` \| `minimal` \| `highlight` |
| `background` | `default` \| `primary` \| `secondary` \| `surface` \| `muted` |
| `image` | string (URL) |
| `imageAlt` | string |
| `showStats` | boolean |
| `stats` | array |
| `buttons` | array (máx. 3) |

### Botón

| Campo | Tipo |
| --- | --- |
| `label` | string |
| `action` | objeto — ver tipos de acción |
| `variant` | `primary` \| `secondary` \| `outline` \| `ghost` |
| `icon` | string (BlockIcon) |
| `visible` | boolean |
| `href` | string — **deprecated**, usar `action.type: url` |
| `newTab` | boolean — **deprecated**, usar `action.newTab` |

### Acción (`action`)

Cada botón ejecuta una acción configurable desde el CMS. El componente `PortalCTAButtons` delega en el **Experience Actions Engine** (`src/core/experience/actions/`). Ver [CORE-EXPERIENCE-ACTIONS-v1.md](./CORE-EXPERIENCE-ACTIONS-v1.md).

| Tipo | Campos | Estado |
| --- | --- | --- |
| `url` | `href`, `newTab?` | ✅ Implementado |
| `form` | `formId` | ✅ Implementado (Experience Forms) |
| `modal` | `modalId` | ⏳ Pendiente |
| `application` | `programId?` | ⏳ Pendiente |
| `program` | `programId` | ⏳ Pendiente |
| `whatsapp` | `phone`, `message?` | ⏳ Parser listo; handler stub |
| `enrollment` | `programId?` | ⏳ Pendiente |

Ejemplo CMS:

```json
{
  "label": "Postular ahora",
  "action": { "type": "url", "href": "/admision" },
  "variant": "primary"
}
```

```json
{
  "label": "Solicitar información",
  "action": { "type": "form", "formId": "contact" },
  "variant": "outline"
}
```

Registrar un nuevo tipo: `registerExperienceActionHandler(type, handler)` en `src/core/experience/actions/handlers/` — sin modificar `PortalCTAButtons`. Ver [CORE-EXPERIENCE-ACTIONS-v1.md](./CORE-EXPERIENCE-ACTIONS-v1.md).

### Estadística (opcional)

| Campo | Tipo |
| --- | --- |
| `value` | string (ej. +150) |
| `label` | string (ej. estudiantes) |
| `visible` | boolean |

## Layout responsive

| Breakpoint | Comportamiento |
| --- | --- |
| Desktop (≥1024px) | Split 50/50 |
| Notebook | Texto arriba, botones abajo |
| Tablet | Stack vertical |
| Mobile (&lt;640px) | Centrado, botones 100% ancho |

Rango: 360px – 2560px.

## Animaciones

- Entrada: fade up (`slide-up`)
- Botones: glow + elevation en hover
- Respeta `prefers-reduced-motion`

## Performance y accesibilidad

- `next/image` con lazy loading
- Skeleton con dimensiones fijas
- `aria-labelledby`, focus visible, contraste AA
- Navegación por teclado en botones y enlaces externos

## Tokens

Solo Design Tokens (`--color-primary`, `--background-muted`, `--shadow-lg`, etc.). Sin colores hardcodeados ni gradientes SEM.

## Deprecaciones

| Legacy | Reemplazo |
| --- | --- |
| `PortalCTA` | `PortalCTAPremium` |
| `CTASection` | `PortalCTAPremium` |
| `BannerCTA` | `variant: banner` |
| `AdmissionCTA` | `variant: highlight` |
| `ContactCTA` | `variant: center` |
| `HeroBottomCTA` | `variant: minimal` |
| Bloque `cta` | Bloque `cta_premium` (legacy delega) |

## Experience Kit v1.0

Foundation: Hero Premium, Catalog Card, Feature Grid, Timeline, News Grid, People Grid, **CTA Premium**

Pendiente: Footer Premium, Forms.

Pendiente: Experience Forms (OT-PORTAL-010).

Footer Premium: [CORE-FOOTER-PREMIUM-v1.md](./CORE-FOOTER-PREMIUM-v1.md) — LOCKED v1.0
