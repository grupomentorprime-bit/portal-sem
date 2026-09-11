# OT-GROWTH-TEST-002 — Smoke E2E previo a SaaS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-TEST-002 |
| Tipo | Smoke integrado (HTTP) contra app viva |
| Fecha | 2026-09-03 |
| Criterio APTO | Protección automatizada/integrada suficiente para iniciar SaaS sabiendo qué preservar |

## Objetivo

Complementar el baseline contractual (`tests/baseline`) con recorridos SEM ejecutables contra la aplicación en marcha, **sin mutar datos reales** y sin forzar credenciales externas / producción.

## Inventario reutilizado (sin reinventar)

| Activo | Uso en esta OT |
| --- | --- |
| `npm run test:baseline` + `tsx --test` | Mismo runner; smoke se agrega al mismo comando |
| `tests/baseline/*` | Contratos unitarios/proxy/adapter (TEST-001) |
| Probe HTTP ad hoc (historial ops: público vs privado anónimo) | Contrato de status codes congelado en smoke |
| `playwright` + `scripts/capture-demo-screenshots.mjs` / `capture-admin-dashboard-visual.mjs` | Capturas visuales manuales; **no** suite de producto — se reutiliza el patrón `DEMO_URL` / `CAPTURE_URL` / localhost para descubrir base URL |
| Sin fixtures Mongo dedicadas | No se crean seeds de prueba ni se tocan rosters/interesados reales |

**No** se añadió `@playwright/test` ni se cambió funcionalidad de producto.

## Cobertura smoke

| Recorrido | Nivel congelado | Cómo |
| --- | --- | --- |
| Portal público abre y navega | HTML 200 + nav href | `GET /`, product routes, links en home |
| CMS publicado se renderiza | Branding + título institucional; catch-all 200\|404 | Home con `--brand-primary` / SEM; `/noticias` etc. toleran 404 si no hay página |
| Formulario público carga y valida | GET public + HTML + POST 422 | Talca Aurora; submit vacío → errores, sin write |
| `/admin` anónimo → login | 307 → `/admin/login?next=` | HTTP real (complementa proxy unitario) |
| Login institucional inicia | providers + redirect OAuth | 307 a Keycloak authorize; **no** completa password/callback |
| APIs públicas/privadas | 200 form public; 401 admin APIs | Lista fija de rutas privadas |
| Convocatoria / admisión | Solo validación | POST inválido → 422; **no** submit feliz ni check-in |

Comandos:

```bash
# App viva (recomendado): npm run dev  →  SMOKE_BASE_URL opcional
npm run test:baseline   # incluye baseline + smoke
npm run test:smoke      # solo smoke
```

Resolución de base URL (en orden): `SMOKE_BASE_URL` → `DEMO_URL` → `CAPTURE_URL` → `NEXT_PUBLIC_APP_URL` → `APP_URL` → `http://localhost:3000` → `http://localhost:3001`.

Si **no** hay app viva, los casos smoke se **skip** (no fallan): el contrato offline queda en TEST-001.

## Límites documentados (contrato detenido aquí)

| Dependencia | Qué se pudo congelar | Qué no se ejecuta |
| --- | --- | --- |
| **Mongo** | Lecturas públicas (home, form public) si el servidor ya conecta | Escrituras controladas / DB de test aislada |
| **Keycloak** | Inicio OAuth (307 authorize) + providers | Login completo, cookie `ah_session`, callback, permisos post-sesión |
| **S3** | — | Media upload / stream autenticado |
| **Resend** | — | Emails convocatoria / invitaciones |
| **Aprende Hoy** | Adapter local en TEST-001 | Handoff real `ADMISSION_ADAPTER=aprendehoy` |
| **Credenciales ops** | — | Check-in AE, publish CMS, roster search autenticado |

Slugs CMS sin página publicada (`/noticias`, `/eventos`, `/biblioteca` en el entorno verificado) → **404 aceptado**; no se fuerza contenido ni se corrige CMS.

## Archivos

| Ruta | Rol |
| --- | --- |
| `tests/smoke/helpers.ts` | Base URL, fetch redirect=manual |
| `tests/smoke/smoke-e2e.test.ts` | Casos smoke |
| `package.json` | `test:smoke`; `test:baseline` incluye smoke |

## TEST-003 … TEST-007 — ¿OTs separadas?

Mapeo respecto a la protección §29 (OT-PORTAL-SAAS-000) y al hueco que deja este smoke:

| ID tentativo | Tema | ¿Absorbido por baseline+smoke? | Decisión |
| --- | --- | --- | --- |
| **TEST-003** | Submit admisión **feliz** (interesado local, sin AH) | Parcial: solo 422 de validación | **OT separada** si se quiere round-trip con DB de prueba / fixture; no en smoke (mutaría datos) |
| **TEST-004** | Convocatoria RSVP + aislamiento tenant + asistencia | Parcial: form public + 422 | **OT separada** (roster/check-in/justificación/emails; Resend + datos controlados) |
| **TEST-005** | Check-in / scope AE con sesión | No | **OT separada** (requiere sesión + permisos; no forzar Keycloak E2E aquí) |
| **TEST-006** | CMS publish round-trip | No (solo 401 anónimo + render público) | **OT separada** (sesión admin + write CMS) |
| **TEST-007** | Branding / gate admin / providers | **Sí absorbido** | **No requiere OT**: TEST-001 (proxy, roles, branding en build) + TEST-002 (CSS vars, 307, Keycloak start) |

**Resumen:** TEST-003, TEST-004, TEST-005 y TEST-006 siguen justificando OTs propias (datos controlados + auth). TEST-007 queda absorbida. No bloquear el inicio SaaS por esas OTs si se acepta el límite “validación + anónimo + inicio OAuth”.

## Verificación (2026-09-03)

| Comando | Resultado |
| --- | --- |
| `SMOKE_BASE_URL=http://localhost:3001 npm run test:baseline` | **37/37 pass** (23 baseline + 14 smoke) |
| `npx tsc --noEmit` | **OK** |
| `npm run build` | **OK** (branding 0 incidencias; warning NFT Turbopack preexistente en media-storage) |

## Criterios de aceptación

- [x] Revisión de scripts/fixtures/Playwright existentes; reutilización de runner + URLs de captura
- [x] Smoke de portal, CMS render, form validación, admin→login, inicio Keycloak, APIs
- [x] Sin mutar datos reales; sin tenantizar; sin tocar `ensure*`; sin cambiar producto para pasar tests
- [x] Límites Keycloak/Mongo/S3/Resend/AH documentados
- [x] Dictamen TEST-003…007

**Veredicto: APTO** — hay protección contractual + smoke integrado suficiente para iniciar la transformación SaaS, con límites explícitos (sin login completo, sin writes de admisión/convocatoria/CMS, sin check-in).
