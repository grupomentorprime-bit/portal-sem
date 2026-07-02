# Design System Institucional — SEM v1.0

**Código:** OT-SEM-DESIGN-001  
**Versión:** v1.1.0-design-system

Sistema de diseño oficial del Seminario Eclesiástico Mayor (SEM). Única fuente de componentes visuales para todo el proyecto, alineado estrictamente con el Manual de Marca y el Moodboard institucional.

---

## Filosofía de diseño

El Design System SEM prioriza:

1. **Coherencia institucional** — Cada interfaz refleja la identidad visual del seminario.
2. **Mantenibilidad** — Tokens centralizados evitan estilos duplicados y colores hardcodeados.
3. **Accesibilidad** — Cumplimiento WCAG AA en contraste, foco, teclado y ARIA.
4. **Escalabilidad** — Arquitectura preparada para tema claro y oscuro, y futura tipografía Mosk.

---

## Estructura del proyecto

```
src/
├── design/              # Design tokens (TypeScript)
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radius.ts
│   ├── shadow.ts
│   ├── breakpoints.ts
│   ├── animations.ts
│   ├── zindex.ts
│   └── index.ts
├── components/
│   ├── layout/          # Container, Section, Page, Stack, Grid, Spacer
│   └── ui/              # Componentes base reutilizables
└── app/
    ├── globals.css      # Variables CSS (--primary, --secondary, etc.)
    └── admin/design-system/  # Catálogo visual
```

---

## Tokens

### Colores oficiales

| Token       | Valor     | Uso                          |
|------------|-----------|------------------------------|
| Primary    | `#002A47` | Marca principal, textos fuertes |
| Secondary  | `#246AA1` | Acciones secundarias, enlaces |
| Accent     | `#10BCE2` | Destacados, foco, info       |
| Success    | `#3ED6AF` | Confirmaciones, estados OK   |
| Light      | `#8CE27F` | Advertencias suaves          |
| White      | `#FFFFFF` | Fondos claros                |
| Gray 50–900| Escala    | Textos, bordes, fondos       |

**No usar colores inventados fuera de esta paleta.**

### Tipografía

- **Objetivo:** Mosk (pendiente de integración)
- **Actual:** Manrope via `next/font/google`
- Pesos: 400, 500, 600, 700

### Espaciado (8pt)

`4` · `8` · `16` · `24` · `32` · `48` · `64` · `96` · `128` (px)

### Border radius

`sm` · `md` · `lg` · `xl` · `2xl` · `full`

### Sombras

Muy suaves (`sm`, `md`, `lg`, `xl`). No utilizar sombras pesadas.

### Animaciones

| Tipo     | Duraciones              |
|----------|-------------------------|
| fade     | 150ms · 250ms · 350ms   |
| slide    |                         |
| zoom     |                         |
| hover    |                         |
| press    |                         |

### Breakpoints

`sm` (640px) · `md` (768px) · `lg` (1024px) · `xl` (1280px) · `2xl` (1536px)

---

## Variables CSS

Todo el proyecto consume variables definidas en `src/app/globals.css`:

```css
--primary
--secondary
--accent
--background
--text
--radius
--shadow
--transition
```

Uso en componentes:

```tsx
// Tailwind (mapeado en @theme)
<div className="bg-primary text-text-inverse" />

// CSS directo
<div style={{ color: 'var(--primary)' }} />
```

### Tema oscuro

La arquitectura soporta `[data-theme="dark"]` y clase `.dark`. Actualmente se publica solo el tema claro (`data-theme="light"` en `<html>`).

---

## Componentes

### Layout

| Componente  | Descripción                    |
|------------|--------------------------------|
| Container  | Ancho máximo + padding responsive |
| Section    | Sección con padding vertical   |
| Page       | Wrapper de página completa     |
| Stack      | Flex vertical/horizontal       |
| Grid       | CSS Grid responsive            |
| Spacer     | Espaciado vertical/horizontal  |

### UI Base

Importar desde `@/components/ui`:

```tsx
import { Button, Card, Input, Alert } from "@/components/ui";
```

| Componente   | Variantes / notas                                      |
|-------------|--------------------------------------------------------|
| Button      | primary, secondary, outline, ghost, danger, success    |
| Card        | default, outlined, elevated, interactive             |
| Badge       | success, warning, error, info, neutral                 |
| Alert       | info, success, warning, error                          |
| Input       | label, helper, error, icon, loading                    |
| Textarea    | label, helper, error                                   |
| Select      | label, helper, error, options                          |
| Checkbox    | label, description                                     |
| Radio       | RadioGroup con legend                                  |
| Switch      | label, description                                     |
| Tabs        | TabsList, TabsTrigger, TabsContent                     |
| Accordion   | AccordionItem                                          |
| Modal       | dialog nativo accesible                                |
| Drawer      | Panel lateral                                          |
| Breadcrumb  | Navegación jerárquica                                  |
| Pagination  | Paginación numérica                                    |
| Avatar      | Imagen o iniciales                                     |
| Spinner     | Indicador de carga                                     |
| Skeleton    | Placeholder de carga                                   |
| Tooltip     | Información contextual                                 |
| Dropdown    | Menú desplegable                                       |
| Navbar      | Navegación principal responsive                        |
| Footer      | Pie institucional                                      |
| Hero        | Sección hero de landing                                |
| CTA         | Llamada a la acción                                    |

### Iconografía

Librería oficial: **Lucide React**

```tsx
import { Mail } from "lucide-react";
import { iconDefaults } from "@/components/ui";

<Mail {...iconDefaults} className="h-4 w-4" />
```

Reglas:
- Siempre **outline**
- **strokeWidth: 2**

---

## Ejemplos

### Botón primario

```tsx
<Button variant="primary" href="/admisiones">
  Inscribirse
</Button>
```

### Formulario con validación

```tsx
<Input
  label="Correo"
  type="email"
  helper="Usaremos este correo para contactarte."
  error={errors.email}
  icon={Mail}
/>
```

### Card interactiva

```tsx
<Card variant="interactive" onClick={handleClick}>
  <CardHeader>
    <CardTitle>Programa de Teología</CardTitle>
    <CardDescription>4 años de formación.</CardDescription>
  </CardHeader>
</Card>
```

### Layout de página

```tsx
<Page>
  <Navbar links={navLinks} cta={{ label: "Admisiones", href: "/admisiones" }} />
  <Hero title="Formación al servicio de la Iglesia" />
  <Section padding="lg">
    <Container>
      <Grid cols={1} mdCols={3} gap={6}>
        {/* contenido */}
      </Grid>
    </Container>
  </Section>
  <Footer />
</Page>
```

---

## Buenas prácticas

### Permitido

- Importar componentes desde `@/components/ui` y layout desde `@/components/layout`
- Usar tokens de `@/design` en lógica TypeScript
- Usar variables CSS y clases Tailwind mapeadas al tema
- Extender componentes con `className` via prop `cn()`
- Consultar el catálogo en `/admin/design-system`

### No permitido

- Colores hex hardcodeados en componentes (`#002A47` directo en JSX/CSS modules)
- Duplicar estilos de botones, inputs o cards fuera del design system
- Usar otras librerías de iconos sin aprobación
- Sombras pesadas o animaciones exageradas
- Ignorar estados de foco, disabled y loading
- Crear componentes UI ad-hoc cuando existe uno en el sistema

---

## Accesibilidad (WCAG AA)

- Contraste mínimo 4.5:1 para texto normal
- Anillos de foco visibles (`--focus-ring` con accent)
- Navegación por teclado en tabs, modales, dropdowns
- Etiquetas asociadas en formularios (`label` + `htmlFor`)
- ARIA en switches, alerts, modales y tooltips
- Texto alternativo en avatares con imagen

---

## Catálogo visual

Visita **`/admin/design-system`** para ver todos los componentes en contexto, incluyendo:

- Paleta de colores y escala de grises
- Escala tipográfica
- Todos los botones y estados
- Formularios completos
- Cards, alertas, modales
- Navbar, footer, hero
- Comportamiento responsive

---

## Integración con CMS

El CMS puede sobrescribir variables de marca via `layout.tsx`:

```tsx
--brand-primary
--brand-secondary
```

Los tokens del design system (`--primary`, etc.) son la base; el branding del CMS es una capa opcional de personalización.

---

## Próximos pasos

1. Integrar tipografía **Mosk** cuando estén disponibles los archivos de fuente
2. Activar tema oscuro cuando el Manual de Marca lo apruebe
3. Migrar componentes legacy (config, menus) a tokens del design system

---

*Documentación generada como parte de OT-SEM-DESIGN-001.*
