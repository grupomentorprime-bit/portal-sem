# OT-GROWTH-DOMAIN-PLATFORM-001 — Dominio público canónico de Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-DOMAIN-PLATFORM-001 |
| Tipo | Operatividad / dominio HTTPS de plataforma |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | OT-GROWTH-LEGAL-PLATFORM-001 (**CERRADA · APTO CON PENDIENTE EXTERNO**) |
| Estado | **CERRADA · APTO CON ACCIÓN HUMANA** |
| Dominio propuesto | `growthos.mentorprime.cl` |
| Alcance | Auditar infra, DNS, env, HTTPS y aislamiento multi-tenant para host canónico de plataforma |
| Fuera de alcance | Meta App · Embedded Signup · WhatsApp · webhook · Mensajes · Canales · Automatizaciones · CMS clientes · Growth Core · datos productivos · DNS sin autorización · segunda app/frontend |

**Restricciones cumplidas:** sin segunda aplicación; sin segundo frontend; sin duplicar Growth OS; sin tocar DNS; sin registrar URLs en Meta; sin tocar NO TOCAR.

---

## Gate final

**APTO CON ACCIÓN HUMANA**

El producto ya tiene superficies `/legal/*` públicas (OT-GROWTH-LEGAL-PLATFORM-001). Falta infraestructura externa para que `https://growthos.mentorprime.cl` exista, apunte a la **misma** app Docker/Dokploy y sirva HTTPS válido.

**No se simula operatividad del dominio:** al cierre de esta OT, `growthos.mentorprime.cl` es **NXDOMAIN** (Cloudflare DNS + resolución local). Las cuatro URLs Meta **no** deben pegarse todavía en Meta App Dashboard.

---

## 1. Infraestructura encontrada

| Pieza | Hallazgo |
| --- | --- |
| Aplicación | Una sola app Next.js (este repo = Growth OS) |
| Contenedor | `Dockerfile` (Node 20 alpine; `npm run build:docker` → `npm start` puerto 3000) |
| Orquestación documentada | **Dokploy** (comentarios en `Dockerfile` y OT-PORTAL-SAAS-000) |
| Proxy/SSL en repo | **No** hay Nginx/Caddy/Traefik/Terraform/docker-compose de producción en el repo |
| DNS/TLS | Fuera de la app (ADR-008 / SAAS-008 / TENANT-GUIDELINES) |
| Rutas legales plataforma | `/legal`, `/legal/privacidad`, `/legal/terminos`, `/legal/eliminacion-de-datos` |
| Proxy app (`src/proxy.ts`) | `/legal` **no** es zona protegida → sin redirección a login |
| Canonical / sitemap / robots | `getAppBaseUrl()` ← `NEXT_PUBLIC_APP_URL` → `APP_URL` → `VERCEL_URL` → localhost |
| Resolución Host → Site → Tenant | `resolvePublicTenantByHost` (`domains` + compat SEM por hosts de APP_URL) |
| `PLATFORM_BASE_DOMAIN` | Opcional; solo modelo `{slug}.{base}` — **no** provisiona DNS/TLS |

---

## 2. Hosting / deployment real identificado

| Superficie | Proveedor observado | Relación con Growth OS |
| --- | --- | --- |
| App Growth OS (runtime esperado) | **Docker + Dokploy** (evidencia en repo; sin URL productiva de Dokploy versionada) | Destino correcto para `growthos.mentorprime.cl` |
| `mentorprime.cl` / `www.mentorprime.cl` | **Vercel** (CNAME `*.vercel-dns-017.com`; título marketing Mentor Prime) | Sitio corporativo; **no** es Growth OS |
| `seminarioipn.cl` | **Cloudflare** + origen **Bitrix24.Sites** (header `x-powered-cms`) | Portal SEM histórico externo; **no** usar como dominio canónico de plataforma |
| Zona DNS `mentorprime.cl` | NS Cloudflare (`ingrid` / `mack`) | Lugar donde debe crearse el registro `growthos` |

**Decisión operativa:** asociar `growthos.mentorprime.cl` como **dominio adicional** del mismo servicio Dokploy que ya corre este Dockerfile. No crear app Vercel ni segundo frontend.

---

## 3. Configuración actual de dominio

| Variable / host | Estado actual (repo / entorno local auditado) |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Plantilla / local: `http://localhost:3000` (`.env.example` y `.env`) |
| `APP_URL` | Local auditado: `https://localhost:3000`; plantilla `.env.example`: `http://localhost:3000` |
| `PLATFORM_BASE_DOMAIN` | Comentado / ausente |
| `growthos.mentorprime.cl` | **No existe** en DNS (DoH Cloudflare `Status=3` NXDOMAIN; `nslookup` NXDOMAIN) |
| HTTPS productivo plataforma | **No disponible** (host inexistente) |
| Dominio canónico Growth OS en docs previas | Pendiente externo (LEGAL-001 §11 / META-TP-001 §8) |

---

## 4. Registro DNS requerido

Zona: **`mentorprime.cl`** (Cloudflare).

| Campo | Valor |
| --- | --- |
| Tipo | **CNAME** (preferido si Dokploy expone hostname de proxy) **o** **A** (si el panel solo entrega IPv4 del nodo) |
| Host | `growthos` (FQDN resultante: `growthos.mentorprime.cl`) |
| Destino | **REQUIERE ACCIÓN HUMANA** — no inventado en esta OT |
| TTL | `Auto` en Cloudflare, o `300` si se quiere propagación más predecible al validar |

### Dónde obtener el destino (humano)

1. Abrir el servicio de esta app en **Dokploy**.
2. Añadir dominio `growthos.mentorprime.cl` (o leer el target que Dokploy/Traefik indique para dominios custom).
3. Copiar el valor exacto que el panel pida publicar:
   - hostname CNAME del proxy/load balancer, **o**
   - dirección IP del servidor/nodo.
4. Crear el registro en **Cloudflare → DNS → mentorprime.cl**.
5. **No** apuntar `growthos` al proyecto Vercel de `mentorprime.cl` (sería otra app).

**Esta OT no modifica DNS.**

Proxy Cloudflare: si el registro queda “Proxied” (nube naranja), TLS edge lo termina Cloudflare; el origen Dokploy sigue necesitando certificado o modo SSL compatible. Si queda “DNS only” (gris), el certificado lo emite el proxy del nodo (típicamente Traefik/Let’s Encrypt en Dokploy). Elegir según el runbook del entorno; no se inventa aquí.

---

## 5. Variables de entorno requeridas

Objetivo de URL canónica: `https://growthos.mentorprime.cl`

| Variable | Valor objetivo | ¿Obligatoria para Meta/canonical? | Notas |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://growthos.mentorprime.cl` | **Sí** | Preferida por `getAppBaseUrl()` (canonical legales, sitemap, robots) |
| `APP_URL` | `https://growthos.mentorprime.cl` | **Sí** (alinear con la pública) | Emails/OAuth/cookies Secure; Dokploy la marca obligatoria |
| `PLATFORM_BASE_DOMAIN` | *(no requerida para esta OT)* | No | Solo subdominios `{slug}.{base}` de Espacios. **No** fijarla a `growthos.mentorprime.cl` solo para legales Meta |

### Riesgo de aislamiento al cambiar APP_URL (crítico)

Hoy, cualquier host presente en `APP_URL` / `NEXT_PUBLIC_APP_URL` es **elegible SEM** vía `isSemEligibleHost` → `source: "sem-app-url-compat"` (`src/core/tenant/resolve.ts`).

Consecuencia: si se configuran esas variables a `https://growthos.mentorprime.cl` **sin** fila en `domains` y sin cambio de código, el host de plataforma se resolverá como **SEM (T001)**, no como “host desconocido”.

| Acción | Efecto |
| --- | --- |
| **No** crear fila `domains` para `growthos.mentorprime.cl` | Correcto para no convertirlo en Site cliente — **pero** el compat SEM por APP_URL sigue aplicándose |
| Crear fila `domains` apuntando a un Site | Lo convertiría en dominio de Espacio — **prohibido** por el objetivo de esta OT |
| Dejar APP_URL en un host SEM y solo DNS a growthos | El host serviría la app, pero canonical/sitemap seguirían el host de APP_URL (incorrecto para Meta) |

**Mitigación operativa (humana, sin abrir OT automática):**

1. Asegurar que los hosts reales de SEM/ADL viven en colección `domains` (primary/alias), no solo en el compat APP_URL.
2. Al promover `APP_URL`/`NEXT_PUBLIC_APP_URL` a `https://growthos.mentorprime.cl`, validar en runtime que `/` y rutas `(site)/*` en ese host **no** sirvan contenido SEM (ideal: 404 / sin portal de cliente) y que `/legal/*` siga 200 Growth OS.
3. Si el compat SEM sigue acoplando el host de plataforma a T001, hace falta un ajuste de código **fuera del alcance de esta OT** (p. ej. dejar de tratar el host canónico de plataforma como SEM). Documentado como pendiente; **no** se implementa aquí.

Otras variables colaterales al cambiar el origen canónico (humano, fuera del núcleo de esta OT): `KEYCLOAK_REDIRECT_URI` y redirect URIs del cliente Keycloak deben incluir el nuevo origen si el login usa ese host.

---

## 6. Estado HTTPS

| Pregunta | Respuesta |
| --- | --- |
| ¿Cómo obtiene certificado el deployment actual? | Fuera del repo: proxy del stack **Dokploy** (típicamente Traefik + Let’s Encrypt / ACME al asociar dominio) |
| ¿Hay certificado para `growthos.mentorprime.cl` hoy? | **No** — el nombre no resuelve |
| ¿Instalar infra paralela? | **No** — usar el mismo servicio Dokploy |
| Paso humano exacto | En Dokploy: asociar dominio `growthos.mentorprime.cl` → esperar emisión ACME / estado “Certificate OK” → verificar en navegador candado válido |

Hasta que DNS + dominio Dokploy + certificado estén listos, HTTPS productivo de plataforma = **pendiente humano**.

---

## 7. Evidencia de las cuatro rutas

### 7.1 Productivo `https://growthos.mentorprime.cl/...`

| GET | Resultado |
| --- | --- |
| `/legal` | **No probado** — host NXDOMAIN |
| `/legal/privacidad` | **No probado** — host NXDOMAIN |
| `/legal/terminos` | **No probado** — host NXDOMAIN |
| `/legal/eliminacion-de-datos` | **No probado** — host NXDOMAIN |

### 7.2 Local (misma app, sin sesión) — 2026-09-11

| GET | Status |
| --- | --- |
| `http://localhost:3000/legal` | **200** |
| `http://localhost:3000/legal/privacidad` | **200** |
| `http://localhost:3000/legal/terminos` | **200** |
| `http://localhost:3000/legal/eliminacion-de-datos` | **200** |
| `http://localhost:3000/robots.txt` | **200** |
| `http://localhost:3000/sitemap.xml` | **200** (incluye `/legal*`) |

Canonical local sigue `getAppBaseUrl()` (hoy localhost). Cuando el dominio productivo y las env estén listos, revalidar las cuatro URLs HTTPS → **200**, canonical con `growthos.mentorprime.cl`, robots/sitemap con ese origen, sin redirect a `/admin/login`.

### URLs Meta objetivo (aún no registrar)

```text
https://growthos.mentorprime.cl/legal/privacidad
https://growthos.mentorprime.cl/legal/terminos
https://growthos.mentorprime.cl/legal/eliminacion-de-datos
```

---

## 8. Impacto multi-tenant

| Pregunta | Conclusión |
| --- | --- |
| ¿Usar `growthos.mentorprime.cl` lo convierte en tenant? | **No automáticamente**, si **no** se inserta en `domains` como Site |
| ¿Crea un Site cliente? | **No**, salvo alta explícita en `domains` / foundation |
| ¿Afecta dominios SEM/ADL? | DNS nuevo en zona Mentor Prime **no** altera registros de SEM/ADL. Cambiar `APP_URL` **sí** cambia el conjunto de hosts del compat SEM y lo que `ensureSemTenantFoundation` puede registrar como `legacy` |
| ¿Altera Host → Site → Tenant? | Solo si el host entra por `domains` **o** por compat APP_URL (riesgo §5) |
| ¿Rompe portales públicos? | No, si SEM/ADL siguen resolviendo por sus hosts en `domains` y el nuevo host no los sustituye |
| ¿Mezcla legales plataforma vs cliente? | Rutas `/legal/*` siguen fuera del CMS `(site)/[slug]`; legales de Espacio permanecen en `/privacidad`, `/terminos` del CMS. **No** redirigir unos a otros |
| ¿`PLATFORM_BASE_DOMAIN=growthos.mentorprime.cl`? | No necesario para Meta; haría `{slug}.growthos.mentorprime.cl` como patrón de Espacios — decisión de producto aparte |

`/legal` usa `PlatformLegalShell` + `PlatformNeutralTheme` (identidad Growth OS / Mentor Prime), no `PortalShell` de Espacio.

---

## 9. Acciones humanas pendientes

Orden sugerido (sin ejecutar en esta OT):

1. **Dokploy:** obtener destino DNS (CNAME/IP) y asociar dominio `growthos.mentorprime.cl` al **mismo** servicio de esta app.
2. **Cloudflare DNS:** crear registro `growthos` → destino del paso 1 (autorización expresa).
3. **TLS:** confirmar certificado válido en Dokploy/Cloudflare para ese FQDN.
4. **Env del servicio:** `APP_URL` y `NEXT_PUBLIC_APP_URL` = `https://growthos.mentorprime.cl` (redeploy/restart según Dokploy).
5. **Aislamiento:** verificar que SEM/ADL no dependan solo del compat APP_URL; no crear `domains` para growthos como Site cliente; comprobar que el host de plataforma no sirva portal SEM.
6. **Keycloak (si aplica):** actualizar redirect URIs al nuevo origen.
7. **Revalidar** las cuatro rutas HTTPS + robots/sitemap/canonical.
8. **Solo entonces** pegar Privacy / Terms / User Data Deletion en Meta App Dashboard.

**No** registrar aún las URLs en Meta.

---

## 10. Entregables de la OT (checklist)

| # | Entrega | Estado |
| --- | --- | --- |
| 1 | Infraestructura encontrada | Hecho (§1) |
| 2 | Hosting/deployment real | Hecho (§2) — Dokploy app; Vercel = marketing Mentor Prime |
| 3 | Configuración actual de dominio | Hecho (§3) — sin growthos; APP_URL local |
| 4 | Registro DNS requerido | Hecho (§4) — destino **REQUIERE ACCIÓN HUMANA** |
| 5 | Variables de entorno requeridas | Hecho (§5) |
| 6 | Estado HTTPS | Hecho (§6) — pendiente emisión en proveedor |
| 7 | Evidencia cuatro rutas | Local 200; productivo **bloqueado** por NXDOMAIN (§7) |
| 8 | Impacto multi-tenant | Hecho (§8) + riesgo APP_URL→SEM |
| 9 | Acciones humanas pendientes | Hecho (§9) |
| 10 | Gate final | **APTO CON ACCIÓN HUMANA** |

---

## 11. Qué no se tocó

Meta App, Embedded Signup, WhatsApp, webhook, Mensajes, Canales, Automatizaciones, CMS de clientes, Growth Core, datos productivos, DNS, secretos, segunda aplicación.

---

## 12. Cierre

| Criterio | Cumplimiento |
| --- | --- |
| Auditoría previa a cambios | Sí |
| Dominio canónico propuesto documentado | Sí (`growthos.mentorprime.cl`) |
| Sin segunda app / frontend | Sí |
| DNS no inventado / no modificado | Sí |
| Variables mínimas identificadas | Sí |
| HTTPS path documentado vía Dokploy | Sí |
| Evidencia productiva HTTPS | No — requiere acción humana |
| Aislamiento vs tenants evaluado | Sí (con riesgo compat SEM documentado) |

**GATE: APTO CON ACCIÓN HUMANA** — la app ya puede servir `/legal/*`; falta DNS + dominio en Dokploy + TLS + env canónicas (y validación de aislamiento APP_URL) antes de declarar el host operativo para Meta.
