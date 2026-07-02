# Motion

**Tokens:** `src/design/tokens/motion.ts` · Variables `--transition-*`, `--ease-*`

---

## Duraciones

| Token | Valor | Cuándo usar |
| --- | --- | --- |
| `--transition-fast` | 150ms | Hover de botones, bordes de input |
| `--transition-normal` | 250ms | Apertura de dropdown, tabs |
| `--transition-slow` | 350ms | Modales, drawers, timeline |

---

## Easings

| Token | Cuándo usar |
| --- | --- |
| `--ease-out` | Entradas (modales, toasts) |
| `--ease-in-out` | Transiciones de estado |
| `--ease-spring` | Micro-interacciones (hover-lift, press-scale) |

---

## Patrones del Experience Kit

| Clase / patrón | Componente | Cuándo usar |
| --- | --- | --- |
| `hover-lift` | Button, Card interactive | Feedback hover en elementos clicables |
| `press-scale` | Button | Feedback al presionar |
| `animate-slide-up` | PortalTimeline, secciones | Entrada al viewport |
| `animate-spin` | Spinner, Button loading | Carga en curso |

---

## Cuándo **no** animar

- Contenido crítico de formularios (evitar distracción).
- Usuarios con `prefers-reduced-motion: reduce` — respetar en CSS global.
- Listas largas con stagger excesivo.

---

## Ejemplo

```tsx
<button className="transition-[background-color,opacity] duration-[var(--transition-fast)] hover-lift">
  Acción
</button>
```

---

## Reglas

- No definir `transition: 0.37s` arbitrario.
- Sombras animadas deben usar tokens `--shadow-*`.
- Timeline usa keyframes en `src/styles/timeline.css` — no duplicar.
