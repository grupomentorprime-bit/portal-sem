# Layout

**Breakpoints:** `src/design/tokens/breakpoints.ts`

---

## Breakpoints

| Token | Ancho | Cuándo usar |
| --- | ---: | --- |
| `sm` | 640px | Layouts de 2 columnas en móvil grande |
| `md` | 768px | Tablet — sidebar colapsable, grids 2-col |
| `lg` | 1024px | Desktop — navegación completa, timeline horizontal |
| `xl` | 1280px | Contenido ancho, footer 5 columnas |
| `2xl` | 1536px | Máximo espacio editorial |

---

## Contenedores

| Variante | Cuándo usar |
| --- | --- |
| `Container` default | Mayoría de páginas portal y admin |
| `Container size="md"` | Formularios, artículos, design system docs |
| `Container size="lg"` | Dashboards con tablas |

---

## Patrones de página

### Portal público

```
PortalShell
  ├── Header / Topbar
  ├── Main (PortalRenderer / blocks)
  └── Footer premium
```

### Panel administrativo

```
ConfigurationLayout
  ├── Sidebar (nav)
  ├── Topbar + Breadcrumbs
  └── Content area (max-w-7xl)
```

Clases compartidas: `adminUi` en `src/lib/admin/admin-ui.ts`.

---

## Grid responsivo

```tsx
<Grid cols={1} mdCols={2} lgCols={3} gap={6}>
  {items.map(...)}
</Grid>
```

**Cuándo usar `cols={1}`:** Siempre mobile-first; aumentar columnas en `md`/`lg`.

---

## Z-index

Jerarquía en `src/design/tokens/z-index.ts`:

| Capa | Uso |
| --- | --- |
| `dropdown` | Menús desplegables |
| `modal` | Diálogos |
| `drawer` | Paneles laterales |
| `toast` | Notificaciones (futuro) |

No inventar `z-[9999]`.

---

## Revisión responsive

Antes de aprobar UI, verificar en **mobile (< 768px)**, **tablet (768–1024px)** y **desktop (> 1024px)**. Ver [CONTRIBUTING.md](./CONTRIBUTING.md#revisión-visual-qa).
