# Llaves de aplicación por persona — Implementation Plan

> **For agentic workers:** Steps use checkbox syntax for tracking.

**Goal:** Autorizar por persona el acceso a Growth OS, Cumple, Aprende Hoy y RR.HH. dentro del plan del Espacio, gestionado desde NELZURI.

**Architecture:** Techo en `tenants.contractedApps` (Plataforma → Clientes). Llave en `identity_memberships.authorizedApps`. Resolución por intersección. Dock oculta sin llave; `/admin` exige llave `growth-os` en servidor.

**Tech Stack:** Next.js, Mongo, membresías Identity existentes, escritorio NELZURI.

## Global Constraints

- No SSO. No tocar seguridad interna de cada app.
- Migración materializa solo el techo vigente; contratar después no reparte llaves.
- Separación entre Espacios y capacidades de operador de plataforma.

---

### Task 1: Reglas puras + contrato

- [x] `src/lib/desktop/app-access.ts`
- [x] `desktopClick` → `unauthorized`
- [x] tests `tests/baseline/desktop-app-access.test.ts`

### Task 2: Persistencia y APIs

- [x] campo en membresía / invitación
- [x] `PATCH /api/identity/members/[id]/apps`
- [x] team GET expone `authorizedApps` + `contractedApps`
- [x] migración `031-membership-authorized-apps`

### Task 3: NELZURI Equipo + mesa

- [x] panel Equipo en Ajustes
- [x] dock filtrado por llaves
- [x] guardia `/admin` layout

### Task 4: Verificación

- [x] tests baseline relevantes (`desktop-app-access`, `desktop-contract`, `desktop-space-settings`)
- [x] migración `031-membership-authorized-apps` (15 membresías)
- [x] SEM: techo solo Growth OS; admin ve candados del resto; sin llave oculta Growth OS y `/admin` redirige
- [x] PATCH llaves: acepta techo, rechaza fuera de plan; Equipo en NELZURI
