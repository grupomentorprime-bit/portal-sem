# CORE CONTACT HUB v1.0

**Estado:** LOCKED

Módulo oficial de contacto institucional de AprendeHoy. Única fuente de verdad para teléfonos, correos, WhatsApp, sedes, horarios, mapas y canales de atención.

## Principio

```
Institution Config (cms_config.contact + social)
        │
        ▼
Experience Contact Hub
        │
   ┌────┴────┐
   ▼         ▼
Footer   CTA Premium / Hero / Forms
```

El Footer **no almacena datos propios** — delega en Contact Hub, que lee Institution Config.

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalContactHub` | Contenedor principal (layout full / footer) |
| `PortalContactHeader` | Eyebrow, título, descripción |
| `PortalContactCard` | Grid de canales |
| `PortalContactChannel` | Canal individual (Experience Actions) |
| `PortalContactLocation` | Sede / ubicación |
| `PortalContactMap` | Mapa lazy (CLS = 0) |
| `PortalContactActions` | Botones vía `ExperienceActionButton` |
| `PortalContactSkeleton` | Loading idéntico al layout |
| `PortalContactFooterList` | Variante compacta para footer |

Ruta: `src/components/portal/experience/contact-hub/`

## Bloque CMS — `contact_hub`

Categoría: **Experiencia**

### Sección

| Campo | Tipo |
| --- | --- |
| `overline` | string |
| `title` | string |
| `description` | string |
| `showMap` | boolean |
| `showHours` | boolean |
| `showSocial` | boolean |
| `showLocations` | boolean |
| `showForm` | boolean |
| `mapProvider` | `google` \| `openstreetmap` \| `apple` |
| `formId` | string |
| `useInstitutionDefaults` | boolean |
| `channels` | array |
| `locations` | array |
| `actions` | array |

### Canal

| Campo | Tipo |
| --- | --- |
| `type` | `phone`, `whatsapp`, `email`, `facebook`, … |
| `name` | string |
| `value` | string |
| `icon` | string |
| `url` | string |
| `visible` | boolean |
| `order` | number |

Si `channels[]` está vacío y `useInstitutionDefaults` es true, se generan canales desde `ContactInfo` + `SocialLinks`.

### Acciones

Botones configurables con `ExperienceAction` — ver [CORE-EXPERIENCE-ACTIONS-v1.md](./CORE-EXPERIENCE-ACTIONS-v1.md).

Por defecto: Solicitar información (form), Escribir WhatsApp, Llamar.

## Mapa

Proveedor desacoplado en `src/lib/portal/contact-map.ts`. Lazy load con `IntersectionObserver`. No se carga si `showMap` es false.

## Integración Institution Config

| Campo config | Uso en Contact Hub |
| --- | --- |
| `contact.phone` | Canal teléfono + acción llamar |
| `contact.whatsapp` | Canal WhatsApp + acción destacada |
| `contact.email` | Canal correo |
| `contact.hours` | Canal horario |
| `contact.address/city/country` | Canal dirección + mapa |
| `social.*` | Canales redes (si `showSocial`) |

## Deprecaciones

| Legacy | Reemplazo |
| --- | --- |
| `QuickContactSection` | `PortalContactHub` |
| `FooterContact` | `PortalContactHub layout="footer"` |
| `ContactForm` (bloque) | `contact_hub` + Experience Forms |
| Bloque `quick_contact` | Bloque `contact_hub` |

## Experience Kit v1.0

Foundation: Hero Premium, Catalog Card, Feature Grid, Timeline, News Grid, People Grid, CTA Premium, **Contact Hub**

Pendiente: Experience Forms (OT-PORTAL-010).

Footer Premium: [CORE-FOOTER-PREMIUM-v1.md](./CORE-FOOTER-PREMIUM-v1.md) — LOCKED v1.0

## Referencias

- [CORE-EXPERIENCE-ACTIONS-v1.md](./CORE-EXPERIENCE-ACTIONS-v1.md)
- [OT-PORTAL-008](../ot/OT-PORTAL-008.md)
