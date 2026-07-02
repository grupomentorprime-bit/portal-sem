# AprendeHoy Learning OS — Product Roadmap 2026–2028

**Versión:** 2.0  
**Estado:** Documento Estratégico del Producto  
**Última revisión:** Julio 2026

---

## Visión

AprendeHoy es una plataforma SaaS multi-tenant para operar instituciones educativas mediante un **Platform Core** reutilizable, un **Experience Kit** unificado y **épicas de producto** orientadas al usuario final.

Con la clausura de **EP-000 — Foundation / Experience Kit**, el desarrollo prioriza **experiencias y dominios de negocio** sobre infraestructura transversal.

---

## Línea de tiempo estratégica

```text
2026 H1 ─ Platform Core Foundation     ✅ FOUNDATION-COMPLETE v2.0.0
2026 H1–H2 ─ Experience Kit / Branding ✅ EP-000 COMPLETADA
2026 H2 ── Portal Institucional Premium 🟡 EP-001 (inicio: OT-PORTAL-001)
2027 ──── CRM & Admisiones             ⚪ EP-002
2027+ ─── Campus Virtual               ⚪ EP-003
2027+ ─── Backoffice Académico         ⚪ EP-004
```

---

# Épicas de producto (v2)

## EP-000 — Foundation / Experience Kit

| Atributo | Valor |
| --- | --- |
| **Objetivo** | Tokens, componentes, Design System, gobernanza, CI branding |
| **Estado** | ✅ **COMPLETADA** (2026-07-01) |
| **Dependencias** | Platform Core v2.0 |
| **OTs** | OT-BRANDING-001 → 005 |
| **Criterios de cierre** | 0 deuda branding, catálogo `/internal/design-system`, docs Experience Kit |

📄 [EP-000-FOUNDATION-EXPERIENCE-KIT.md](./epics/EP-000-FOUNDATION-EXPERIENCE-KIT.md)

---

## EP-001 — Portal Institucional Premium

| Atributo | Valor |
| --- | --- |
| **Objetivo** | Sitio público completo para el postulante |
| **Estado** | 🟡 En planificación |
| **Dependencias** | EP-000 ✅ |
| **OTs** | [OT-PORTAL-001](./../ot/OT-PORTAL-001.md) (Home definitivo) · OT-PORTAL-002+ |
| **Criterios de cierre** | Home narrativa única, bloques CMS, conversión a admisión, Experience Kit |

**Alcance:** Home, programas, perfil postulante, metodología, equipo, testimonios, noticias, biblioteca pública, FAQ, footer, proceso admisión.

📄 [EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md](./epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)

---

## EP-002 — CRM & Admisiones

| Atributo | Valor |
| --- | --- |
| **Objetivo** | Visita → matrícula con workflows y trazabilidad |
| **Estado** | ⚪ Diseño aprobado |
| **Dependencias** | EP-001 🟡 · Core (Identity, Workflow, Events) ✅ |
| **OTs** | OT-CRM-001 … OT-CRM-004 · OT-ADM-001 … 003 |
| **Criterios de cierre** | Postulación E2E, matrícula → estudiante, eventos de dominio |

📄 [EP-002-CRM-ADMISSIONS.md](./epics/EP-002-CRM-ADMISSIONS.md) · Arquitectura: [EP-001-CRM-ADMISSIONS.md](./epics/EP-001-CRM-ADMISSIONS.md) *(legacy)*

---

## EP-003 — Campus Virtual

| Atributo | Valor |
| --- | --- |
| **Objetivo** | Experiencia del estudiante matriculado |
| **Estado** | ⚪ Pendiente |
| **Dependencias** | EP-002 ⚪ |
| **OTs** | OT-CAMPUS-001+ (tentativo) |
| **Criterios de cierre** | Dashboard, aula, biblioteca, expediente, comunicaciones |

📄 [EP-003-CAMPUS-VIRTUAL.md](./epics/EP-003-CAMPUS-VIRTUAL.md)

---

## EP-004 — Backoffice Académico

| Atributo | Valor |
| --- | --- |
| **Objetivo** | CMS potenciado para operación académica e institucional |
| **Estado** | ⚪ Pendiente |
| **Dependencias** | EP-000 ✅ |
| **OTs** | OT-BACKOFFICE-001+ (tentativo) |
| **Criterios de cierre** | Flujos editoriales, SEO, landings, catálogo académico en CMS |

📄 [EP-004-BACKOFFICE-ACADEMICO.md](./epics/EP-004-BACKOFFICE-ACADEMICO.md)

---

# Recomendación inmediata

**Abrir EP-001** con la primera OT de producto:

| OT | Título | Estado |
| --- | --- | --- |
| **OT-PORTAL-001** | Home Institucional Definitivo | ⚪ Planificada |

📄 [OT-PORTAL-001.md](../ot/OT-PORTAL-001.md)

---

# Platform Core (etapa anterior — completada)

Cierre oficial: [FOUNDATION-COMPLETE.md](./FOUNDATION-COMPLETE.md) · **v2.0.0** · Junio 2026

| Motor | Estado |
| --- | :---: |
| Multi-Tenant | ✅ |
| CMS · Content · Media | ✅ |
| Identity · Workflow · Events | ✅ |
| Portal Engine | ✅ |
| Search · Notifications · Analytics · Forms | ⏳ Stub / parcial |

El Core **evoluciona solo** cuando una necesidad transversal lo justifica; no es el foco principal del roadmap v2.

---

# Módulos Core pendientes (infraestructura transversal)

| OT | Módulo | Estado |
| --- | --- | --- |
| OT-CORE-SEARCH-001 | Search Engine | ⏳ |
| OT-CORE-NOTIFICATIONS-001 | Notifications | ⏳ |
| OT-CORE-ANALYTICS-001 | Analytics | ⏳ |
| OT-CORE-FORMS-001 | Forms Engine | ⏳ |
| OT-CORE-OBSERVABILITY-001 | Observability | ⏳ |

Pueden implementarse en paralelo a épicas de producto cuando desbloqueen dominios (p. ej. Forms para EP-002).

---

# Arquitectura del producto

```text
                    AprendeHoy Learning OS

┌─────────────────────────────────────────────┐
│         Épicas de producto (EP-001…)        │
│  Portal • CRM • Campus • Backoffice         │
└─────────────────────────────────────────────┘
                     ▲
┌─────────────────────────────────────────────┐
│         Experience Kit (EP-000) ✅           │
│  Tokens • UI • Design System • Catálogo     │
└─────────────────────────────────────────────┘
                     ▲
┌─────────────────────────────────────────────┐
│              Portal Engine + CMS            │
└─────────────────────────────────────────────┘
                     ▲
┌─────────────────────────────────────────────┐
│               Platform Core ✅               │
│ Identity • Workflow • Events • Assets        │
└─────────────────────────────────────────────┘
```

---

# Principios rector (v2)

1. **Producto primero** — OTs orientadas a experiencia y negocio (`OT-PORTAL-*`, `OT-CRM-*`).
2. **Experience Kit obligatorio** — Sin nuevas reglas visuales; ver [PULL_REQUEST_CHECKLIST.md](../design/PULL_REQUEST_CHECKLIST.md).
3. **Core bajo demanda** — Capacidades transversales solo cuando varios dominios las requieran.
4. **Multi-tenant por tokens** — Nuevas instituciones no bifurcan componentes.

---

# Épicas históricas (roadmap v1)

El roadmap v1.0 agrupaba Portal Experience y CRM con otra numeración. Referencia:

| v1 | v2 / estado actual |
| --- | --- |
| ÉPICA 1 Platform Core | Completada → FOUNDATION-COMPLETE |
| ÉPICA 2 Portal Experience | Absorbida en **EP-001** + módulos LOCKED |
| ÉPICA 3–4 CRM/Admisiones | **EP-002** |
| ÉPICA 5+ Académico/Finanzas | **EP-003**, **EP-004**, futuras |

---

# Referencias

| Área | Documento |
| --- | --- |
| Cierre Experience Kit | [EP-000](./epics/EP-000-FOUNDATION-EXPERIENCE-KIT.md) |
| Design System | [INTRODUCTION.md](../design/INTRODUCTION.md) |
| Portal Engine | [PORTAL-ENGINE.md](../core/PORTAL-ENGINE.md) |
| Changelog | [CHANGELOG.md](../../CHANGELOG.md) |
| Releases | [RELEASES.md](../../RELEASES.md) |

---

> **"La Fundación y el Experience Kit están cerrados. A partir de aquí, construimos experiencias para las personas que visitan, postulan y estudian en la institución."**
