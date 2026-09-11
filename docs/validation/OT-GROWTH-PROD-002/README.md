# OT-GROWTH-PROD-002 — Correo con identidad del Espacio

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PROD-002 |
| ADR | [ADR-009](../../architecture/ADR-009.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | El mismo motor envía correos para cualquier Espacio con su identidad; el transporte sigue siendo infraestructura de Growth OS |

## Objetivo

Que los correos de Growth OS representen al Espacio que los origina, sin hardcodes SEM/ADL y sin crear otro motor de correo.

Reutiliza Resend, `src/lib/notifications/*`, `site_config` y Tenant/Site/Domain. No toca DNS/SPF/DKIM, campañas, CRM ni automatizaciones.

## Contrato

| Capa | Dueño | Fuente |
| --- | --- | --- |
| Transporte | Growth OS | `RESEND_API_KEY`, `EMAIL_FROM` (buzón técnico) |
| Identidad | Espacio / Site | `institution.name`, `contact.email`, Domain primario |

`EMAIL_FROM` puede seguir siendo el buzón de proceso. El nombre visible **no** sale de ese env.

| Superficie | Comportamiento |
| --- | --- |
| From | `"{nombre del Espacio}" <buzón técnico>` |
| Reply-To | `contact.email` del mismo Site, si está configurado |
| Fallback de nombre | **Growth OS** — nunca SEM |
| Links | origen del Site/Domain que originó el correo |
| Secretos | fuera de `site_config` |
| Proveedor por tenant | no — un solo Resend de plataforma |

## Fuera de alcance

- DNS / SPF / DKIM
- Campañas, CRM, automatizaciones (Growth Core)
- Proveedor de correo por Espacio
- Credits / copy de plataforma (PROD-003)
- Docs de entrada (PROD-004)

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Criterios de aceptación

- [x] Correo originado en SEM → identidad SEM
- [x] Correo originado en ADL → identidad ADL
- [x] Espacio sin nombre → Growth OS
- [x] Links corresponden al Site que originó el correo
- [x] Ningún tenant usa datos de otro para construir el mensaje
- [x] Copy legado (Portal SEM / Learning OS / Talca Aurora en plantilla) fuera del motor
- [x] Transporte e identidad separados; sin motor nuevo

## Veredicto

**APTO** — un motor, identidad por Espacio, transporte de Growth OS. `test:baseline` 99 tests (85 pass, 14 smoke skip sin app viva), `tsc --noEmit`, `npm run build`.
