# Accesibilidad

**Objetivo:** WCAG 2.1 nivel AA en portal público y CMS.

---

## Contraste

| Par | Requisito |
| --- | --- |
| Texto normal / fondo | ≥ 4.5:1 |
| Texto grande (≥ 18px bold) / fondo | ≥ 3:1 |
| Iconos funcionales | ≥ 3:1 |

Usar tokens de marca sobre fondos `--background` o `--background-soft`. Evitar `text-gray-400` sobre blanco para texto principal.

---

## Foco visible

Todos los controles interactivos usan `focus-ring` (`src/components/ui/shared.ts`):

```tsx
import { focusRing } from "@/components/ui/shared";
// className incluye focusRing
```

**Cuándo verificar:** Botones, links, inputs, tabs, switches, items de menú.

---

## Teclado

| Componente | Comportamiento |
| --- | --- |
| Modal | Trap de foco, Escape cierra |
| Drawer | Escape cierra, foco al abrir |
| Tabs | Flechas entre triggers (nativo/roving) |
| Dropdown | Enter/Space abre, Escape cierra |
| Switch / Checkbox | Space alterna |

---

## ARIA

| Patrón | Atributos |
| --- | --- |
| Alert | `role="alert"` o `role="status"` según urgencia |
| Modal | `aria-labelledby`, `aria-describedby` |
| Tabs | `role="tablist"`, `tab`, `tabpanel` |
| Timeline | `aria-label` en `<ol>` |
| Loading | `aria-busy`, texto alternativo en Spinner |
| Empty state | Heading semántico (`h3`) + descripción |

---

## Formularios

- Todo input tiene `<Label htmlFor="...">` asociado.
- Errores: `aria-invalid`, mensaje visible, color `--color-danger`.
- Helpers: `aria-describedby` cuando aplique.

---

## Checklist rápido (pre-PR)

- [ ] Navegable solo con teclado
- [ ] Foco visible en todos los interactivos
- [ ] Contraste verificado en light y dark
- [ ] Imágenes decorativas con `alt=""` o `aria-hidden`
- [ ] Sin información transmitida solo por color

Ver también [PULL_REQUEST_CHECKLIST.md](./PULL_REQUEST_CHECKLIST.md).
