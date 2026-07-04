# OT-SEM-VISUAL-001 — Validación Visual del Dashboard

Estado: **Pendiente de Validación Visual** — evidencias generadas 2026-07-04

---

## Cómo reproducir las capturas

```powershell
# 1. Confirmar flag activo
#    .env → ADMIN_SHELL_V2=true

# 2. Servidor de desarrollo
npm run dev

# 3. Playwright (una vez)
npx playwright install chromium

# 4. Capturas
node scripts/capture-admin-dashboard-visual.mjs
```

Salida: `docs/validation/OT-SEM-VISUAL-001/screenshots/`

---

## Rutas de captura

| Variante | URL | Propósito |
| --- | --- | --- |
| **DESPUÉS** | `/dev-preview/admin-dashboard` | Shell V2 + `AdminDashboardClient` AEK |
| **ANTES** | `/dev-preview/admin-dashboard?variant=legacy` | Shell V1 + dashboard legacy (commit anterior) |

> Las rutas `/dev-preview/*` solo existen en `NODE_ENV=development` y usan datos mock idénticos en ambas variantes para comparación justa.

> La ruta productiva `/admin` requiere sesión Keycloak; la preview usa los **mismos componentes** que producción.

---

## Entregables

### 1–4. Capturas responsive (DESPUÉS)

| Archivo | Viewport |
| --- | --- |
| `screenshots/despues/dashboard-completo-1920.png` | 1920×1080 full page |
| `screenshots/despues/dashboard-escritorio-1920.png` | 1920×1080 viewport |
| `screenshots/despues/dashboard-tablet-768.png` | 768×1024 |
| `screenshots/despues/dashboard-mobile-390.png` | 390×844 |

### 5. Comparativa ANTES → DESPUÉS

| Archivo | Descripción |
| --- | --- |
| `screenshots/comparativa/01-ANTES-shell-v1-legacy.png` | Menú horizontal + hero legacy |
| `screenshots/comparativa/02-DESPUES-shell-v2-moderno.png` | Sidebar + dashboard AEK |
| `screenshots/antes/dashboard-legacy-1920.png` | ANTES full page |

---

## Checklist de validación visual (evidencia automatizada)

### Ya NO existen en DESPUÉS ✅

| Elemento legacy | Evidencia |
| --- | --- |
| Menú horizontal 11 ítems | `comparativa/01-ANTES` lo muestra; `02-DESPUES` tiene sidebar |
| Hero legacy `AdminModuleHero` | Eliminado — banda bienvenida AEK en gradiente |
| `AdminModuleStats` coloridas | Reemplazadas por `KpiCard` blancos |
| Tarjetas stat duplicadas | Grid inferior eliminado |
| Encabezados duplicados | Un solo `ModuleHeader` + contenido |

### Existen en DESPUÉS ✅

| Elemento | Evidencia |
| --- | --- |
| Sidebar izquierdo | `despues/dashboard-completo-1920.png` |
| TopBar | Todas las capturas DESPUÉS |
| Dashboard moderno | Banda gradiente + alertas + KPIs |
| KPIs (4) | Fila `KpiCard` visible |
| Acciones rápidas | Grid 3×3 `QuickActions` |
| Panel lateral | Columna derecha en 1920 (`Estado del sistema`, `Próximas acciones`) |
| Responsive | `dashboard-tablet-768.png`, `dashboard-mobile-390.png` |
| Alineación Asuntos Estudiantiles | Mismo gradiente SEM, KpiCard, QuickActions |

---

## Checklist de validación visual (aprobación humana pendiente)

---

## Criterio de cierre

La OT pasa de **Pendiente de Validación Visual** a **Completada** cuando:

1. El responsable SEM revisa las capturas en `screenshots/`
2. Confirma checklist anterior en producción (`/admin` con sesión real)
3. Aprueba explícitamente el contraste ANTES/DESPUÉS

**No iniciar nuevas OTs de modernización visual hasta esta aprobación.**

---

## Notas

- Reiniciar `npm run dev` tras cambiar `ADMIN_SHELL_V2` en `.env`
- Si Playwright falla en Windows: ver `docs/demo/screenshots/README.md` (lockfile)
