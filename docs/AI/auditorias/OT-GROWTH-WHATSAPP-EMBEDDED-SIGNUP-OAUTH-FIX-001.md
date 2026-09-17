# OT-GROWTH-WHATSAPP-EMBEDDED-SIGNUP-OAUTH-FIX-001 — inicio Embedded Signup

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-WHATSAPP-EMBEDDED-SIGNUP-OAUTH-FIX-001 |
| Tipo | Fix / Operatividad |
| Entrada | OT-GROWTH-WHATSAPP-META-001 · Meta App live (dominio OK) · error “supported permission” |
| Estado | **CERRADA · código APTO** · **Meta live = no declarado** (requiere redeploy + verificación manual del diálogo) |
| Alcance | Solo inicio de Facebook Login for Business / WhatsApp Embedded Signup |
| Fuera de alcance | Deploy · push · segundo conector · webhook POST · hardcodes de tenant/número · App Review |

---

## Gate

| Dimensión | Resultado |
| --- | --- |
| Causa raíz identificada | **Sí** |
| Fix mínimo del inicio OAuth | **APTO** |
| APTO LIVE Meta | **No declarado** |

---

## 1. Causa raíz

Al pulsar **Conectar WhatsApp**, Meta abría un diálogo OAuth genérico (OIDC):

```text
…/dialog/oauth/?client_id=<APP_ID>&response_type=token&scope=openid&display=popup&…
```

Eso **no** es WhatsApp Embedded Signup. El flujo oficial (Facebook Login for Business) debe ir con:

- `config_id` = Embedded Signup Configuration ID
- `response_type=code`
- `override_default_response_type=true`
- **sin** `scope` (los permisos viven en la Configuration de Meta)

Cuando falta un `config_id` válido (ausente, placeholder, o envuelto en comillas literales), el SDK cae al login OIDC por defecto (`scope=openid` + `response_type=token`). Con Login for Business activo, Meta responde:

> “Parece que esta app no está disponible. Esta app necesita al menos un supported permission.”

Evidencia local previa: `.env` tenía `META_APP_ID` / secret / verify, pero **no** `META_ES_CONFIG_ID` → `meta.ready=false` en sesión. En runtime de producción el síntoma observado (URL con `scope=openid` y sin `config_id` efectivo) es el mismo fallo de inicio: el diálogo no recibe la Configuration de Embedded Signup.

No es un fallo de permisos del App Dashboard (ya están `whatsapp_business_management` + `whatsapp_business_messaging`); es el **vehículo OAuth** incorrecto.

---

## 2. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/lib/growth/whatsapp-embedded-signup-client.ts` | Opciones oficiales exportadas; Graph `v26.0`; guardias de ID; SDK load endurecido; **nunca** `scope` |
| `src/core/growth/whatsapp/meta-platform.ts` | Strip de comillas en todos los META_*; IDs públicos deben ser numéricos |
| `src/components/admin/ChannelsSettingsClient.tsx` | No lanza FB.login sin App ID / Config ID numéricos |
| `src/core/growth/whatsapp/index.ts` / `src/core/growth/index.ts` | Export `isMetaPublicId` |
| `tests/baseline/growth-whatsapp-meta-001.test.ts` | IDs numéricos + suite OAUTH-FIX-001 |
| `.env` (local) | `META_ES_CONFIG_ID` público agregado (no secreto) |

**Reutilizado sin tocar:** `growth_whatsapp_connections`, callback `meta/complete`, state firmado, exchange server-side, webhook, secretos solo servidor.

---

## 3. Cambio mínimo aplicado

1. Construir explícitamente opciones de `FB.login` con `config_id` + `response_type=code` (sin `scope`).
2. Rechazar inicio si App ID / Config ID no son IDs numéricos Meta.
3. Normalizar env (comillas Dokploy) para que `META_ES_CONFIG_ID` llegue limpio al cliente.
4. Alinear SDK a Graph **v26.0** (docs Meta Embedded Signup vigentes).

---

## 4. URL / parámetros efectivos del inicio (sin secretos)

Tras el fix, el cliente exige (y documenta vía `describeWhatsAppEmbeddedSignupOAuthParams`):

| Parámetro | Valor esperado |
| --- | --- |
| `client_id` | `885668187811415` |
| `config_id` | `1399738671588159` |
| `response_type` | `code` |
| `scope` | **ausente** (no `openid`) |

`FB.login` options:

```js
{
  config_id: "1399738671588159",
  response_type: "code",
  override_default_response_type: true,
  extras: { setup: {}, sessionInfoVersion: "3" }
}
```

---

## 5. Pruebas

```bash
npx tsx --test tests/baseline/growth-whatsapp-meta-001.test.ts
```

| Suite | Resultado |
| --- | --- |
| `growth-whatsapp-meta-001` (+ OAUTH-FIX-001) | **20/20 PASS** |
| `growth-messaging-002` | **PASS** |
| `growth-messaging-005` | **PASS** |
| `growth-whatsapp-webhook-verify-fix-001` | **PASS** |

Validación manual post-deploy (no ejecutada aquí): Conectar WhatsApp → diálogo Embedded Signup real → **sin** el error “supported permission”.

---

## 6. Ops pendiente (fuera de esta OT de código)

1. Asegurar en el entorno de **producción** `META_ES_CONFIG_ID=1399738671588159` (sin comillas literales).
2. Redeploy del build con este fix.
3. Verificar en Network/popup que la URL incluye `config_id` y `response_type=code`, no `scope=openid`.

**No deploy / push** sin autorización.

### Post-deploy check (2026-09-17)

Con `1249a5d` desplegado, producción seguía abriendo `response_type=token&scope=openid` sin `config_id`.

**Causa adicional:** `ChannelsSettingsClient` hacía `await fetch(session)` + `await loadFacebookSdk` **antes** de `FB.login`. Sin user-gesture, el JS SDK de Meta cae al diálogo OIDC por defecto (token/openid) e ignora el Embedded Signup aunque las opciones lleven `config_id`.

No era bundle viejo ni `NEXT_PUBLIC_*` (los IDs públicos vienen del session API en runtime). El HTML admin es `no-store`; los chunks `/_next/static` son immutable por hash.

**Fix mínimo extra:** precargar el SDK al tener `meta.ready` y llamar `launchWhatsAppEmbeddedSignupReady` de forma síncrona en el click (sin await previo).

---

## 7. Veredicto

| Dimensión | Resultado |
| --- | --- |
| Código inicio Embedded Signup | **APTO** |
| Meta live end-to-end | **No declarado** |

**OT-GROWTH-WHATSAPP-EMBEDDED-SIGNUP-OAUTH-FIX-001 — CERRADA (código).**
