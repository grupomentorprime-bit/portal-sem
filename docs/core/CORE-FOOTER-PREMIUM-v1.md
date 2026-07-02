# CORE FOOTER PREMIUM v1.0

**Estado:** LOCKED

Cierre oficial de todas las experiencias del Portal. El Footer es únicamente un **renderizador** — no almacena datos propios.

## Principio

```
Institution Config
        │
        ▼
Experience Contact Hub
        │
        ▼
Navigation / Branding
        │
        ▼
PortalFooterPremium
```

**Footer Rule:** Ningún componente del footer podrá contener teléfonos, correos, enlaces de navegación ni redes propias. Todo proviene de Institution Config, Navigation y Contact Hub.

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalFooterPremium` | Contenedor principal |
| `PortalFooterBrand` | Logo, nombre, descripción (Branding + SEO) |
| `PortalFooterNavigation` | Columnas desde Navigation + programas |
| `PortalFooterContact` | Contact Hub → `PortalContactFooterList` |
| `PortalFooterSocial` | Redes desde Institution Config |
| `PortalFooterLegal` / `PortalFooterBottom` | Copyright y legales |
| `PortalFooterSkeleton` | Loading |
| `FooterPremiumShell` | Ensamblador server-side |
| `FooterExperienceLink` | Enlaces vía Experience Actions Engine |

Ruta: `src/components/portal/experience/footer-premium/`

## Configuración CMS

### Site Config — `portalExperience.footerPremium`

| Campo | Default |
| --- | --- |
| `showDescription` | true |
| `showNavigation` | true |
| `showContact` | true |
| `showSocial` | true |
| `showLegal` | true |

### Bloque `footer_premium` (Layout)

Mismos flags. El bloque permite override por página; el footer global del shell usa `portalExperience.footerPremium`.

## Experience Actions

Todos los enlaces (navegación, legales, redes, contacto) resuelven acciones `url`, `phone`, `email`, `whatsapp`, `form` vía [Experience Actions Engine](./CORE-EXPERIENCE-ACTIONS-v1.md).

## Responsive

| Breakpoint | Layout |
| --- | --- |
| Desktop (≥1024px) | 4 columnas + fila social |
| Notebook / Tablet | 2×2 |
| Mobile | Stack vertical, botones 100% |

Rango: 360px – 2560px.

## Deprecaciones

| Legacy | Reemplazo |
| --- | --- |
| `PortalFooter` | `PortalFooterPremium` |
| `FooterInstitution` | `PortalFooterBrand` |
| `FooterLinkColumn` / `FooterPrograms` | `PortalFooterNavigation` |
| `FooterContact` | `PortalFooterContact` |
| `FooterSocial` | `PortalFooterSocial` |
| `FooterBottom` | `PortalFooterBottom` |
| `InstitutionalFooter` / `SiteFooter` | `PortalFooterPremium` |

## Experience Kit v1.0

Foundation completo excepto Experience Forms (OT-PORTAL-010).

## Referencias

- [CORE-CONTACT-HUB-v1.md](./CORE-CONTACT-HUB-v1.md)
- [CORE-EXPERIENCE-ACTIONS-v1.md](./CORE-EXPERIENCE-ACTIONS-v1.md)
- [OT-PORTAL-009](../ot/OT-PORTAL-009.md)
