# OT-GROWTH-PLATFORM-ADMIN-004 — Entrar a Espacio y cierre V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PLATFORM-ADMIN-004 |
| ADR | [ADR-004](../../architecture/ADR-004.md), [ADR-008](../../architecture/ADR-008.md), [ADR-009](../../architecture/ADR-009.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | El operador puede pasar de la consola global al backoffice de un cliente usando únicamente membresía real + switch seguro, sin reabrir bypasses |

## Objetivo

Permitir que un operador de Growth OS entre a administrar un Espacio existente **sin impersonación ni bypass**, usando el modelo actual de membresía + switch.

## Contrato

| Pieza | Significado |
| --- | --- |
| `POST /api/identity/spaces/switch` | Cambio de Espacio activo (membresía obligatoria) |
| `POST /api/platform/spaces/:tenantId/access` | Alta explícita de acceso acotado (rol Soporte) |
| UI ficha | **Entrar al Espacio** + mensaje claro sin membresía |
| `requirePlatformOperator` | Gate de Platform Admin (no usa Espacio activo) |

### Reutilizado (obligatorio)

- `identity_memberships`
- Roles existentes del Espacio (`support`)
- `POST /api/identity/spaces/switch`
- `requirePlatformOperator`
- `identity_audit`

## Comportamiento

1. En `/platform/spaces/:tenantId` → acción **Entrar al Espacio**.
2. Si el operador tiene membresía activa → switch seguro → `/admin`.
3. Si no tiene membresía → no entra por bypass.
4. Mensaje: **Necesitas acceso a este Espacio para entrar.**
5. Alta de acceso (explícita, mínima):
   - crea membresía real;
   - rol `support` (Soporte);
   - **nunca** `super_admin` / Dueño automático;
   - auditoría `scope: "platform"` · `platform.space.access.grant`.

## Prohibido

- `?tenant=`
- Headers de spoof
- Impersonación / “modo dios”
- Saltar membresía
- Usar `platform_owner` como permiso interno del cliente
- Crear Owner invisible

## UX

- Platform Admin: **Entrar al Espacio**
- Dentro del cliente: nombre del Espacio + `/admin` normal
- Sin conceptos técnicos de impersonación

## Fuera de alcance

Planes, CRM, Growth Core, UI de gestión de operadores, DNS/TLS.

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

Casos: operador con membresía entra; sin membresía no entra; acceso acotado ≠ Owner; admin SEM sin rol global denegado; switch no mezcla SEM/ADL; auditoría registrada.

## Criterios de aceptación

- [x] Entrar al Espacio vía membresía + `POST /api/identity/spaces/switch`
- [x] Sin membresía → mensaje claro; sin bypass
- [x] Alta acotada `support` + auditoría platform (nunca Owner)
- [x] Baseline + typecheck + build

## Veredicto

**APTO** — el operador pasa de `/platform` al backoffice del cliente solo con membresía real + `POST /api/identity/spaces/switch`. Acceso acotado opcional (`POST /api/platform/spaces/:tenantId/access`) crea rol Soporte, nunca Dueño. Sin impersonación, sin `?tenant=`, sin spoof. Admin SEM sin rol global denegado. Auditoría `platform.space.access.grant`. `test:baseline` 146 pass / 0 fail, `tsc --noEmit`, `npm run build`.

---

## PLATFORM ADMIN V1 — CERRADA · APTO

| OT | Entrega |
| --- | --- |
| [PROD-005](../OT-GROWTH-PROD-005/README.md) | Operador de Growth OS / frontera |
| [PLATFORM-ADMIN-002](../OT-GROWTH-PLATFORM-ADMIN-002/README.md) | Catálogo y ficha |
| [PLATFORM-ADMIN-003](../OT-GROWTH-PLATFORM-ADMIN-003/README.md) | Crear Espacio |
| **PLATFORM-ADMIN-004** | Entrar a Espacio |

Cierre V1: consola global mínima operativa (listar, ver, crear, entrar) sobre el core multi-tenant existente, sin reabrir bypasses ni mezclar Growth Core.
