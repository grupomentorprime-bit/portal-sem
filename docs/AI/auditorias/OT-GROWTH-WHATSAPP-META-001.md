# OT-GROWTH-WHATSAPP-META-001 — Conexión guiada de WhatsApp

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-WHATSAPP-META-001 |
| Tipo | Operatividad / Funcionalidad |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-META-TP-001](./OT-GROWTH-META-TP-001.md) · conector WhatsApp existente (MESSAGING-002/003/005) |
| Estado | **CERRADA · Growth OS preparado APTO · Meta live PENDIENTE CONFIGURACIÓN EXTERNA** |
| Alcance | Embedded Signup v4 sobre el conector existente; UI guiada; webhook de plataforma; aislamiento por Espacio |
| Fuera de alcance | H1/H2/H3 · Growth Core · Sales Core · Automation Runtime · Shell · IAM · otros canales · segundo conector WhatsApp |

**Restricciones cumplidas:** sin segundo conector; sin inventar App ID / Configuration ID / secretos; formulario técnico solo como compatibilidad admin; secretos de plataforma no enviados al navegador ni duplicados en documentos de Espacio; flujo Persona → Conversación → Oportunidad → Mensajes intacto.

---

## Gate final

### Growth OS preparado: **APTO**

El conector existente admite el flujo oficial Meta (Embedded Signup v4): session/state firmado por Espacio, exchange de `code` en servidor, suscripción WABA, persistencia en `growth_whatsapp_connections`, UI humana en Ajustes → Canales, webhook con verify/firma de plataforma + fallback legacy. Contrato validado con mocks.

### Meta live: **PENDIENTE CONFIGURACIÓN EXTERNA**

No hay evidencia en el entorno de que existan `META_APP_ID`, `META_APP_SECRET`, `META_ES_CONFIG_ID` ni `META_WEBHOOK_VERIFY_TOKEN`. Sin esos valores (y sin App Meta Live / dominios / App Review según checklist de META-TP-001) no se declara conexión real APTO.

---

## 1. Auditoría previa (reutilizado)

| Pieza | Ubicación | Decisión |
| --- | --- | --- |
| `growth_whatsapp_connections` | Mongo · índices 019 | **Reutilizar** — enriquecer con `connectionSource`, `businessId` |
| Webhook único | `GET/POST /api/webhooks/whatsapp` | **Reutilizar** — auth de plataforma + legacy |
| Recepción | `receiveWhatsAppCloudWebhook` | **Intacta** (routing por `phone_number_id`) |
| Envío | `sendWhatsAppReply` / Cloud API | **Intacta** (token del Espacio) |
| Cifrado | AES-256-GCM · `SESSION_SECRET` | **Reutilizar** — business token cifrado |
| UI Canales | `ChannelsSettingsClient` | **Evolucionar** — flujo Meta primario |
| Permiso | `settings.integrations` | **Sin cambio** |
| Config Meta en repo | Ausente antes de esta OT | **Introducir** nombres de env (sin valores) |
| Variables | Ver §4 | Plataforma vs Espacio |

No se abrió otro motor ni otra ruta webhook.

---

## 2. Experiencia implementada

```text
Ajustes → Canales → WhatsApp
         ↓
   Conectar WhatsApp
         ↓
  Autorizar en Meta (FB.login + config_id)
         ↓
 elegir/configurar negocio y número
         ↓
 Growth OS recibe code + assets (servidor)
         ↓
 WhatsApp · Conectado · +56 9 …
 [Administrar]  [Desconectar]
```

- Usuario normal **no** ingresa App Secret · Access Token · Phone Number ID · Verify Token.
- Formulario técnico permanece como **compatibilidad administrativa temporal** (colapsado / secundario).
- Si falta configuración Meta de plataforma, la UI lo indica y no finge conexión live.

---

## 3. Cambios en código

| Área | Archivos |
| --- | --- |
| Plataforma Meta | `meta-platform.ts`, `connect-state.ts`, `embedded-signup.ts` |
| Webhook | `verify.ts`, `receive.ts` (App Secret / verify de plataforma primero) |
| Modelo | `types.ts`, `channel-status.ts`, `upsert-connection.ts`, store Mongo/memoria |
| API | `…/whatsapp/meta/session`, `…/complete`, `…/disconnect` |
| UI | `ChannelsSettingsClient.tsx`, `whatsapp-embedded-signup-client.ts`, labels |
| Seguridad | CSP Facebook SDK · redact `META_APP_SECRET` · `.env.example` (solo nombres) |
| Tests | `tests/baseline/growth-whatsapp-meta-001.test.ts` |

Pipeline servidor (docs Meta Embedded Signup / Graph):

1. `GET …/oauth/access_token` (code → business token) — **solo servidor**
2. `POST /{waba-id}/subscribed_apps`
3. `POST /{phone-number-id}/register` (fail-soft si ya registrado)
4. Probe `display_phone_number` → persistir en `growth_whatsapp_connections` del `tenantId` del state

Secretos de plataforma **no** se copian al documento del Espacio. La firma webhook usa `META_APP_SECRET`; el verify GET usa `META_WEBHOOK_VERIFY_TOKEN` (con fallback a conexiones legacy).

---

## 4. Qué falta (configuración externa)

No se inventaron valores. Para Meta live hace falta configurar en el **entorno de despliegue** (nunca pegar secretos en chat ni en este MD):

| Variable | Dónde obtenerla en Meta | Dónde configurarla en Growth OS |
| --- | --- | --- |
| `META_APP_ID` | App Dashboard → Settings → Basic → App ID | Env del servidor / secret store |
| `META_APP_SECRET` | App Dashboard → App Secret (solo servidor) | Env del servidor / secret store |
| `META_ES_CONFIG_ID` | Facebook Login for Business → Configurations → Embedded Signup v4 → Configuration ID | Env del servidor |
| `META_WEBHOOK_VERIFY_TOKEN` | Valor elegido al configurar Webhooks de la app | Mismo valor en Meta Dashboard + env |

También (ops Meta, ver META-TP-001 §7):

- Allowed Domains HTTPS del admin Growth OS
- Valid OAuth Redirect URIs (dominio del admin que carga el SDK)
- Callback webhook: `{HTTPS}/api/webhooks/whatsapp` + Verify and Save con el verify de plataforma
- Permisos Advanced / App Review / Live Mode / Tech Provider según estado real del dashboard
- Privacy / Terms / Data deletion URLs de **plataforma** Growth OS

### Qué ya quedó preparado

- Lectura de config + UI que solo recibe App ID / config_id públicos vía API autenticada
- State firmado atado al Espacio
- Complete/disconnect con aislamiento `phoneNumberId` → un `tenantId`
- Webhook multi-Espacio con secret de una sola Meta App
- CSP para `connect.facebook.net` / `graph.facebook.com` / Facebook frames
- Compatibilidad del formulario técnico legacy

---

## 5. Validación

```bash
npx tsx --test tests/baseline/growth-whatsapp-meta-001.test.ts
npx tsx --test tests/baseline/growth-messaging-002.test.ts
npx tsx --test tests/baseline/growth-messaging-003.test.ts
npx tsx --test tests/baseline/growth-messaging-005.test.ts
```

| Suite | Resultado |
| --- | --- |
| `growth-whatsapp-meta-001` | **17/17 PASS** (mocks: aislamiento 2 Espacios, state inválido/expirado/mismatch, cancel/ausencia Meta, webhook plataforma+legacy, CSP/env) |
| `growth-messaging-002` | **PASS** (regresión inbound) |
| `growth-messaging-003` | **PASS** (regresión envío) |
| `growth-messaging-005` | **PASS** (Canales) |

**Meta live:** no ejecutado — sin variables de plataforma en el entorno local. No se declara APTO live.

H1/H2/H3, Growth Core, Sales Core, Automation Runtime, Shell e IAM: **no modificados**.

---

## 6. Seguridad

| Control | Estado |
| --- | --- |
| App Secret / verify / business token fuera del navegador | Sí |
| Business token cifrado en Mongo | Sí |
| State firmado + `expectedTenantId` | Sí |
| Un `phoneNumberId` no puede robarse entre Espacios | Sí (409) |
| Tokens completos fuera de logs/tests/docs | Sí (mocks con placeholders) |
| Secretos de plataforma no duplicados por tenant | Sí |

---

## 7. Veredicto

| Dimensión | Resultado |
| --- | --- |
| **Growth OS preparado** | **APTO** |
| **Meta live** | **PENDIENTE CONFIGURACIÓN EXTERNA** |

Cuando las cuatro variables estén `configurado` en el entorno (reportar solo estados, sin valores) y exista una conexión real de prueba entre dos Espacios, se podrá reevaluar Meta live.

**OT-GROWTH-WHATSAPP-META-001 — CERRADA.**
