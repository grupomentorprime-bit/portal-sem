# OT-DESIGN-PROGRAMS-003 — Premium Editorial Cards v3

| Atributo | Valor |
| --- | --- |
| OT | OT-DESIGN-PROGRAMS-003 |
| Dependencia | OT-DESIGN-PROGRAMS-002 |
| Prioridad | Alta |
| Estado | Completada |
| Fecha cierre | 2026-07-01 |

## Objetivo

Transformar el bloque **Programas Destacados** (`[data-block="academic_offer"]`) en una experiencia editorial premium con fotografías reales, jerarquía visual clara, información académica y económica completa.

## Alcance

- Solo bloque Programas Destacados
- Sin cambios a Hero global, Header, Footer, CMS ni APIs

## Entregables

### Componentes (`src/components/portal/programs/`)

| Componente | Rol |
| --- | --- |
| `FeaturedProgramCard` | Tarjeta principal 40/60 |
| `ProgramMiniCard` | Tarjetas secundarias compactas 30/70 |
| `ProgramMeta` | Grilla académica (modalidad, duración, certificación, inicio) |
| `ProgramPrice` | Matrícula, mensualidad, nota de cuotas |
| `ProgramCTA` | Botón textual + círculo secundario |
| `ProgramCardMedia` | Imagen editorial con overlay hover |
| `ProgramBadge` | Badge de generación bajo título |

### Estilos

- `src/styles/home-premium/programs-home.css` — tokens `--sem-*` de `brand.css`

### Imágenes demo

- `public/images/demo/programs/` — fotografías editoriales temporales (Unsplash)
- Rutas centralizadas en `src/lib/portal/program-demo-assets.ts`

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Jerarquía: card principal + 2 secundarias | ✅ |
| Proporción 40/60 principal, 30/70 secundarias | ✅ |
| Fotografías reales sin placeholders | ✅ |
| Grilla académica completa | ✅ |
| Información económica visible | ✅ |
| CTA textual + acción circular | ✅ |
| Barra de confianza rediseñada | ✅ |
| Paleta corporativa SEM exclusiva | ✅ |
| Espaciados 120/64/32 px | ✅ |
| Hover suave 250 ms | ✅ |
| Responsive 390–1920 px | ✅ |

## Sustitución de imágenes

Reemplazar archivos en `public/images/demo/programs/` manteniendo los mismos nombres definidos en `program-demo-assets.ts`. No requiere cambios de código.
