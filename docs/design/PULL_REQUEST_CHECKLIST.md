# Pull Request Checklist — Design System

Copiar en la descripción del PR cuando el cambio incluye UI.

---

## Branding y tokens

- [ ] Usa tokens oficiales (`--sem-*`, `--color-*`, clases semánticas)
- [ ] Sin HEX, `rgb()` ni `hsl()` fuera de `src/styles/tokens/`
- [ ] Sin colores Tailwind prohibidos (`zinc`, `slate`, `amber`, `yellow`, `orange`, `emerald`, `red`, `blue`, etc.)
- [ ] Sin estilos inline de color (salvo CSS variables documentadas)
- [ ] `npm run check:branding` pasa con **0 incidencias**

---

## Componentes

- [ ] Reutiliza `@/components/ui` cuando el componente existe
- [ ] No duplica implementaciones paralelas (Button, Card, Badge…)
- [ ] Nuevos componentes incluyen spec + entrada en catálogo `/internal/design-system`
- [ ] Props completamente tipadas (TypeScript strict)

---

## Layout y responsive

- [ ] Mobile-first verificado
- [ ] Tablet (768px) sin roturas
- [ ] Desktop (> 1024px) según diseño
- [ ] Sin overflow horizontal no intencional

---

## Accesibilidad

- [ ] Contraste WCAG AA
- [ ] Foco visible (`focus-ring`) en interactivos
- [ ] Navegable por teclado
- [ ] Labels / `aria-*` en formularios y diálogos

---

## Documentación

- [ ] `docs/design/COMPONENTS.md` actualizado si hay componente nuevo o variantes
- [ ] Spec en `component-specs.ts` si aplica
- [ ] CHANGELOG actualizado si el cambio es user-facing

---

## Build

- [ ] `npm run build` finaliza sin errores
- [ ] `docs/design/VISUAL_QA.md` consultado para cambios visuales

---

## Dirección de arte editorial (SEM)

- [ ] Cumple [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md) — checklist §15
- [ ] ¿Se reconoce como SEM? ¿Formación y Biblia protagonistas?
- [ ] ¿Podría confundirse con Coursera, Udemy o LMS genérico? → debe ser **no**
- [ ] Glosario institucional (Programas formativos, Docentes, Estudiantes…)
- [ ] Fotografías con contexto ministerial — no stock genérico

---

## Referencias

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [INTRODUCTION.md](./INTRODUCTION.md)
- [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md)
- Catálogo: `/internal/design-system`
