# OT-GROWTH-PLATFORM-HOST-ISOLATION-001 — Desacoplar host canónico de plataforma del compat SEM

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PLATFORM-HOST-ISOLATION-001 |
| Tipo | Operatividad / aislamiento multi-tenant |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-DOMAIN-PLATFORM-001](./OT-GROWTH-DOMAIN-PLATFORM-001.md) (riesgo `sem-app-url-compat`) |
| Estado | **CERRADA · APTO** |
| Alcance | Resolver Host → Tenant: APP_URL deja de asignar identidad SEM; foundation no registra host de plataforma como Domain legacy |
| Fuera de alcance | DNS · Dokploy · Cloudflare · Meta · WhatsApp · Mensajes · Canales · CMS · Growth Core · datos productivos · `APP_URL` productivo |

**Restricciones cumplidas:** sin hardcode `growthos.mentorprime.cl`; sin tocar DNS/infra externa; sin cambiar env productivo; solución genérica (loopback vs origen de app).

---

## Gate final

**APTO**

`growthos.mentorprime.cl` (u cualquier host público presente solo en `APP_URL` / `NEXT_PUBLIC_APP_URL`) ya **no** se resuelve como SEM. La resolución de Espacios sigue siendo **Host → Domain → Site → Tenant**. Compat legacy SEM queda limitado a **loopback** (dev).

---

## 1. Causa encontrada

### Histórico

En SAAS-001/002, SEM era “la instancia”. ADR-008 D3 mapeó los hosts de `APP_URL` / `NEXT_PUBLIC_APP_URL` a T001/S001 como bootstrap. SAAS-002 añadió el fallback `source: "sem-app-url-compat"`:

1. `isSemEligibleHost` devolvía `true` si el Host coincidía con hosts de `resolveAppHostsFromEnv` (APP_URL / NEXT_PUBLIC_APP_URL).
2. `ensureSemTenantFoundation` sin `hosts` explícitos registraba esos mismos hosts como `domains` `kind: "legacy"` de SEM.

Eso era correcto cuando APP_URL **era** el dominio SEM. Dejó de serlo al querer promover APP_URL al origen canónico de **plataforma** (`https://growthos.mentorprime.cl`).

### Efecto bloqueante (DOMAIN-PLATFORM-001)

Con APP_URL = `https://growthos.mentorprime.cl` y **sin** fila en `domains`:

| Paso | Resultado previo |
| --- | --- |
| `resolvePublicTenantByHost("growthos.mentorprime.cl")` | SEM (T001) vía `sem-app-url-compat` |
| `ensureSemTenantFoundation(db)` | Podía crear Domain legacy SEM para ese host |

Por eso no era seguro promover APP_URL sin este desacople.

---

## 2. Cambio mínimo realizado

| Archivo | Cambio |
| --- | --- |
| `src/core/tenant/hosts.ts` | `isLoopbackHost`; `resolveSemBootstrapHostsFromEnv` (solo loopback desde APP_URL); comentarios: APP_URL = origen de app, no tenant |
| `src/core/tenant/resolve.ts` | `isSemEligibleHost` → **solo loopback**; ya no hace match de APP_URL público |
| `src/core/tenant/migrate-sem.ts` | Bootstrap por defecto usa `resolveSemBootstrapHostsFromEnv` (no registra host público de plataforma) |
| `src/core/tenant/migrate-adl.ts` | Comentario/claridad: excluye hosts de APP_URL porque son de **plataforma**, no “hosts SEM” |
| `src/core/tenant/index.ts` | Exporta helpers nuevos |
| `src/core/tenant/types.ts` | Comentario `legacy` sin acoplar a APP_URL |
| `docs/core/TENANT-GUIDELINES.md` | Contrato actualizado |
| `.env.example` | APP_URL documentado como origen de plataforma |

**No** se hardcodeó `growthos.mentorprime.cl`. Cualquier APP_URL público se trata igual: origen de plataforma, no Espacio.

### Regla resultante

```text
APP_URL / NEXT_PUBLIC_APP_URL  →  origen canónico de la aplicación (canonical, OAuth, cookies, legales)
Host → domains → Site → Tenant  →  identidad de Espacio
Loopback sin domain            →  compat SEM temporal (dev)
```

---

## 3. Compatibilidad legacy

| Mecanismo | Estado | Por qué |
| --- | --- | --- |
| `source: "sem-app-url-compat"` (nombre conservado) | **Acotado** a loopback | Sigue haciendo falta en local multi-puerto sin depender de fila `domains`; el nombre histórico se mantiene para no romper tipado/docs consumidores |
| Match APP_URL público → SEM | **Eliminado** | Convertía el host de plataforma en T001 |
| Foundation auto-domains desde APP_URL público | **Eliminado** | Impide registrar `growthos…` (u otro canónico) como legacy SEM al correr migraciones/bootstrap |
| Foundation con `hosts: [...]` explícitos | **Conservado** | SEM productivo/real sigue provisionándose por hosts reales |
| `source: "domain"` | **Sin cambio** | Camino normal multi-tenant |
| `source: "sem-legacy-singleton"` | **Conservado** | Solo en hosts ya elegibles SEM (ahora = loopback) si falta foundation |
| ADL `resolveAdlDevHosts` evita hosts de APP_URL | **Conservado** (semántica aclarada) | El origen de plataforma no debe quedar como Domain de ADL |

Pendiente histórico SAAS-002 (“quitar compat cuando todos los hosts SEM vivan en `domains`”) sigue válido para el residual **loopback**; ya no bloquea la promoción de APP_URL de plataforma.

---

## 4. Pruebas

### Nuevas — `tests/baseline/platform-host-isolation.test.ts`

| Caso | Resultado |
| --- | --- |
| A. `growthos.mentorprime.cl` + APP_URL plataforma | `unknown_host`; sin Domain creado |
| B. Host SEM en `domains` | T001 / `domain` |
| C. Host ADL | T002 / `domain` |
| D. Host desconocido = APP_URL | `unknown_host` (no adquiere tenant) |
| E. Cambiar APP_URL localhost ↔ growthos | Identidad SEM/ADL estable; plataforma sigue sin tenant |
| Foundation con APP_URL plataforma | `hosts: []`; no crea Domain del host canónico |
| Unitarias `resolveSemBootstrapHostsFromEnv` / `isSemEligibleHost` | Verdes |

### Regresiones actualizadas

- `tests/baseline/saas-host-resolve.test.ts` — APP_URL público ya no otorga SEM; loopback sí.

### Ejecución (2026-09-11)

```bash
npx tsx --test \
  tests/baseline/platform-host-isolation.test.ts \
  tests/baseline/saas-host-resolve.test.ts \
  tests/baseline/saas-adl-tenant.test.ts \
  tests/baseline/saas-domains.test.ts \
  tests/baseline/saas-foundation.test.ts
```

| Suite / foco | Resultado |
| --- | --- |
| platform-host-isolation (A–E + foundation) | **PASS** |
| saas-host-resolve (SAAS-002) | **PASS** |
| saas-domains (SAAS-008) | **PASS** |
| saas-foundation (SAAS-001) | **PASS** |
| saas-adl-tenant hosts / bootstrap / switch | **PASS** |
| saas-adl-tenant “aislamiento… experience_forms” | **FAIL preexistente** — ver §6 |

---

## 5. Resultado multi-tenant

| Validación | Resultado |
| --- | --- |
| Host plataforma (`growthos.mentorprime.cl`) | No SEM · no ADL · no crea Site/Domain |
| Host SEM en `domains` | T001 correcto |
| Host ADL | T002 correcto |
| Host desconocido | `unknown_host` aunque APP_URL coincida |
| Cambiar APP_URL | No muta identidad de tenants ya resueltos por `domains` |
| `/legal/*` | Sigue fuera del pipeline de Espacio (sin tenant requerido); ahora además el Host de plataforma no “se vuelve” SEM |
| Bootstrap SEM | No registra host canónico de plataforma como legacy |

Es seguro, a nivel de **código de resolución**, promover:

`APP_URL` / `NEXT_PUBLIC_APP_URL` = `https://growthos.mentorprime.cl`

siempre que los hosts reales de SEM (y ADL) vivan en `domains` — no solo en el antiguo compat APP_URL.

---

## 6. Riesgos restantes

| Riesgo | Severidad | Nota |
| --- | --- | --- |
| SEM productivo que **solo** existía vía compat APP_URL (sin fila `domains`) | Medio | Tras este cambio deja de resolver. Mitigación: asegurar Domain SEM antes de promover APP_URL (acción humana / ops; no hecha aquí) |
| Compat loopback SEM en local | Bajo | Intencional para DX; Domain gana si existe |
| Nombre `sem-app-url-compat` engañoso | Bajo | Comportamiento = loopback; rename opcional en OT futura |
| Fallo ADL `experience_forms` count ≠ 0 | Fuera de alcance | Fixture local `adl-smoke-info-request` (smoke captación); **no** creado por este cambio |
| DNS / Dokploy / TLS / env productivo | Fuera de alcance | Siguen en DOMAIN-PLATFORM-001 (acción humana) |
| Keycloak redirect URIs al nuevo origen | Fuera de alcance | Operativo al promover APP_URL |

---

## 7. Qué no se tocó

DNS, Dokploy, Cloudflare, Meta, WhatsApp, Mensajes, Canales, CMS de clientes, Growth Core, datos productivos, valor productivo de `APP_URL`.

No se abrió otra OT automáticamente.

---

## 8. Entregables

| # | Entrega | Estado |
| --- | --- | --- |
| 1 | Causa encontrada | Hecho (§1) |
| 2 | Cambio mínimo | Hecho (§2) |
| 3 | Compat legacy | Hecho (§3) |
| 4 | Pruebas | Hecho (§4) |
| 5 | Resultado multi-tenant | Hecho (§5) |
| 6 | Riesgos restantes | Hecho (§6) |
| 7 | Acta | Este documento |
| Gate | **APTO** | |

---

## 9. Cierre

| Criterio | Cumplimiento |
| --- | --- |
| Host plataforma ≠ SEM por APP_URL | Sí |
| Solución genérica (sin hardcode growthos) | Sí |
| Host → Domain → Site → Tenant intacto | Sí |
| Foundation no registra plataforma como SEM | Sí |
| SEM / ADL por domains | Sí |
| Pruebas de aislamiento | Sí |
| Sin tocar NO TOCAR | Sí |

**GATE: APTO**
