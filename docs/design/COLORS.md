# Colores

**Fuentes:** `src/styles/tokens/brand.css` (Master) + `colors.css` (alias) + `site_config.branding` (Espacio).  
**Contrato:** [BRANDING-SYSTEM.md](./BRANDING-SYSTEM.md) — Growth OS Master ≠ identidad del Espacio.

---

## Paleta Master Growth OS (`--growth-os-*`)

Solo para `/platform`, login global y estados sin Espacio (`PlatformNeutralTheme`).

| Token | Rol |
| --- | --- |
| `--growth-os-primary` | Primario de producto |
| `--growth-os-secondary` | Secundario |
| `--growth-os-accent` | Acento |
| `--growth-os-success` | Éxito |
| `--growth-os-light` | Warning / acento cálido |

Los nombres `--sem-*` en `:root` son **alias legacy** hacia Master. No representan al tenant SEM.

---

## Identidad del Espacio (`--brand-*`)

Cada Site inyecta colores desde `site_config` en `layout.tsx`. En `body`, `--color-*` sigue `--brand-*`. SEM/ADL/futuros clientes no comparten paleta.

Edición: `/admin/config?section=branding` (`BrandingPanel`).

---

## Alias semánticos (`--color-*`)

Consumir estos en componentes y CSS (nunca HEX de cliente):

| Alias | Origen típico | Cuándo usar |
| --- | --- | --- |
| `--color-primary` | `--brand-primary` o Master | Texto/fondo de marca |
| `--color-secondary` | `--brand-secondary` o Master | Enlaces, acciones secundarias |
| `--color-accent` | Master / tokens | Destacados interactivos |
| `--color-success` | tokens | Feedback positivo |
| `--color-warning` | tokens | Advertencias no críticas |
| `--color-danger` | tokens | Errores, eliminación |
| `--color-link` | secondary | Hipervínculos en prosa |
| `--color-action` | accent | Acciones primarias en formularios |

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
/platform          → PlatformNeutralTheme → --growth-os-*
Espacio A (SEM)    → site_config A → --brand-* → --color-*
Espacio B (ADL)    → site_config B → --brand-* → --color-*
Espacio N (futuro) → site_config N → --brand-* → --color-*
         ↓
Componentes sin cambios (solo tokens semánticos)
```

Cambiar un Espacio no altera otro ni la paleta Master.

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
