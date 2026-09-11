# Growth OS

**Growth OS** ayuda a atraer personas, no perder oportunidades y convertirlas en clientes, alumnos o participantes.

> **Simple por fuera. Potente por dentro.**

Este repositorio es el producto **Growth OS**. No es el Portal SEM ni AprendeHoy Learning OS.

| Concepto | Significado |
| --- | --- |
| **Growth OS** | Producto de este repo (plataforma) |
| **Espacio** | Cliente / organización en la UI |
| **Tenant** | Término técnico interno (`tenantId`) |
| **SEM (T001)** / **ADL (T002)** | Clientes reales sobre el mismo core |
| **Educación** | Primera vertical (no el nombre del producto) |
| **Aprende Hoy** | Sistema académico separado; integración **opt-in** |

Nombre histórico del repo / package: `portal-sem`. No se renombra en Productization V1 ([ADR-009](./docs/architecture/ADR-009.md)).

**Punto de entrada:** [docs/HANDBOOK.md](./docs/HANDBOOK.md) · [Glosario](./docs/GLOSSARY.md)

---

## Hoy vs roadmap

### Disponible hoy (Foundation + Productization)

- Platform Core multi-tenant: Identity, Tenant/Site/Domain, CMS, Media, Workflow, Event Bus, Portal Engine
- Portal público y admin por **Espacio** (host → Site; sesión → Espacio activo)
- Clientes **SEM (T001)** y **ADL (T002)** en la misma instancia ([ADR-008](./docs/architecture/ADR-008.md))
- Formularios de experiencia, admisión de **interesados**, handoff opt-in a Aprende Hoy
- Identidad de producto Growth OS en chrome, correo y créditos (PROD-001→003)

### Roadmap (no asumir como listo)

| Frente | Estado |
| --- | --- |
| Growth Core (Persona → … → Próxima acción) | Contrato [ADR-010](./docs/architecture/ADR-010.md) — núcleo 002–006 **CERRADAS · APTO**; UI pendiente (CORE-007); no es CRM/recorridos/planes |
| Planes / entitlements / onboarding self-serve | No en V1 |
| DNS/TLS automático de dominios | Fuera de app |
| Aprende Hoy como producto dentro de este repo | **No** — otro sistema |

Contrato de producto: [ADR-009](./docs/architecture/ADR-009.md). Fundación multi-tenant: [ADR-008](./docs/architecture/ADR-008.md).

---

## Arquitectura (vista actual)

```
Visitante / operador
        ↓
Growth OS (Next.js — App Router)
        ↓
API Routes (/api/*) + TenantContext (host o sesión)
        ↓
MongoDB compartida (aislamiento por tenantId)
        ↓
Aprende Hoy (handoff opt-in de interesados — otro producto)
```

Detalle: [docs/architecture/](./docs/architecture/) · [TENANT-GUIDELINES](./docs/core/TENANT-GUIDELINES.md)

---

## Documentación

| Recurso | Enlace |
| --- | --- |
| Handbook (inicio) | [docs/HANDBOOK.md](./docs/HANDBOOK.md) |
| Glosario | [docs/GLOSSARY.md](./docs/GLOSSARY.md) |
| Índice completo | [docs/README.md](./docs/README.md) |
| ADR-008 — Multi-tenant | [docs/architecture/ADR-008.md](./docs/architecture/ADR-008.md) |
| ADR-009 — Producto Growth OS | [docs/architecture/ADR-009.md](./docs/architecture/ADR-009.md) |
| ADR-010 — Growth Core V1 | [docs/architecture/ADR-010.md](./docs/architecture/ADR-010.md) |
| Handoff → Aprende Hoy | [docs/architecture/GROWTH-OS-HANDOFF-APRENDE-HOY.md](./docs/architecture/GROWTH-OS-HANDOFF-APRENDE-HOY.md) |
| Guía de desarrollo | [docs/development/DEVELOPER-GUIDE.md](./docs/development/DEVELOPER-GUIDE.md) |

---

## Cómo iniciar

**Requisitos:** Node.js 20+, npm, MongoDB.

```bash
npm install
cp .env.example .env.local
# Completar MONGODB_URI y MONGODB_DB en .env.local
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) (host SEM / T001 según `APP_URL`).  
Espacio ADL (T002) en desarrollo: host configurado en `ADL_DEV_HOST` (p. ej. `adl.localhost:3000`).

---

## Cómo desplegar

```bash
npm run build
npm run start
```

Variables mínimas: ver [.env.example](./.env.example).

---

## Clientes y pack de datos

| Cliente | Código | Rol |
| --- | --- | --- |
| Seminario Eclesiástico Mayor | T001 (`seminario-ipn`) | Primer cliente; pack editorial SEM/IPN |
| Academia ADL | T002 (`adl`) | Segundo cliente; sin heredar branding SEM |

El pack SEM es **dato del Espacio**, no la identidad de Growth OS.

---

## Licencia

Proyecto privado.
