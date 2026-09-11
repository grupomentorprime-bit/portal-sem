# Glosario — Growth OS

Vocabulario vigente para docs de entrada, chrome de plataforma y conversación de producto. Contratos: [ADR-009](./architecture/ADR-009.md) · [ADR-010](./architecture/ADR-010.md).

---

## Producto y mapa

| Término | Definición |
| --- | --- |
| **Growth OS** | Producto de **este** repositorio. Plataforma para operar Espacios (identidad, CMS, media, formularios, flujos, eventos, portal público). |
| **Brújula de producto** | Ayuda a atraer personas, no perder oportunidades y convertirlas en clientes, alumnos o participantes. |
| **Principio** | Simple por fuera. Potente por dentro. |
| **Vertical educación** | Dominio de capacidades (sitio institucional, programas editoriales, formularios, jornadas). No es el nombre del producto. |
| **Platform Core** | Capas ya disponibles: Identity, Tenant/Site/Domain, CMS, Media, Workflow, Events, Portal Engine. |
| **Productization** | Frente cerrado en V1: que Growth OS se nombre y se opere como producto (chrome, correo, créditos, docs). |
| **Growth Core** | Núcleo comercial: Persona → Origen → Oportunidad → Actividad → Próxima acción. **V1 cerrada · APTO** ([CLOSE-001](./validation/OT-GROWTH-CORE-CLOSE-001/README.md)). Contrato: [ADR-010](./architecture/ADR-010.md). CORE-001→006 **APTO**; [CORE-007](./validation/OT-GROWTH-CORE-007/README.md) **APTO VISUAL** (`/admin/personas`). Auditoría: [CORE-AUDIT-001](./validation/OT-GROWTH-CORE-AUDIT-001/README.md). |
| **Ventas** | Superficie operativa sobre Growth Core (`/admin/ventas`). No es un CRM aparte. [SALES-001](./validation/OT-GROWTH-SALES-001/README.md) · **APTO TÉCNICO**. |
| **Automatización** | Reacción a eventos Growth* (Trigger → Condición → Acción). **No** es el Workflow de estados de Oportunidad. Contrato: [ADR-011](./architecture/ADR-011.md) · persistencia: [AUTOMATION-002](./validation/OT-GROWTH-AUTOMATION-002/README.md) · runtime: [AUTOMATION-003](./validation/OT-GROWTH-AUTOMATION-003/README.md). Sin WAIT ni editor. |
| **Persona** (Growth) | Identidad comercial única dentro del Espacio (`growth_personas`). No es `identity_users` ni `content_people`. |
| **Origen** | Snapshot de dónde llegó (canal/formulario/campaña/referencia si ya vienen). No es attribution. |
| **Oportunidad** | Intención genérica configurable por Espacio. Una Persona puede tener varias. |
| **Actividad** | Hecho append-only del timeline comercial. No es el Event Bus. |
| **Próxima acción** | Qué hacer, cuándo y responsable, embebida en la Oportunidad. No es un motor de tareas. |

---

## Espacio vs Tenant vs cliente

| Persona ve / dice | Código / DB | Notas |
| --- | --- | --- |
| **Espacio** | `Tenant` / `tenantId` | Cliente u organización en la UI |
| **Sitio** | `Site` / `siteId` | Superficie pública (portal) del Espacio |
| **Cuenta** | `identity_users` | Persona global; membresías por Espacio |
| **Invitación** | `identity_invitations` | Alta a un Espacio |
| **Owner del Espacio** | rol `super_admin` (membresía) | Administra **su** Espacio; no es operador de Growth OS |
| **Operador de Growth OS** | `identity_users.platformRoles` (`platform_owner` / `platform_operator`) | Administra la plataforma; no implica membresía en clientes |
| **Tenant** | — | Solo lenguaje técnico interno; no chrome de producto |
| **T001 / T002** | Códigos de fundación | Internos / docs técnicos; no UI de producto |

---

## Clientes reales

| Nombre | Código | Rol |
| --- | --- | --- |
| **SEM** (Seminario Eclesiástico Mayor) | T001 · `seminario-ipn` | Primer cliente; pack de datos SEM/IPN |
| **ADL** (Academia ADL) | T002 · `adl` | Segundo cliente; Espacio limpio, sin heredar branding SEM |

Prohibido tratar SEM o ADL como nombre del producto o como lógica de plataforma (`if (tenant === "adl")` como identidad de producto).

---

## Aprende Hoy y límites

| Término | Definición |
| --- | --- |
| **Aprende Hoy** | Sistema académico **separado** (matrícula, campus, evaluación, etc.). Otro producto. |
| **Handoff** | Corte: Growth OS termina en **interesado**; Aprende Hoy recibe **lead** vía adapter opt-in. Ver [GROWTH-OS-HANDOFF-APRENDE-HOY](./architecture/GROWTH-OS-HANDOFF-APRENDE-HOY.md). |
| **Learning OS / AprendeHoy Learning OS** | Nombre del sistema académico — **no** de este repo. |
| **Portal SEM** | Nombre histórico del primer portal / cliente. Obsoleto como nombre de **este** producto. |

Este repo **no** administra alumnos, matrículas, pagos, contratos, expedientes ni campus.

---

## Nombres a evitar (como producto de este repo)

| Evitar | Usar |
| --- | --- |
| Portal SEM (como nombre del producto) | Growth OS |
| AprendeHoy Learning OS / Learning OS (como este repo) | Growth OS; Aprende Hoy solo para el sistema académico |
| CMS del SEM (chrome de plataforma) | Admin / Espacio / Growth OS |
| tenant / tenantId / T001 en UI | Espacio, Sitio, cuenta |

El nombre de paquete/repo `portal-sem` es histórico; no implica que el producto sea el seminario.
