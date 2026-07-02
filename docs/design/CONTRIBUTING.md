# Flujo de incorporación de componentes

**Obligatorio** para cualquier UI nueva en AprendeHoy.

---

## Diagrama de decisión

```
Necesidad de UI
       ↓
¿Existe en @/components/ui o portal/experience?
       ↓
   Sí ──→ Reutilizar (ajustar props si basta)
       ↓
   No
       ↓
Diseño (tokens, variantes, estados, a11y)
       ↓
Implementación en src/components/ui/
       ↓
Spec en component-specs.ts + COMPONENTS.md
       ↓
Entrada en /internal/design-system
       ↓
QA visual (mobile / tablet / desktop)
       ↓
npm run check:branding && npm run build
       ↓
PR con PULL_REQUEST_CHECKLIST.md
```

---

## Convenciones obligatorias

| Regla | Detalle |
| --- | --- |
| Sin estilos inline de color | Excepto CSS variables (`--menu-badge-color`) documentadas |
| Sin HEX / rgb en componentes | Solo en `src/styles/tokens/` |
| Sin Tailwind prohibidos | `zinc`, `slate`, `amber`, `orange`, `emerald`, `red`, `blue` decorativos |
| Sin duplicación | Un solo `Button`, un solo `Badge`, etc. |
| Sin tokens nuevos sin justificación | Proponer en PR con caso de uso |
| Componentes compartidos primero | `@/components/ui` antes de CSS local |

---

## Estructura de un componente nuevo

```
src/components/ui/my-component.tsx   # implementación
src/components/ui/index.ts           # export
src/components/design-system/component-specs.ts  # spec
docs/design/COMPONENTS.md            # documentación
```

### Spec mínima

- **Variants** — lista cerrada
- **Sizes** — sm | md | lg si aplica
- **States** — default, hover, disabled, loading, error
- **Accessibility** — roles, teclado, labels
- **Props** — TypeScript exportado
- **Tokens** — lista de variables CSS usadas
- **Ejemplo** — snippet copy-paste

---

## Revisión visual (QA)

Ver procedimiento completo en [VISUAL_QA.md](./VISUAL_QA.md).

Resumen por breakpoint:

### Desktop (≥ 1024px)

- [ ] Layout completo sin overflow horizontal
- [ ] Jerarquía tipográfica clara
- [ ] Hover y focus visibles

### Tablet (768px – 1024px)

- [ ] Grids colapsan correctamente
- [ ] Sidebar / drawer funcionan
- [ ] Touch targets ≥ 44px

### Mobile (< 768px)

- [ ] Una columna por defecto
- [ ] Texto legible sin zoom
- [ ] Modales y drawers ocupan viewport usable

**Herramientas:** DevTools responsive, navegador real si es posible. Automatización fuera de alcance OT-BRANDING-005. Detalle: [VISUAL_QA.md](./VISUAL_QA.md).

---

## Deprecación

Ver [VERSIONING.md](./VERSIONING.md). Marcar `@deprecated` en JSDoc, mantener en catálogo con aviso, eliminar solo en major.

---

## Contacto / escalación

Cambios en `brand.css`, nuevos tokens semánticos o componentes base requieren revisión de arquitectura frontend.
