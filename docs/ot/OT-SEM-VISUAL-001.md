# OT-SEM-VISUAL-001 — Modernización Visual del Dashboard Principal

| Atributo | Valor |
| --- | --- |
| Estado | **Pendiente de Validación Visual** — evidencias en `docs/validation/OT-SEM-VISUAL-001/screenshots/` |
| Fecha | 2026-07-03 |
| Ruta | `/admin` |

---

## Cambio visual (ANTES → DESPUÉS)

| Antes | Después |
| --- | --- |
| `AdminPageFrame` + hero gradiente legacy | `AdminModulePage` + banda bienvenida AEK |
| Menú horizontal sin sidebar | **Shell V2 activado** (`ADMIN_SHELL_V2=true`) |
| `AdminModuleStats` cards coloridas | `KpiCard` × 4 en grid AEK |
| Stats duplicados + H2 welcome suelto | Jerarquía única: bienvenida → KPIs → acciones |
| `AdminQuickActions` legacy | `QuickActions` + `SummaryCard` AEK |
| Grid 2 col estático | Workspace con **panel lateral** (estado, próximas acciones, actividad) |
| Sin alertas | `AlertBanner` para invitaciones y portal en revisión |

---

## Componentes AEK utilizados

`AdminModulePage` · `ModuleHeader` · `KpiCard` · `ContentGrid` · `QuickActions` · `Section` · `StatusBadge` · `AlertBanner` · `Timeline` · `Button`

---

## Configuración requerida

```env
ADMIN_SHELL_V2=true
```

Sin este flag el dashboard usa AEK internamente pero el chrome global sigue en V1 (menú horizontal).

---

## Verificación

1. Reiniciar `npm run dev` tras cambio en `.env`
2. Abrir `http://localhost:3000/admin`
3. Confirmar: sidebar izquierdo + topbar + banda gradiente + KPIs blancos + panel lateral derecho

---

## Sin cambios en

APIs · permisos · queries de datos · lógica de auditoría · rutas
