# OT-GROWTH-PLATFORM-ADMIN-003 — Crear Espacio

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PLATFORM-ADMIN-003 |
| ADR | [ADR-004](../../architecture/ADR-004.md), [ADR-008](../../architecture/ADR-008.md), [ADR-009](../../architecture/ADR-009.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | Un operador de Growth OS puede crear un Espacio desde Platform Admin usando el motor existente, sin romper aislamiento ni introducir lógica por cliente |

## Objetivo

Permitir que un operador autorizado cree un nuevo Espacio desde Platform Admin reutilizando `provisionTenantFoundation`.

No crear un segundo motor de provisión.

## Contrato

| Pieza | Significado |
| --- | --- |
| `createPlatformSpace` | Orquestación Platform Admin → `provisionTenantFoundation` |
| `POST /api/platform/spaces` | Alta protegida |
| UI `/platform` | Botón **Crear Espacio** + formulario simple + resumen |

### Campos mínimos

- Nombre del Espacio
- Slug
- Tipo (`institution` \| `academy`)
- Dominio/subdominio inicial
- Nombre del Sitio
- Dueño inicial opcional (cuenta existente)

### Reglas

- Usa `provisionTenantFoundation` (plantilla `createDefaultSiteConfig`, sin pack SEM)
- No hardcodea ADL / Mentor Prime
- Dueño opcional solo si la identidad existe; el operador **no** queda Owner automáticamente
- Slug y host únicos (errores claros); replay mismo slug+host es idempotente
- Auditoría `identity_audit` con `scope: "platform"` y acción `platform.space.create`

### UX

- Botón: Crear Espacio
- Éxito: Espacio creado
- Resumen: nombre, Sitio, dominio, estado

## Fuera de alcance

Planes, cobros, wizard largo, branding avanzado, importaciones, Growth Core.

## Seguridad

- Toda API bajo `requirePlatformOperator`
- Admin de SEM sin rol global → denegado
- No depende del Espacio activo

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

Casos: operador crea Espacio válido; admin SEM sin rol global denegado; slug/host duplicados; sin branding/contenido SEM; operador no Owner automático; catálogo muestra el nuevo Espacio.

## Criterios de aceptación

- [x] `createPlatformSpace` → `provisionTenantFoundation` (sin segundo motor)
- [x] `POST /api/platform/spaces` + UI Crear Espacio
- [x] Validación slug/host + dueño opcional seguro + auditoría platform
- [x] Baseline + typecheck + build

## Veredicto

**APTO** — un operador de Growth OS puede crear un Espacio desde `/platform` (`Crear Espacio` → `POST /api/platform/spaces` → `createPlatformSpace` → `provisionTenantFoundation`) sin segundo motor ni seeds SEM/ADL. Slug/host duplicados con error claro; replay mismo slug+host idempotente; operador no queda Owner automáticamente; auditoría `scope: "platform"` (`platform.space.create`). Admin de SEM sin rol global denegado. `test:baseline` 124 pass / 0 fail, `tsc --noEmit`, `npm run build`.
