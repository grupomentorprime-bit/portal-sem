# Growth OS — Informe de avances

| Campo | Valor |
| --- | --- |
| Producto | Growth OS |
| Corte | 2026-09-22 |
| Veredicto | **APTO PARA PILOTO** |
| Fuentes | Handbook · README · ADR-008/009/010/011 · OT-GROWTH-E2E-FINAL-001 · cierres de módulos · piloto Mentor Prime |

---

## Resumen ejecutivo

Growth OS ya opera el viaje comercial de punta a punta para un **piloto**: captar → Persona → Oportunidad → Qué hacer ahora → seguimiento → Mensajes ↔ Ventas → Automatización → Analítica.

Lo que falta ahora es principalmente **operación** (redeploy, Meta WhatsApp live, auth/ops), no un motor comercial nuevo.

**Brújula del producto:** atraer personas, no perder oportunidades y convertirlas en clientes, alumnos o participantes.  
**Principio:** Simple por fuera. Potente por dentro.

---

## 1. Qué es hoy la plataforma

| Concepto | Significado |
| --- | --- |
| **Growth OS** | Producto de este repositorio (plataforma) |
| **Espacio** | Cliente / organización en la UI |
| **Tenant** | Término técnico interno (`tenantId`) |
| **SEM (T001) / ADL (T002)** | Clientes reales en la misma instancia |
| **Educación** | Primera vertical (no el nombre del producto) |
| **Aprende Hoy** | Sistema académico separado; handoff opt-in |

### Capas construidas

| Capa | Contenido |
| --- | --- |
| **Platform Core** | Identity · Tenant/Site/Domain · CMS · Media · Workflow · Event Bus · Portal Engine · multi-tenant |
| **Growth Core V1** | Persona → Origen → Oportunidad → Actividad → Próxima acción (ADR-010 · **CERRADO · APTO**) |
| **Productización** | Marca Growth OS · Shell admin · Platform Admin · creación de Espacios universales |

---

## 2. Viaje comercial (E2E) — estado

Fuente: `OT-GROWTH-E2E-FINAL-001` · **CERRADA · APTO** · 246 tests PASS.

| # | Paso | Estado | Qué funciona | Nota |
| --- | --- | --- | --- | --- |
| 1 | Captar | **FUNCIONA** | Forms V1 · Admisión · WhatsApp inbound | Dependencia Meta live externa |
| 2 | Persona | **FUNCIONA** | Dedupe email/teléfono · multi-tenant | `identity_conflict` sin merge (S2) |
| 3 | Oportunidad | **FUNCIONA** | Open/reuse Form · Admisión · WA | — |
| 4 | Qué hacer ahora | **FUNCIONA** | Playbook H1 → «Contactar a la persona» | Visible en Inicio / Personas / Ventas |
| 5 | Seguimiento | **FUNCIONA** | Nota / contacto · Actividad append-only | Manual salvo automation |
| 6 | Automatizar | **FUNCIONA** | Event Bus · playbooks · WAIT · historial | Catálogo centrado en ventas |
| 7 | Conversar | **Dominio OK** | Mensajes ↔ Venta · WA→Opp | Envío/recepción live = Meta |
| 8 | Avanzar venta | **FUNCIONA** | Estados open→…→won/lost/handed_off | Finales limpian nextAction |

---

## 3. Módulos construidos

| Frente | Estado | Construido | Falta / límite |
| --- | --- | --- | --- |
| Inicio | Listo | Métricas, cola «qué hacer ahora», oportunidades, actividad, orígenes | Tendencias profundas |
| Personas | V1 cerrada | Listado + ficha · origen · opp · nextAction · timeline | Merge de identidades conflictivas |
| Ventas | Listo | Cola, estados, nota/contacto, próxima acción | No es CRM académico ni post-handoff |
| Mensajes | Operable | Bandeja WA · contexto Opp · CTA a Ventas | Live Meta + Embedded Signup ops |
| Actividad | Listo | Feed comercial `growth_*` | No confundir con auditoría CMS |
| Campañas | V1 | Campañas operativas (contrato + UI) | Attribution fina / UTMs avanzados |
| Automatizaciones | V1 | Editor · publish · triggers · WAIT · historial | Más acciones (mensaje/campaña) = roadmap |
| Analítica | V1 | Lecturas sobre `growth_*` | Pulido S3 Inicio vs período |
| Equipo | V1 cerrada | Invitaciones, roles, membresías, UX | Migración 023 por entorno en deploy |
| Sitio web / CMS | Listo | Páginas, menús, editor, medios, dominio, landings | DNS/TLS automático = fuera de app |
| Formularios | UX simple | Plantilla / IA / desde cero · editor visual · Publicar | Redeploy fix sesión Espacio (piloto) |
| Platform Admin | V1 | `/platform` · crear Espacio universal · hosts | Sin Growth Core dentro de `/platform` |

---

## 4. Piloto Mentor Prime (ahora)

| Tema | Estado | Detalle |
| --- | --- | --- |
| Espacio Mentor Prime Capacitación | En curso | Tenant/site/`site_config` activos · formulario de captación existente |
| Formularios admin | Fix en `master` (`400e80a`) | Resuelve Espacio por sesión (`getSessionActiveTenantId` + `getOperationalSiteConfig`), no por Host público |
| WhatsApp | Dominio APTO · live parcial | Cableado comercial OK · Meta App / Embedded Signup / webhook = **configuración externa pendiente** |

Host de plataforma: `https://growthos.mentorprime.cl`

---

## 5. Seguridad e identidad

| Tema | Estado | Detalle |
| --- | --- | --- |
| Aislamiento multi-tenant | Fuerte | Sesión + membresía · filtros `tenantId` · SEM ≠ ADL |
| Auth hardening | APTO con ajustes | Auth Code + PKCE en código · ops: cliente `growth-os-web` en prod |
| Security baseline | Piloto condicionado | Sin críticos tipo AprendeHoy · falta evidencia infra borde/HSTS/IdP |
| Entrada post-login | Corregido | Operadores plataforma → `/platform` (no caer en tenant cliente) |

---

## 6. A dónde vamos

### Corto plazo — cerrar piloto

| Prioridad | Acción |
| --- | --- |
| **P0** | Confirmar que Dokploy terminó el rebuild de `400e80a` |
| **P0** | Domain de producción del Espacio Mentor Prime (hoy solo `*.localhost`) |
| **P1** | Completar Meta WhatsApp live (ops externo) |
| **P1** | `sync:tenant-roles` / migraciones pendientes por entorno |
| **P1** | Evidencia Keycloak `growth-os-web` + Brute Force en IdP |

### Fuera de V1 (no asumir listo)

| Ítem | Por qué no |
| --- | --- |
| Planes / entitlements / self-serve | Explícito fuera de Productization V1 |
| DNS/TLS automático de dominios | Infraestructura, no app |
| CRM / recorridos / planes de alumno | Eso es Aprende Hoy u otro producto |
| IA real en formularios | UX actual usa plantillas; sin motor IA nuevo |
| Merge `identity_conflict` | Edge S2; no bloquea piloto con id estable |

---

## 7. Conclusión

| Ya construimos | Estamos aquí | Falta |
| --- | --- | --- |
| Foundation multi-tenant · Growth Core · Shell · captura · Personas/Ventas/Mensajes · Automatizaciones · Equipo · CMS · Analítica/Campañas V1 · viaje E2E | Flujo Formulario → Persona → Oportunidad → Qué hacer ahora validado en Mentor Prime (sin duplicados ni mezcla) | Confirmar rebuild Dokploy de `400e80a` · Domain público del Espacio · Meta live · sync roles/migraciones · evidencia auth/ops |

**No hace falta otro motor comercial para declarar el piloto operable.**  
Los pendientes críticos son de **despliegue y configuración externa**.

---

## Referencias en el repo

- `docs/HANDBOOK.md`
- `README.md`
- `docs/architecture/ADR-008.md` · `ADR-009.md` · `ADR-010.md` · `ADR-011.md`
- `docs/AI/auditorias/OT-GROWTH-E2E-FINAL-001.md`
- `docs/AI/auditorias/OT-GROWTH-PILOT-FORMS-REGRESSION-001.md`
- `docs/AI/auditorias/OT-GROWTH-UX-FORMS-SIMPLE-001.md`
- `docs/AI/auditorias/OT-GROWTH-WHATSAPP-META-001.md`
- `docs/AI/auditorias/OT-GROWTH-SECURITY-BASELINE-001.md`
