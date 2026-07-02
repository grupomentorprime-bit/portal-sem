# Catálogo de componentes

**Catálogo visual:** `/internal/design-system`  
**Código fuente:** `src/components/ui/`  
**Especificaciones:** `src/components/design-system/component-specs.ts`

---

## Componentes base (`@/components/ui`)

### Button

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Acción primaria, secundaria, navegación con apariencia de botón |
| **Variants** | `primary`, `secondary`, `outline`, `ghost`, `danger`, `success` |
| **Sizes** | `sm`, `md`, `lg` |
| **States** | default, hover, active, disabled, loading |
| **Tokens** | `--primary`, `--secondary`, `--accent`, `--success`, `--radius-md`, `--transition-fast` |
| **A11y** | `focus-ring`, `disabled` nativo, `Loader2` con `aria-hidden` en loading |

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md">Guardar</Button>
<Button variant="outline" loading>Enviando…</Button>
<Button href="/programas" variant="secondary">Ver programas</Button>
```

---

### Badge

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Estado compacto, etiquetas, contadores |
| **Variants** | `success`, `warning`, `error`, `info`, `neutral` |
| **States** | static |
| **Tokens** | `--success`, `--accent`, `--light`, `--background-muted`, `--border` |

```tsx
<Badge variant="success">Activo</Badge>
```

---

### Card

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Agrupar contenido relacionado, dashboards, listados |
| **Variants** | `default`, `outlined`, `elevated`, `interactive` |
| **Subcomponentes** | `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| **Tokens** | `--border`, `--background`, `--shadow-sm`, `--shadow-md`, `--radius-lg` |

---

### Input / Textarea / Select

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Captura de datos en formularios CMS y portal |
| **States** | default, focus, error, disabled, loading (Input) |
| **Tokens** | `--border`, `--secondary` (focus), `--focus-ring`, `--color-danger` |
| **A11y** | Label asociado, `error` visible, iconos decorativos con `aria-hidden` |

---

### Checkbox / Radio / Switch

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Selección booleana, exclusiva o toggle de configuración |
| **States** | unchecked, checked, disabled |
| **Tokens** | `--primary`, `--accent`, `--border` |

---

### Tabs

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Alternar vistas en mismo contexto (editor CMS, configuración) |
| **Piezas** | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| **A11y** | Roles tab/tabpanel, foco en triggers |

---

### Modal / Drawer

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Modal: confirmaciones; Drawer: paneles de edición lateral |
| **States** | open, closed |
| **A11y** | Foco atrapado, Escape, `aria-labelledby` |

---

### Alert (patrón Toast)

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Feedback inline; para toast flotante usar Alert con `role="status"` hasta componente Toast v1.1 |
| **Variants** | `info`, `success`, `warning`, `error` |

---

### Spinner / Skeleton (Loader)

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Spinner: acción en curso; Skeleton: carga de contenido |
| **Tokens** | `--muted`, animación `animate-spin` / pulse |

---

### CTA / Hero / Footer

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Secciones de conversión portal, cabeceras, pie institucional |
| **Tokens** | `--sem-primary`, `--sem-accent`, gradientes vía tokens |

---

## Componentes de experiencia (portal)

| Componente | Ruta | Cuándo usar |
| --- | --- | --- |
| **Empty State** | `PortalEmptyState` | Listados vacíos, secciones sin contenido CMS |
| **Timeline** | `PortalTimeline` | Procesos, cronología, admisión |
| **Table** | Patrón HTML + tokens | Datos tabulares admin (componente formal en v1.1) |

### Empty State

```tsx
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";

<PortalEmptyState
  title="Sin archivos"
  description="Sube tu primer recurso."
  actionLabel="Subir"
  actionHref="/admin/media"
/>
```

### Timeline

```tsx
import { PortalTimeline } from "@/components/portal/experience/timeline";

<PortalTimeline settings={{ title: "Proceso", layout: "auto" }} items={items} />
```

### Table (patrón v1.0)

```tsx
<div className="overflow-x-auto rounded-lg border border-border">
  <table className="w-full text-sm">
    <thead className="bg-background-muted text-left text-muted">
      <tr><th className="px-4 py-3">Columna</th></tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="hover:bg-background-soft"><td className="px-4 py-3">Valor</td></tr>
    </tbody>
  </table>
</div>
```

---

## Componentes institucionales

`ProgramCard`, `TeacherCard`, `NewsCard`, `EventCard`, `CTASection`, `SectionTitle`, `VerseBlock` — ver `@/components/institutional`. Solo para portal público; no usar en CMS admin.

---

## Índice rápido

| Componente | Archivo |
| --- | --- |
| Button | `ui/button.tsx` |
| Badge | `ui/badge.tsx` |
| Card | `ui/card.tsx` |
| Input | `ui/input.tsx` |
| Select | `ui/select.tsx` |
| Switch | `ui/switch.tsx` |
| Modal | `ui/modal.tsx` |
| Drawer | `ui/drawer.tsx` |
| Tabs | `ui/tabs.tsx` |
| Alert | `ui/alert.tsx` |
| Spinner | `ui/spinner.tsx` |
| Skeleton | `ui/skeleton.tsx` |
| CTA | `ui/cta.tsx` |
| Hero | `ui/hero.tsx` |
| Footer | `ui/footer.tsx` |
| Table | Patrón v1.0 — ver sección Table arriba |
| Timeline | `portal/experience/timeline/` |
| Empty State | `portal/PortalEmptyState.tsx` |

---

## Referencias

- [CONTRIBUTING.md](./CONTRIBUTING.md) — flujo de nuevos componentes
- [PULL_REQUEST_CHECKLIST.md](./PULL_REQUEST_CHECKLIST.md)
- [VISUAL_QA.md](./VISUAL_QA.md)
- [VERSIONING.md](./VERSIONING.md)
