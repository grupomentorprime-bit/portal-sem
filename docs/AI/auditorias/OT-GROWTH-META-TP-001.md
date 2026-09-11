# OT-GROWTH-META-TP-001 — Preparación Growth OS como Tech Provider de Meta

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-META-TP-001 |
| Tipo | Preparación operativa + revisión de repositorio |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-08 |
| Entrada | OT-GROWTH-META-SIGNUP-AUDIT-001 (**CERRADA · APTO**) |
| Estado | **CERRADA · META PARCIAL** |
| Alcance | Preparar onboarding oficial WhatsApp vía Embedded Signup v4 |
| Fuera de alcance | Implementar Embedded Signup · modificar Mensajes · modificar Centro de Canales · abrir ES-BACKEND-001 · tocar datos productivos |

**Restricciones cumplidas:** sin Embedded Signup en código; sin cambios UX; sin nuevo conector; sin nuevo webhook; sin valores secretos en este documento; sin mover secretos a tenant.

---

## Arquitectura aprobada (auditoría previa)

- Una Meta App de **Growth OS**.
- Un webhook compartido.
- Cada Espacio conecta su propio negocio / WABA / número.
- Credenciales y activos del cliente aislados por tenant.
- Meta factura al cliente (modelo Tech Provider).
- Embedded Signup **v4** = onboarding normal.
- Formulario técnico actual = temporal / legacy.

---

## 1. Estado actual del repositorio

Inspección de código (working tree local). No se asumió aprobación Meta sin evidencia en repo.

### 1.1 Webhook WhatsApp — **EXISTE (no duplicar)**

| Pieza | Ubicación | Estado |
| --- | --- | --- |
| Callback público | `GET/POST /api/webhooks/whatsapp` | `src/app/api/webhooks/whatsapp/route.ts` |
| Verificación (GET) | `verifyWhatsAppWebhookSubscription` | `src/core/growth/whatsapp/verify.ts` |
| Inbound (POST) | `receiveWhatsAppCloudWebhook` | `src/core/growth/whatsapp/receive.ts` |
| Firma | `X-Hub-Signature-256` | `src/core/growth/whatsapp/crypto.ts` |
| Auth de ruta | Público (proxy no protege `/api`) | `src/proxy.ts` |

**Callback que deberá usar Meta (forma):**

```text
{APP_URL o NEXT_PUBLIC_APP_URL HTTPS}/api/webhooks/whatsapp
```

Ejemplo de forma (sin afirmar el host productivo de plataforma):

```text
https://<dominio-https-de-growth-os>/api/webhooks/whatsapp
```

No hay segundo webhook. No crear otro.

### 1.2 Dominio / URL pública

| Elemento | Estado en repo |
| --- | --- |
| Base URL | `NEXT_PUBLIC_APP_URL` / `APP_URL` (`.env.example`) |
| Host SEM de referencia en packs | `seminarioipn.cl` (dato de Espacio T001, no marca Meta App) |
| Dominio HTTPS canónico de **Growth OS / Mentor Prime** para Meta App | **Sin evidencia en código** — acción manual de Marco |

### 1.3 Variables y secretos actuales

| Ámbito | Qué hay hoy | Evidencia |
| --- | --- | --- |
| Plataforma Meta (`META_*`) | **No existen** en código ni `.env.example` | Búsqueda `META_APP` / `META_ES` / `process.env.META_` → 0 hits |
| Comentario `.env.example` | “No hay `WHATSAPP_*` de plataforma” | Líneas WhatsApp Cloud API |
| Por Espacio | `verifyToken`, `appSecret`, `accessToken` cifrados | `growth_whatsapp_connections` |
| UI legacy | Formulario pide IDs + tokens técnicos | `ChannelsSettingsClient` + `PUT /api/admin/integrations/whatsapp` |

### 1.4 Cifrado — **LISTO (reutilizar)**

- `encryptSecret` / `decryptSecret` — AES-256-GCM.
- Clave derivada de `SESSION_SECRET` (`src/lib/crypto/secrets.ts`).
- Persistencia: `verifyTokenEncrypted`, `appSecretEncrypted`, `accessTokenEncrypted` en `src/lib/growth/whatsapp-connections.ts`.
- API admin solo expone flags (`hasVerifyToken` / `hasAppSecret` / `hasAccessToken`).

### 1.5 `growth_whatsapp_connections` — **LISTO (reutilizar)**

| Campo | Rol |
| --- | --- |
| `tenantId` | Espacio (índice único) |
| `phoneNumberId` | Clave de routing webhook (índice único) |
| `wabaId` | Opcional hoy |
| `displayPhoneNumber` | Visible |
| `verifyToken` / `appSecret` / `accessToken` | Secretos por Espacio (modelo legacy) |
| `enabled` | Pausar / activo |

Colección fuera de `growth_space_config` / `site_config`. Un `phone_number_id` no puede pertenecer a dos Espacios.

### 1.6 Políticas / términos / eliminación de datos

| Superficie | Hallazgo |
| --- | --- |
| Enlaces footer | `/privacidad`, `/terminos` (`footer-content`, menú legal CMS) |
| Ruta pública | `src/app/(site)/[slug]/page.tsx` — páginas CMS publicadas por Espacio |
| Páginas hardcodeadas Growth OS | **No existen** |
| Sitemap estático | No incluye `/privacidad` ni `/terminos` |
| Data deletion URL / callback Meta | **No existe** en repo |
| Correo ops | `soporte@mentorprime.cl` (bootstrap Super Admin / IAM) |

Conclusión: hay **capacidad CMS por Espacio** de publicar privacidad/términos; **no** hay política/términos/data-deletion de **plataforma Growth OS** listos para pegar en Meta App Dashboard.

### 1.7 Rutas públicas relevantes

| Ruta | Uso Meta |
| --- | --- |
| `/api/webhooks/whatsapp` | Callback webhook (obligatorio) |
| `/privacidad`, `/terminos` (si publicadas en un Site) | Candidatas solo si el contenido es de **Growth OS**, no de un cliente |
| `/admin/*`, `/platform/*` | No públicas para Meta crawlers de políticas |
| OAuth redirect ES | **Aún no implementado** (ES-BACKEND / ES-UI) |

### 1.8 Configuración Meta en producto

| Pieza | Estado |
| --- | --- |
| Embedded Signup / FB SDK | No |
| `config_id` | No |
| Exchange `code` → business token | No |
| `subscribed_apps` / `register` phone | No |
| Conector WhatsApp | Uno solo (legacy técnico + Cloud API send/receive) |

---

## 2. Requisitos Meta

Resumen operativo vigente (Embedded Signup v4 · Tech Provider). Fuentes: documentación Meta Embedded Signup / Tech Provider / App Dashboard (2026-09). **Ningún ítem de App Review / Live / Tech Provider se marca aprobado sin evidencia de Marco.**

| # | Requisito | Para qué |
| --- | --- | --- |
| 1 | Meta App tipo Business de Growth OS | Contenedor único de la integración |
| 2 | Business Portfolio Growth OS / Mentor Prime | Dueño de la app |
| 3 | Producto WhatsApp Business Platform | Cloud API |
| 4 | Facebook Login for Business | Vehículo de Embedded Signup |
| 5 | Configuración Embedded Signup **v4** | Productos/permisos en config (no `version` en JS) |
| 6 | `config_id` | Parámetro de `FB.login` |
| 7 | Allowed Domains (HTTPS) | Host donde corre el admin / SDK |
| 8 | Valid OAuth Redirect URIs | Callback OAuth exacto |
| 9 | Webhook app → Growth OS | Un callback para todos los WABA suscritos |
| 10 | Verify token de **plataforma** | Challenge GET de Meta |
| 11 | Permisos `whatsapp_business_management` + `whatsapp_business_messaging` | Onboarding + messaging |
| 12 | Advanced Access | Clientes reales fuera de roles de la app |
| 13 | Business Verification | Prerrequisito típico Tech Provider / App Review |
| 14 | Tech Provider / Access Verification | Rol para “cliente paga a Meta” |
| 15 | App Review | Advanced Access + evidencia (vídeos envío/plantillas) |
| 16 | Live Mode | Onboarding productivo |
| — | Privacy Policy URL + Terms + Data deletion | Settings básicos / Live |
| — | Suscripción por WABA (`subscribed_apps`) | Post-ES (ES-BACKEND) |
| — | Método de pago en WABA del cliente | Billing Tech Provider (fuera de Growth OS) |

**v2:** deprecación anunciada **2026-10-15** → no implementar v2; preparar solo v4.

---

## 3. Qué ya tenemos

| Ítem | Estado |
| --- | --- |
| Webhook compartido Cloud API | Sí |
| Routing `metadata.phone_number_id` → `growth_whatsapp_connections` → `tenantId` | Sí |
| Índices únicos `tenantId` / `phoneNumberId` | Sí |
| Cifrado de secretos de Espacio | Sí |
| Envío texto Cloud API con token del Espacio | Sí (`accessToken`) |
| Superficie Ajustes → Canales (legacy) | Sí (no tocar en esta OT) |
| Modelo mental multi-Espacio (auditoría) | Aprobado |
| `META_APP_ID` / `META_APP_SECRET` / `META_ES_CONFIG_ID` / `META_WEBHOOK_VERIFY_TOKEN` en env | **No** |
| Evidencia Meta App creada / verificada / Live | **No en repo** |
| Política/términos/data-deletion de plataforma | **No** |
| Soporte firma webhook con secret de **una** Meta App | **Parcial** (hoy firma con `appSecret` **por conexión**) |

---

## 4. Qué falta

### 4.1 Ops Meta (Marco — manual)

1. Crear/reutilizar Meta App Growth OS y asociarla al Business Portfolio correcto.
2. WhatsApp + Facebook Login for Business + Embedded Signup v4 → obtener `config_id`.
3. Dominios HTTPS + OAuth Redirect URI.
4. Webhook + verify token de plataforma.
5. Solicitar permisos + Advanced Access + Business Verification + Tech Provider/Access Verification + App Review + Live.
6. Completar URLs públicas de privacidad, términos y eliminación de datos **de Growth OS**.

### 4.2 Repo / plataforma (no implementar aquí → ES-BACKEND-001)

1. Introducir env de plataforma: `META_APP_ID`, `META_APP_SECRET`, `META_ES_CONFIG_ID`, `META_WEBHOOK_VERIFY_TOKEN`.
2. Adaptar GET webhook al verify token de plataforma.
3. Adaptar POST webhook a firmar con `META_APP_SECRET` (una sola app).
4. Dejar de exigir `appSecret`/`verifyToken` por Espacio en el camino Embedded Signup.
5. Pipeline post-ES: `state`, exchange `code`, `subscribed_apps`, `register`, persistir `business_id` + business token cifrado.
6. UI “Continuar con Meta” (ES-UI-001, después del backend).

### 4.3 Contenido público plataforma

- Política de privacidad Growth OS (URL HTTPS estable).
- Términos de servicio Growth OS.
- Instrucciones o callback de eliminación de datos.
- Confirmación del dominio HTTPS canónico de la app.

---

## 5. Configuración de plataforma

**Solo nombres / roles. Sin valores. No mover a tenant.**

| Variable / activo | Rol | Estado implementación |
| --- | --- | --- |
| `META_APP_ID` | App ID público (SDK + Graph) | **no configurado** (no existe en env/código) |
| `META_APP_SECRET` | Firma webhook + exchange OAuth (solo servidor) | **no configurado** |
| `META_ES_CONFIG_ID` | `config_id` Embedded Signup v4 | **no configurado** |
| `META_WEBHOOK_VERIFY_TOKEN` | Challenge GET del webhook de la app | **no configurado** |
| Callback URL | `{HTTPS_ORIGIN}/api/webhooks/whatsapp` | Ruta **lista**; host productivo **requiere confirmación manual** |
| Allowed Domains | Host(s) HTTPS del admin Growth OS | Manual Meta |
| OAuth Redirect URI | URI exacta del flujo ES (definir en ES-BACKEND/UI) | Manual Meta + código futuro |

Equivalencia conceptual:

| PLATAFORMA (como `RESEND_API_KEY`) | ESPACIO (como hoy `accessToken`) |
| --- | --- |
| App ID | WABA autorizado |
| App Secret | `phone_number_id` |
| Embedded Signup `config_id` | `business_id` cuando corresponda |
| Webhook verify token | Business token cifrado |
| Un callback | Estado de conexión (`enabled`, display number, …) |

Confirmación contra implementación real:

- Hoy la firma POST usa `connection.appSecret` (por Espacio).
- Hoy el GET acepta el `verifyToken` de **cualquier** conexión habilitada.
- Eso sirve al formulario legacy multi-app; **no** es el modelo Tech Provider de una sola Meta App.
- Cambio diferido a **OT-GROWTH-META-ES-BACKEND-001** (no implementado aquí).

---

## 6. Configuración por Espacio

Persistir en `growth_whatsapp_connections` (reutilizar colección; enriquecer en ES-BACKEND):

| Activo | Hoy | Meta Tech Provider |
| --- | --- | --- |
| WABA | `wabaId` opcional | Obligatorio tras ES |
| `phone_number_id` | Obligatorio | Obligatorio (routing) |
| `business_id` | No modelado | Añadir cuando ES-BACKEND |
| Business token | Campo `accessToken` cifrado | Mismo rol (BISU del cliente) |
| `verifyToken` / `appSecret` por Espacio | Obligatorios en PUT legacy | Legacy / temporal; no pedir al cliente en ES |
| `enabled` / display | Sí | Sí |
| Método de pago WABA | N/A en repo | Cliente en WhatsApp Manager (fuera de Growth OS) |

Aislamiento: un `phoneNumberId` → un `tenantId`. Tokens de cliente no se comparten entre Espacios.

---

## 7. Checklist manual para Marco

Instrucciones humanas y exactas. Marcar en Meta Dashboard lo que el panel muestre; **no asumir aprobado**.

### PASO 1 — Business Portfolio

Marco entra a **Meta Business Suite / Business Settings** y confirma (o crea) el **Business Portfolio** de Growth OS / Mentor Prime que será dueño de la app.

**Devuelve al agente:** nombre del portfolio + si Business Verification aparece como verificado / pendiente / no iniciado (**sin** documentos sensibles).

### PASO 2 — Meta App

En [developers.facebook.com](https://developers.facebook.com/):

1. Crear app tipo **Business** (o reutilizar una app ya destinada a Growth OS — no una app de un cliente).
2. Nombre visible: alineado a **Growth OS** (producto), no al Espacio SEM.
3. Asociar la app al Business Portfolio del PASO 1.

**Devuelve:** App ID (público) + confirmación de asociación. **No** pegar App Secret en chat.

### PASO 3 — WhatsApp

App Dashboard → agregar **WhatsApp** / WhatsApp Business Platform.

**Devuelve:** “WhatsApp agregado: sí/no”.

### PASO 4 — Facebook Login for Business

Agregar / configurar **Facebook Login for Business**.

**Devuelve:** “Login for Business: sí/no”.

### PASO 5 — Embedded Signup v4

App Dashboard → Facebook Login for Business → **Configurations**:

1. Crear configuración (plantilla WhatsApp Embedded Signup / “With 60 Expiration Token” si está disponible).
2. Variación: **Embedded Signup**.
3. Incluir producto Cloud API / WhatsApp según el builder.
4. Copiar el **configuration ID** (`config_id`).

**Devuelve:** `META_ES_CONFIG_ID` configurado = “configurado” (guardar el valor solo en secret store / `.env` del servidor; **no** en este informe ni en chat).

### PASO 6 — Dominios permitidos

Facebook Login → Allowed Domains: host(s) **HTTPS** donde correra el admin que lanzará el SDK (sin wildcards bajo Strict Mode).

**Devuelve:** lista de dominios agregados (hosts, no secretos).

### PASO 7 — OAuth Redirect URI

Valid OAuth Redirect URIs: URI **exacta** HTTPS del callback que usará Growth OS.

> Mientras ES-BACKEND/UI no existan, Marco puede dejar anotado el dominio y completar la URI exacta cuando el agente de ES-BACKEND indique la ruta final. No inventar paths.

**Devuelve:** URIs cargadas o “pendiente de path de código”.

### PASO 8 — Webhook Growth OS

WhatsApp → Configuration → Webhooks:

- **Callback URL:** `https://<dominio-https>/api/webhooks/whatsapp`
- **Verify token:** el valor de plataforma que vivirá como `META_WEBHOOK_VERIFY_TOKEN`

**Importante (repo hoy):** el GET actual valida contra `verifyToken` de conexiones **por Espacio**. Hasta ES-BACKEND:

- Opción A (preferida): esperar el verify token de plataforma en código antes de “Verify and Save” definitivo; o
- Opción B (temporal legacy): el verify token usado en Meta debe coincidir con el de **al menos una** conexión WhatsApp habilitada (solo transición; no es el modelo final).

**Devuelve:** URL callback usada + verify token = “configurado” / “no configurado” + si Meta aceptó Verify and Save.

### PASO 9 — Campos webhook

Suscribir al menos campos necesarios para messaging (`messages`, etc.) y, para Embedded Signup, lo que Meta exija para onboarding (p. ej. `account_update` según docs vigentes).

**Devuelve:** lista de fields suscritos en la app.

### PASO 10 — Permisos

Solicitar / declarar:

- `whatsapp_business_management`
- `whatsapp_business_messaging`

**Devuelve:** estado Standard vs Advanced por permiso (tal como muestra el dashboard).

### PASO 11 — Business Verification

Completar verificación del negocio de Growth OS / Mentor Prime si no está hecha.

**Devuelve:** “verificado” / “en revisión” / “no iniciado” (sin adjuntar PII).

### PASO 12 — Tech Provider / Access Verification

Seguir el flujo **Become a Tech Provider** / Access Verification que muestre el dashboard para la app.

**Devuelve:** estado exacto del panel (no asumir “Tech Provider” sin captura/estado).

### PASO 13 — App Review

Preparar y enviar App Review (vídeos de envío y gestión de plantillas según checklist Meta).

**Devuelve:** “no enviado” / “en revisión” / “aprobado” + permisos Advanced resultantes.

### PASO 14 — Live Mode

Pasar la app a **Live** solo cuando Advanced Access y settings básicos lo permitan.

**Devuelve:** Development vs Live.

### PASO 15 — Requisitos públicos en App Dashboard

Pegar URLs HTTPS reales:

- Privacy Policy URL  
- Terms of Service URL  
- User Data Deletion (instructions URL o callback)

**Devuelve:** las tres URLs (públicas) o “falta publicar”.

### PASO 16 — Secretos en servidor (ops)

En el entorno de despliegue (nunca en git, nunca en este MD):

| Clave | Estado a reportar |
| --- | --- |
| `META_APP_ID` | configurado / no configurado |
| `META_APP_SECRET` | configurado / no configurado |
| `META_ES_CONFIG_ID` | configurado / no configurado |
| `META_WEBHOOK_VERIFY_TOKEN` | configurado / no configurado |

**Devuelve al agente solo esos cuatro estados**, más App ID público si hace falta para el siguiente OT. **No** pegar secretos.

### Qué debe devolver Marco (resumen para continuar)

1. App ID (público).  
2. Portfolio asociado + estado Business Verification.  
3. WhatsApp + Login for Business + ES v4: sí/no + `config_id` = configurado/no.  
4. Dominios Allowed + Redirect URIs (o pendiente de path).  
5. Callback webhook + Verify and Save: ok/fallo.  
6. Permisos: Standard/Advanced cada uno.  
7. Tech Provider / Access Verification: estado del panel.  
8. App Review + Live: estados.  
9. Tres URLs legales públicas.  
10. Cuatro secretos de plataforma: configurado / no configurado.

---

## 8. Requisitos públicos — clasificación

| Elemento | Clasificación | Nota |
| --- | --- | --- |
| Política de privacidad pública **Growth OS** | **FALTA** | Hay rutas CMS `/privacidad` por Espacio; no hay política de plataforma evidenciada para Meta App |
| Términos de servicio **Growth OS** | **FALTA** | Igual con `/terminos` por Espacio |
| URL eliminación de datos / instrucciones | **FALTA** | Sin ruta ni callback Meta en repo |
| Dominio HTTPS | **REQUIERE ACCIÓN MANUAL** | Capacidad HTTPS vía `APP_URL`; falta dominio canónico de plataforma confirmado por Marco |
| Correo de soporte | **LISTO** (identidad ops) / **REQUIERE ACCIÓN MANUAL** (pegar en Meta) | `soporte@mentorprime.cl` existe en IAM bootstrap |
| Información comercial Meta (Business Verification) | **REQUIERE ACCIÓN MANUAL** | Fuera del repo; sin evidencia de estado |
| Webhook público HTTPS | **LISTO** (ruta) / **REQUIERE ACCIÓN MANUAL** (host + verify en Meta) | `/api/webhooks/whatsapp` |
| Página legal de un **cliente** (SEM) | **NO APLICA** como política de la Meta App de Growth OS | No sustituye URLs de plataforma |

---

## 9. Webhook — multi-WABA / multi-Espacio

### 9.1 ¿Puede operar el diseño aprobado?

| Escenario | ¿Soportado por diseño actual? |
| --- | --- |
| Una Meta App → muchos WABA | **Parcial** — routing sí; auth de firma asume secret por conexión (legacy) |
| Muchos números | **Sí** — índice único `phoneNumberId` |
| Muchos Espacios | **Sí** — `phoneNumberId` → `tenantId` |
| Suscripción por WABA (`subscribed_apps`) | **No en código** — lo hará ES-BACKEND tras ES |

Routing esperado (ya implementado en inbound):

```text
metadata.phone_number_id
  → growth_whatsapp_connections.findEnabledByPhoneNumberId
  → tenantId
  → Persona / Conversación
```

### 9.2 Cambios solo para ES-BACKEND-001 (no hechos aquí)

1. Leer `META_WEBHOOK_VERIFY_TOKEN` en GET; dejar de depender de verify tokens por tenant para la app única.  
2. Verificar `X-Hub-Signature-256` con `META_APP_SECRET`.  
3. Mantener routing por `phone_number_id` (no cambiar).  
4. Tras ES: `POST /{waba_id}/subscribed_apps` para cada cliente.  
5. Manejo de eventos de onboarding (`account_update`, etc.) si se requieren.  
6. Compatibilidad temporal con conexiones legacy (formulario técnico) durante migración.  
7. No crear segundo webhook ni segundo conector.

---

## 10. Gate final

### **META PARCIAL**

**Por qué no META READY**

- No hay evidencia en repo ni devolución de Marco de: Meta App lista, Business Verification, Tech Provider/Access Verification, Advanced Access, Live Mode, `config_id` en servidor.  
- Secretos de plataforma **no configurados** en implementación.  
- URLs legales de **Growth OS** para App Dashboard **faltan**.  
- Webhook aún autentica con modelo **por Espacio** (legacy).

**Por qué no META BLOQUEADO**

- Arquitectura aprobada y piezas de runtime reutilizables ya existen (webhook, colección, cifrado, routing, Canales legacy).  
- Marco puede ejecutar el checklist Meta ahora.  
- Nada en esta OT bloquea abrir el trabajo ops; el bloqueo de **clientes reales en Live** es el estado Meta + App Review, no la ausencia de un segundo webhook.

**Qué falta para acercarse a META READY**

1. Devolución de Marco (PASOS 1–16) con estados reales del dashboard.  
2. Publicar privacidad / términos / data deletion de Growth OS en HTTPS.  
3. Secretos de plataforma en el entorno = configurado (sin exponer valores).  
4. Luego: ES-BACKEND (auth webhook de plataforma + pipeline ES) — **no abierto automáticamente**.

---

## 11. Próximo paso recomendado

1. **Marco:** ejecutar checklist §7 y devolver el resumen §7 (sin secretos).  
2. **Contenido:** publicar URLs legales de plataforma Growth OS.  
3. **Después de META más completo:** abrir manualmente **OT-GROWTH-META-ES-BACKEND-001** (state, exchange, subscribe, register, secretos de plataforma, tests).  
4. Luego **OT-GROWTH-META-ES-UI-001** (Continuar con Meta en Canales).  

**No abierto automáticamente:** OT-GROWTH-META-ES-BACKEND-001.

---

## Cierre

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-META-TP-001 |
| Resultado | Informe de preparación entregado |
| Gate | **META PARCIAL** |
| Código de producto modificado | No |
| Embedded Signup implementado | No |
| Mensajes / Canales tocados | No |
| Siguiente OT | Pendiente de decisión humana tras devolución de Marco |

**OT-GROWTH-META-TP-001 — CERRADA · META PARCIAL.**
