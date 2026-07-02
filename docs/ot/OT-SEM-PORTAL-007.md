# OT-SEM-PORTAL-007 — Footer Premium Institucional

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-PORTAL-007 |
| Versión | 2.5.0 |
| Prioridad | Alta |
| Estado | Completada |

## Objetivo

Construir el Footer Premium definitivo del Portal Institucional SEM, completamente administrable desde el CMS y alineado con el Design System.

## Arquitectura

```text
PortalShell
      │
      ▼
PortalFooter
      │
      ├── FooterInstitution   ← cms_config.institution + branding + social
      ├── FooterPrograms      ← academy_programs (featured)
      ├── FooterLinkColumn    ← cms_menus.footer (Recursos)
      ├── FooterLinkColumn    ← cms_menus.footer (Admisión)
      ├── FooterContact       ← cms_config.contact
      ├── FooterBottom        ← legal menu + portalCopy
      └── BackToTop           ← portalCopy.footerBackToTopLabel
```

## Fuentes de datos

| Elemento | Fuente CMS |
| --- | --- |
| Logos SEM / IPN | `cms_config.branding` |
| Nombre, lema | `cms_config.institution.name`, `.tagline` |
| Descripción breve | `cms_config.seo.description` |
| Programas destacados | Content Engine → `academy_programs` (`featured: true`) |
| Recursos / Admisión | `cms_menus.footer` (estructura jerárquica) |
| Contacto | `cms_config.contact` |
| Redes sociales | `cms_config.social` (solo las configuradas) |
| Copyright, créditos, títulos | `cms_config.portalCopy` |
| Legal | `cms_menus.legal` |

## Menú footer (seed)

Grupos en `menu-defaults.ts`:

**Recursos:** Biblioteca, Noticias, Eventos

**Admisión:** Postular, Becas, Requisitos, FAQ, Aula virtual

## Admin

- `/admin/config` → General: lema institucional + textos del footer (`PortalCopyForm`)
- `/admin/config` → Contacto, Redes
- `/admin/menus` → Menú Footer, Menú Legal

## Accesibilidad

- Landmark `<footer aria-label="Pie de página institucional">`
- `focusRing` en enlaces y botón volver arriba
- ARIA labels en redes sociales
- Contraste WCAG AA sobre fondo `--primary`

## SEO

- Enlaces internos rastreables (programas, menús)
- `sameAs` en JSON-LD Organization desde redes configuradas

## CSS

Clases en `globals.css`: `.portal-footer-premium__*`

## Responsive

| Breakpoint | Grid |
| --- | --- |
| Mobile | 1 columna |
| Tablet (768px+) | 2 columnas |
| Desktop (1024px+) | 5 columnas |

## Validación

```bash
npm run lint
npm run build
```

## Relacionado

- [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md)
- [OT-SEM-PORTAL-006](./OT-SEM-PORTAL-006.md)
- [OT-SEM-ASSETS-001](./OT-SEM-ASSETS-001.md) — siguiente fase
