# Biblioteca del Inspector — Visual Experience Builder

| Atributo | Valor |
| --- | --- |
| OT | OT-CMSV2-COMPONENTS-001 |
| Épica | EP-001A — Portal CMS |
| Dependencia | [OT-CMSV2-DESIGN-001](../ot/OT-CMSV2-DESIGN-001.md) |
| Complementa | [VISUAL-EXPERIENCE-BUILDER.md](./VISUAL-EXPERIENCE-BUILDER.md), [CMS-UX-GUIDELINES.md](./CMS-UX-GUIDELINES.md) |
| Código | `src/components/visual-builder/inspector/` |

## Propósito

Esta biblioteca estandariza **cómo se editan los bloques** del Portal en el Visual Experience Builder. Es el equivalente editorial al Experience Kit: todos los bloques (Hero, Programas, Noticias, CTA, etc.) comparten la misma anatomía, campos y patrones de interacción.

No implementa bloques concretos ni el layout de tres columnas (eso corresponde a OT-CMSV2-BUILD-001A).

## Anatomía canónica

Todo inspector de bloque debe organizar sus campos en este orden fijo:

| Orden | Sección | Contenido típico |
| --- | --- | --- |
| 1 | **Contenido** | Título, descripción, texto, enlaces |
| 2 | **Multimedia** | Imagen, video, galería |
| 3 | **Diseño** | Alineación, espaciado, tipografía, color, columnas, ancho |
| 4 | **Visibilidad** | Desktop, tablet, móvil |
| 5 | **Configuración** | Dirección web (slug), ancla, animación |
| 6 | **Acciones** | Duplicar, ocultar, eliminar |

Use `InspectorAccordion` o `InspectorSection` para respetar el orden. Las constantes `INSPECTOR_SECTION_ORDER` y `INSPECTOR_SECTION_LABELS` en `types.ts` son la fuente de verdad.

## Estructura de archivos

```
src/components/visual-builder/
└── inspector/
    ├── InspectorPanel.tsx       # Panel lateral / drawer
    ├── InspectorSection.tsx     # Sección con título canónico
    ├── InspectorAccordion.tsx   # Acordeón con orden institucional
    ├── InspectorToolbar.tsx     # Cabecera del panel
    ├── InspectorFooter.tsx      # Pie con acciones globales
    ├── fields/                  # Campos de formulario
    ├── media/                   # Selectores vía Biblioteca Institucional
    ├── layout/                  # Alineación, columnas, visibilidad
    └── shared/                  # Label, hint, divider, empty, actions
```

Importación recomendada:

```tsx
import {
  InspectorPanel,
  InspectorAccordion,
  InspectorTextField,
  InspectorImagePicker,
  InspectorActions,
} from "@/components/visual-builder";
```

## Shell del panel

### InspectorPanel

Panel lateral fijo en escritorio (`lg+`). En tablet y móvil se renderiza como `Drawer` controlado por `mobileOpen` / `onMobileClose`.

```tsx
<InspectorPanel
  title="Hero principal"
  subtitle="Bloque de portada"
  mobileOpen={inspectorOpen}
  onMobileClose={() => setInspectorOpen(false)}
  footer={<Button size="sm">Guardar cambios</Button>}
>
  <InspectorAccordion sections={[...]} />
</InspectorPanel>
```

### InspectorAccordion

Agrupa secciones canónicas en orden automático. La primera sección abre por defecto.

```tsx
<InspectorAccordion
  sections={[
    {
      id: "content",
      defaultOpen: true,
      children: (
        <>
          <InspectorTextField label="Título" value={title} onChange={setTitle} />
          <InspectorTextarea label="Descripción" value={desc} onChange={setDesc} />
        </>
      ),
    },
    {
      id: "media",
      children: (
        <InspectorImagePicker tenant={tenant} label="Imagen" value={imageId} onChange={setImageId} />
      ),
    },
    {
      id: "actions",
      children: (
        <InspectorActions onDuplicate={dup} onHide={hide} onDelete={del} />
      ),
    },
  ]}
/>
```

## Campos (`fields/`)

| Componente | Uso |
| --- | --- |
| `InspectorTextField` | Texto corto |
| `InspectorTextarea` | Párrafos y descripciones |
| `InspectorSelect` | Lista de opciones |
| `InspectorToggle` | Activar/desactivar |
| `InspectorRadioGroup` | Elección única visible |
| `InspectorColor` | Color de acento o fondo |
| `InspectorSpacing` | Presets de espaciado |
| `InspectorTypography` | Tamaño y peso tipográfico |
| `InspectorLink` | Etiqueta + URL + nueva pestaña |
| `InspectorSlug` | Dirección web (sin jerga técnica) |
| `InspectorDate` | Fechas editoriales |

Todos extienden `InspectorFieldBaseProps`: `label`, `hint`, `error`, `disabled`, `loading`, `required`.

Envoltorio interno: `InspectorFieldFrame` (label + hint + error + control).

## Multimedia (`media/`)

| Componente | Integración |
| --- | --- |
| `InspectorImagePicker` | `MediaField` → Biblioteca Institucional |
| `InspectorVideoPicker` | Carpeta `Videos` por defecto |
| `InspectorGalleryPicker` | Selección múltiple de imágenes |

### Reglas obligatorias

- **Nunca** input de URL como flujo principal.
- **Nunca** `<input type="file">` nativo como flujo principal.
- Siempre abrir la Biblioteca de Medios (`MediaField` / `MediaPicker`).

## Layout (`layout/`)

| Componente | Uso |
| --- | --- |
| `InspectorAlignment` | Izquierda / centro / derecha |
| `InspectorColumns` | 1–4 columnas |
| `InspectorWidth` | Ancho del bloque |
| `InspectorVisibility` | Mostrar/ocultar por dispositivo |
| `InspectorResponsive` | Agrupa visibilidad responsive |

## Shared

| Componente | Uso |
| --- | --- |
| `InspectorLabel` | Etiqueta accesible |
| `InspectorHint` | Ayuda contextual bajo el campo |
| `InspectorDivider` | Separador visual |
| `InspectorEmpty` | Estado sin bloque seleccionado |
| `InspectorActions` | Duplicar, ocultar, eliminar |

## Convenciones de copy

| Evitar | Usar |
| --- | --- |
| Slug | Dirección web |
| URL / href (en UI) | Enlace / Destino |
| JSON, props, schema | (no mostrar) |
| Upload | Elegir de la biblioteca |
| Asset / media ID | Imagen / Video |

Las etiquetas deben ser comprensibles para un editor sin formación técnica. Cada campo debe incluir `hint` cuando el propósito no sea obvio.

## Estados

Todos los campos soportan:

| Estado | Comportamiento |
| --- | --- |
| Vacío | Placeholder o `InspectorEmpty` en el panel |
| Error | Mensaje bajo el campo (`error` prop) |
| Deshabilitado | `opacity-60`, `aria-disabled` |
| Cargando | Indicador en campos que lo requieran (`loading` prop) |

## Accesibilidad

- Navegación completa por teclado.
- `label` asociado a cada control (`htmlFor` / `id`).
- Foco visible (Experience Kit `focusRing`).
- Mensajes de error con `role="alert"`.
- Panel con `aria-label="Propiedades del bloque"`.
- Contraste WCAG AA.

## Responsive

| Viewport | Comportamiento |
| --- | --- |
| Escritorio (`lg+`) | Columna fija derecha, `max-w-[20rem]` |
| Tablet | Drawer lateral derecho |
| Móvil | Drawer a pantalla completa (`min-h-[70vh]`) |

## Buenas prácticas

1. **Un bloque = un acordeón** con secciones canónicas; no inventar agrupaciones ad hoc.
2. **Hints en campos no obvios** — animación, ancla, visibilidad por dispositivo.
3. **Medios siempre desde biblioteca** — coherencia con OT de Medios.
4. **Acciones al final** — duplicar/ocultar/eliminar solo en sección Acciones.
5. **Tipado fuerte** — exportar interfaces de props por componente.
6. **Sin lógica de bloque en la biblioteca** — los inspectores de Hero/Programas viven en sus propios módulos y consumen estos primitivos.

## Anti-patrones

| Anti-patrón | Por qué evitarlo |
| --- | --- |
| Campo JSON o textarea de código | Rompe la promesa “sin conocimientos técnicos” |
| Input URL para imágenes | Bypass de biblioteca, sin metadatos ni gobernanza |
| Secciones en orden distinto | Inconsistencia entre bloques |
| Duplicar estilos del panel | Usar `inspectorStyles` y `InspectorFieldFrame` |
| Lógica de guardado en campos | El panel solo edita estado; el builder persiste |
| Jerga de desarrollo en labels | Viola CMS-UX-GUIDELINES |

## Ejemplo completo (bloque ficticio)

```tsx
function ExampleBlockInspector({ block, tenant, onChange, onDelete }: Props) {
  return (
    <InspectorAccordion
      sections={[
        {
          id: "content",
          defaultOpen: true,
          children: (
            <>
              <InspectorTextField
                label="Título"
                hint="Aparece como encabezado principal del bloque."
                value={block.title}
                onChange={(title) => onChange({ ...block, title })}
              />
              <InspectorTextarea
                label="Descripción"
                value={block.description}
                onChange={(description) => onChange({ ...block, description })}
              />
            </>
          ),
        },
        {
          id: "media",
          children: (
            <InspectorImagePicker
              tenant={tenant}
              label="Imagen"
              value={block.imageId}
              onChange={(imageId) => onChange({ ...block, imageId })}
            />
          ),
        },
        {
          id: "design",
          children: (
            <>
              <InspectorAlignment
                label="Alineación"
                value={block.alignment}
                onChange={(alignment) => onChange({ ...block, alignment })}
              />
              <InspectorSpacing
                label="Espaciado"
                value={block.spacing}
                onChange={(spacing) => onChange({ ...block, spacing })}
              />
            </>
          ),
        },
        {
          id: "visibility",
          children: (
            <InspectorResponsive
              value={block.visibility}
              onChange={(visibility) => onChange({ ...block, visibility })}
            />
          ),
        },
        {
          id: "config",
          children: (
            <InspectorSlug
              label="Dirección web"
              value={block.slug}
              onChange={(slug) => onChange({ ...block, slug })}
            />
          ),
        },
        {
          id: "actions",
          children: <InspectorActions onDelete={onDelete} />,
        },
      ]}
    />
  );
}
```

## Criterios de aceptación (OT-CMSV2-COMPONENTS-001)

- [x] Biblioteca completa en `src/components/visual-builder/inspector/`
- [x] Componentes desacoplados de bloques específicos
- [x] Medios vía Biblioteca Institucional
- [x] Compatible con Experience Kit y CMS-UX-GUIDELINES
- [x] Documentación en este archivo
- [x] `npm run build` ✅
- [x] `npm run check:branding` ✅

## Siguiente paso

**OT-CMSV2-BUILD-001A** — Núcleo del Visual Experience Builder: layout de tres columnas (estructura | canvas | inspector) reutilizando esta biblioteca.
