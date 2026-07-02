# Espaciado

**Sistema:** 8pt grid  
**Tokens:** `src/design/tokens/spacing.ts` · `--space-*` en CSS

---

## Escala oficial

| Token | Valor | Cuándo usar |
| --- | ---: | --- |
| `--space-xs` | 4px | Gap mínimo entre icono y texto |
| `--space-sm` | 8px | Padding interno de chips, gap en toolbars |
| `--space-md` | 16px | Padding de inputs, gap entre campos |
| `--space-lg` | 24px | Padding de cards, separación de bloques |
| `--space-xl` | 32px | Márgenes de sección compacta |
| `--space-2xl` | 48px | Separación entre secciones |
| `--space-3xl` | 64px | Hero padding vertical |
| `--space-4xl` | 96px | Secciones premium con mucho aire |

---

## Componentes layout

Usar `@/components/layout`:

| Componente | Cuándo usar |
| --- | --- |
| `Container` | Ancho máximo y padding horizontal |
| `Section` | Bloque vertical con padding predefinido |
| `Stack` | Apilar elementos con gap tokenizado |
| `Grid` | Grids responsivos con columnas declarativas |
| `Spacer` | Espacio vertical puntual entre bloques |

---

## Ejemplo

```tsx
import { Container, Section, Stack } from "@/components/layout";

<Section padding="lg">
  <Container>
    <Stack gap={6}>
      <h2 className="text-heading">Título</h2>
      <p className="text-body">Contenido</p>
    </Stack>
  </Container>
</Section>
```

---

## Reglas

- Usar múltiplos de 4px; preferir valores de la escala oficial.
- No mezclar `margin: 13px` o valores arbitrarios sin justificación.
- En Tailwind, preferir `gap-4`, `p-6`, `mt-8` alineados al tema (mapeados a tokens).
