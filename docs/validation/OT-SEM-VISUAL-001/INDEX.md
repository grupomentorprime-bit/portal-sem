# OT-SEM-VISUAL-001 — Índice de Validación Visual Final

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-VISUAL-001 |
| Estado | **Pendiente de aprobación visual** |
| Fecha capturas | 2026-07-04 (regeneradas para entrega final) |
| Flag activo | `ADMIN_SHELL_V2=true` ✅ |
| URL captura | `http://localhost:3000` |
| Script | `scripts/capture-admin-dashboard-visual.mjs` |

---

## Estado del código al momento de las capturas

| Campo | Valor |
| --- | --- |
| **Commit base (HEAD)** | `0dcd6f6e13e6dd3ae526c4e5c7b561f1885d1212` |
| **Autor HEAD** | grupomentorprime-bit |
| **Fecha HEAD** | 2026-07-03 00:58:14 -0400 |
| **Mensaje HEAD** | `s` |
| **Estado** | **Working tree con cambios sin commit** (implementación OT-SEM-VISUAL-001) |

### Archivos relevantes incluidos en las capturas (sin commit)

| Archivo | Cambio |
| --- | --- |
| `src/components/admin/AdminDashboardClient.tsx` | Dashboard AEK reescrito |
| `src/app/admin/page.tsx` | Eliminado `AdminPageFrame` legacy |
| `src/app/dev-preview/admin-dashboard/page.tsx` | Ruta preview DESPUÉS/ANTES |
| `src/components/admin/preview/*` | Shell preview + legacy + mock data |
| `scripts/capture-admin-dashboard-visual.mjs` | Script de captura |
| `.env` | `ADMIN_SHELL_V2=true` |
| `.env.example` | Flag documentado y activado |
| `package.json` / `package-lock.json` | `playwright` devDependency |

> Las capturas reflejan el **código en disco actual**, no únicamente el commit `0dcd6f6e`. Para reproducir exactamente: checkout `0dcd6f6e` + aplicar los archivos listados arriba, o usar el working tree actual.

---

## Confirmación `ADMIN_SHELL_V2=true`

| Verificación | Resultado |
| --- | --- |
| `.env` local | `ADMIN_SHELL_V2=true` (línea 11) |
| `.env.example` | `ADMIN_SHELL_V2=true` |
| Preview DESPUÉS | `DashboardVisualPreviewShell shellV2={true}` |
| Preview ANTES | `shellV2={false}` (comparativa legacy) |
| Servidor dev | Carga `.env` al arrancar (`Environments: .env`) |

Las capturas **DESPUÉS** muestran **Sidebar + TopBar V2**. Las capturas **ANTES** usan deliberadamente Shell V1 para comparativa.

---

## Índice de capturas

Ruta base: `docs/validation/OT-SEM-VISUAL-001/screenshots/`

### Nombres canónicos → archivos

| Nombre solicitado | Archivo | Viewport | Descripción |
| --- | --- | --- | --- |
| **after-dashboard.png** | `comparativa/02-DESPUES-shell-v2-moderno.png` | 1920×1080 | Comparativa principal DESPUÉS |
| **before-dashboard.png** | `comparativa/01-ANTES-shell-v1-legacy.png` | 1920×1080 | Comparativa principal ANTES |
| **dashboard-desktop.png** | `despues/dashboard-escritorio-1920.png` | 1920×1080 | Viewport escritorio (above the fold) |
| **dashboard-desktop-full.png** | `despues/dashboard-completo-1920.png` | 1920×1080 | Full page escritorio |
| **dashboard-tablet.png** | `despues/dashboard-tablet-768.png` | 768×1024 | Responsive tablet |
| **dashboard-mobile.png** | `despues/dashboard-mobile-390.png` | 390×844 | Responsive móvil |
| **before-desktop-full.png** | `antes/dashboard-legacy-1920.png` | 1920×1080 | Legacy full page |
| **before-tablet.png** | `antes/dashboard-legacy-tablet-768.png` | 768×1024 | Legacy tablet |
| **before-mobile.png** | `antes/dashboard-legacy-mobile-390.png` | 390×844 | Legacy móvil |

### Inventario completo (9 archivos PNG)

```
screenshots/
├── comparativa/
│   ├── 01-ANTES-shell-v1-legacy.png      ← before-dashboard.png
│   └── 02-DESPUES-shell-v2-moderno.png   ← after-dashboard.png
├── despues/
│   ├── dashboard-completo-1920.png       ← dashboard-desktop-full.png
│   ├── dashboard-escritorio-1920.png     ← dashboard-desktop.png
│   ├── dashboard-tablet-768.png          ← dashboard-tablet.png
│   └── dashboard-mobile-390.png          ← dashboard-mobile.png
└── antes/
    ├── dashboard-legacy-1920.png           ← before-desktop-full.png
    ├── dashboard-legacy-tablet-768.png     ← before-tablet.png
    └── dashboard-legacy-mobile-390.png     ← before-mobile.png
```

---

## Rutas de preview utilizadas

| Variante | URL |
| --- | --- |
| DESPUÉS (Shell V2 + AEK) | `/dev-preview/admin-dashboard` |
| ANTES (Shell V1 + legacy) | `/dev-preview/admin-dashboard?variant=legacy` |

> Mismos componentes que producción (`AdminDashboardClient` + `AdminShell`). La ruta productiva `/admin` requiere sesión Keycloak; la preview usa datos mock equivalentes para comparación justa.

---

## Checklist visual (para aprobación)

### Ya no existen en DESPUÉS
- [ ] Menú horizontal principal
- [ ] Hero legacy (`AdminModuleHero`)
- [ ] `AdminModuleStats`
- [ ] Tarjetas stat duplicadas
- [ ] Encabezados triples

### Existen en DESPUÉS
- [ ] Sidebar izquierdo
- [ ] TopBar
- [ ] Dashboard moderno (banda gradiente SEM)
- [ ] 4 KPIs (`KpiCard`)
- [ ] Acciones rápidas (`QuickActions`)
- [ ] Panel lateral (escritorio ≥ xl)
- [ ] Responsive tablet / móvil
- [ ] Alineación visual con Asuntos Estudiantiles

---

## Regenerar capturas

```powershell
npm run dev
node scripts/capture-admin-dashboard-visual.mjs
```

---

## Cierre oficial

Marcar OT-SEM-VISUAL-001 como **Completada** tras revisión visual de este índice y las capturas en `screenshots/`.
