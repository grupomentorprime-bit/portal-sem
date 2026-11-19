# Task 6 Report: Verificación manual Owner

## Status

DONE_WITH_CONCERNS — smoke parcial; sesión actual no es mesa Plataforma Owner.

## Session observed

- URL: `http://localhost:3000/escritorio`
- Dock tipo cliente (Growth OS, Cumple, …), avatar **CP**
- Atención abrió capa empresa: cabecera **Atención | Seminario Eclesiástico Mayor**, nav **Mis tickets** / **Nuevo ticket**
- Búsqueda «Mentor» → «Nada coincide» (sin acceso a entrar a Mentor Capacitación desde este desk)

## Checklist

| Paso | Resultado |
|------|-----------|
| Plataforma título **Atención · Plataforma** | **BLOCKED** — no hay mesa Plataforma en esta sesión |
| Filtros flotantes + Aplicar + badge | **BLOCKED** — panel Filtros es de mesa Plataforma |
| Nuevo ticket «Seleccionar empresa» en Plataforma | **BLOCKED** — misma razón |
| Cancelar/enviar limpia empresa (Plataforma) | **BLOCKED** |
| En empresa: **Mis tickets** | **PASS** (SEM) |
| En empresa: empresa fija, sin select | **PASS** — `.attn-company-pill` presente; no hay `select[aria-label="Empresa del ticket"]`; Enviar deshabilitado sin descripción |
| Mentor Capacitación específicamente | **BLOCKED** — no entrable desde sesión actual |

## Code/test backup (no sustituye smoke Owner)

- `attention-context.test.ts` cubre Owner en plataforma vs empresa (incl. Mentor id)
- UI contract tests 4/4 + filters helpers 3/3 + suite relacionada 37/37

## Need from user

Abrir `/escritorio` con cuenta **Owner** en **Plataforma**, luego entrar a **Mentor Capacitación**, para completar el smoke de título/filtros/selector y el caso Mentor.
