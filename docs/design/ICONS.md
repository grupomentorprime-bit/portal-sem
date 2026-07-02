# Iconografía

**Biblioteca:** [Lucide React](https://lucide.dev/)  
**Configuración:** `src/components/ui/icon.tsx` · `src/design/tokens/icons.ts` (si exists)

---

## Convenciones

| Regla | Valor |
| --- | --- |
| Estilo | Outline (`strokeWidth={2}`) |
| Tamaños | `iconSizes` desde `@/design` — sm, md, lg, xl |
| Color | `text-muted`, `text-primary`, `text-accent` — nunca HEX |
| Decorativos | `aria-hidden` cuando van junto a texto visible |
| Solo icono | `aria-label` en el botón/enlace padre |

---

## Cuándo usar iconos

| Contexto | Icono | Alternativa |
| --- | --- | --- |
| Acción primaria con texto | Opcional, a la izquierda | Texto solo si es obvio |
| Botón solo icono | Obligatorio `aria-label` | No usar sin etiqueta |
| Empty state | Icono grande, `strokeWidth={1.5}` | Inbox, FileQuestion |
| Navegación menú | Icono + label | `MenuItemEditor` + `IconSelector` |
| Estado success/error | CheckCircle, AlertCircle | Preferir Badge + texto |

---

## Selector de iconos (CMS)

`IconSelector` en admin usa el catálogo de `menu-icons.tsx`. No importar iconos aleatorios fuera del set documentado en menús.

---

## Ejemplo

```tsx
import { Mail } from "lucide-react";
import { iconSizes } from "@/design";

<Mail size={iconSizes.md} className="text-muted" strokeWidth={2} aria-hidden />
```

---

## Prohibido

- Mezclar bibliotecas (Font Awesome, Heroicons) sin aprobación.
- Iconos filled pesados que rompan la línea outline institucional.
- Colores Tailwind prohibidos en clases de icono.
