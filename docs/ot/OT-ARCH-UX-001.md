# OT-ARCH-UX-001 — Protección de Componentes Validados (UI Lock System)

| Atributo | Valor |
| --- | --- |
| OT | OT-ARCH-UX-001 |
| Prioridad | P0 |
| Estado | ✅ Completada |

## Entregables

- `docs/ui/UI-COMPONENT-STATUS.md` — registro visual de estado
- `docs/ui/UI-LOCK-POLICY.md` — política de bloqueo y scoped CSS
- `src/lib/ui/ui-lock-registry.ts` — registro en código
- `src/styles/home-premium/` — CSS encapsulado por bloque `[data-block]`
- `src/styles/home-premium/compat.css` — único archivo con `!important` documentado

## Estructura CSS Home

```
src/styles/home-premium/
  index.css
  shell.css          # tokens compartidos
  compat.css         # puentes !important
  hero-home.css      # LOCKED
  programs-home.css  # IN DEVELOPMENT
  why-study-home.css
  timeline-home.css
  teachers-home.css
  news-home.css
  cta-home.css
  contact-home.css
  footer-home.css    # LOCKED
```

## Desbloqueo

Para modificar un componente LOCKED, crear OT previa: `OT-UNLOCK-{COMPONENT}-001`.
