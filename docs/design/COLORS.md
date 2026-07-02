# Colores

**Fuente única:** `src/styles/tokens/brand.css` y `src/styles/tokens/colors.css`

---

## Paleta de marca (`--sem-*`)

| Token | Rol | Cuándo usar |
| --- | --- | --- |
| `--sem-primary` | Identidad principal | Headers, fondos hero, textos de alto contraste, botones primarios |
| `--sem-secondary` | Soporte y enlaces | Links, botones secundarios, estados hover de navegación |
| `--sem-accent` | Destaque y foco | CTAs destacados, badges info, anillos de foco, iconografía activa |
| `--sem-success` | Confirmación | Estados completados, validación OK, badges success |
| `--sem-light` | Acento suave | Advertencias leves, highlights decorativos, badges warning |

**No agregar colores a `brand.css` sin aprobación de arquitectura.**

---

## Alias semánticos (`--color-*`)

Consumir estos en componentes y CSS:

| Alias | Resuelve a | Cuándo usar |
| --- | --- | --- |
| `--color-primary` | `--sem-primary` | Texto/fondo de marca |
| `--color-secondary` | `--sem-secondary` | Enlaces, acciones secundarias |
| `--color-accent` | `--sem-accent` | Destacados interactivos |
| `--color-success` | `--sem-success` | Feedback positivo |
| `--color-warning` | `--sem-light` | Advertencias no críticas |
| `--color-danger` | escala UI | Errores, eliminación |
| `--color-link` | `--sem-secondary` | Hipervínculos en prosa |
| `--color-action` | `--sem-accent` | Acciones primarias en formularios |

Clases Tailwind mapeadas: `bg-primary`, `text-secondary`, `border-accent`, `text-success`, `text-muted`, etc.

---

## Escala neutra (`--gray-*`)

| Rango | Uso |
| --- | --- |
| `50–200` | Fondos suaves, bordes ligeros |
| `300–500` | Bordes, placeholders, texto auxiliar |
| `600–900` | Texto body, fondos oscuros (dark mode) |

**Cuándo usar:** Separadores, cards, sidebar admin, estados disabled — nunca `zinc-*` ni `slate-*`.

---

## Estados UI (`--state-*`)

| Familia | Cuándo usar |
| --- | --- |
| `--state-success-*` | Banners, alerts y badges de éxito |
| `--state-warning-*` | Avisos revisables, estados pendientes |
| `--state-danger-*` | Errores de formulario, acciones destructivas |
| `--state-info-*` | Mensajes informativos neutros |

Ejemplo admin: `adminUi.errorBanner` en `src/lib/admin/admin-ui.ts`.

---

## Flujo multi-tenant

```
Tenant A: brand.css → --sem-primary: #002A47
Tenant B: brand.css → --sem-primary: #003366  (solo tokens de marca)
         ↓
colors.css hereda alias automáticamente
         ↓
Componentes sin cambios
```

---

## Uso en código

```tsx
// ✅ Correcto
<button className="bg-primary text-text-inverse hover:bg-secondary" />
<p className="text-[var(--color-danger)]" />

// ✅ CSS
.card { border-color: var(--border); background: var(--background); }

// ❌ Prohibido
<div className="bg-zinc-800 text-amber-500" />
<div style={{ color: '#002A47' }} />
```

---

## Validación

```bash
npm run check:branding
```

Ver [BRANDING-SYSTEM.md](./BRANDING-SYSTEM.md) para reglas CI completas.
