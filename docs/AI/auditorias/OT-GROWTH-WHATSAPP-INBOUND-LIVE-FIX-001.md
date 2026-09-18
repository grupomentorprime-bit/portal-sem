# OT-GROWTH-WHATSAPP-INBOUND-LIVE-FIX-001 — POST inbound live

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-WHATSAPP-INBOUND-LIVE-FIX-001 |
| Tipo | Fix / Operatividad live |
| Fecha | 2026-09-16 |
| Entrada | Meta webhook Verify+Save OK · WABA suscrita · número producción registrado · Mensajes vacío |
| Estado | **CERRADA · APTO (código)** · **Live Mensajes = PENDIENTE OPS** (falta fila en `growth_whatsapp_connections`) |
| Alcance | Seguir `POST /api/webhooks/whatsapp` hasta persistencia; fix mínimo del corte; regresiones |
| Fuera de alcance | Cloudflare · GET handshake · Keycloak · UI · segundo webhook |

---

## Gate final

# APTO (código) · Live pendiente de conexión por Espacio

### Evidencia del corte (primer punto exacto)

| Paso | Resultado |
| --- | --- |
| 1. Recepción POST | **Sí llega al handler** de `growthos.mentorprime.cl` (probes: `{}`→403, JSON inválido→400 `{ok:false}`). No es Cloudflare ni Keycloak. |
| 2. Meta App subscription | Graph: callback `https://growthos.mentorprime.cl/api/webhooks/whatsapp`, `active:true`, field `messages` incluido. |
| 3. X-Hub-Signature-256 | Con conexión ausente, el código **antes** cortaba en `unknown_phone_number` **antes** de exigir firma útil con App Secret de plataforma. |
| 4. App Secret | `META_APP_SECRET` presente en runtime local (len=32, sin comillas). Verify token también. |
| 5. Parseo payload | Intactos (más coerce numérico de `phone_number_id`). |
| 6. `phone_number_id` → conexión | **CORTE:** `growth_whatsapp_connections` = **0 documentos** en `SeminarioIPN`. `findEnabledByPhoneNumberId` → null. |
| 7. Quién devolvía el error | `receiveWhatsAppCloudWebhook` → `authenticatePayload` → `reason: "unknown_phone_number"` → `route.ts` **HTTP 403** `{ok:false}`. |
| 8. Persistencia / Persona / Opp | No se alcanzan: 0 `growth_conversaciones`, 0 `growth_mensajes` canal whatsapp. |

**Conclusión:** Meta está bien cableada al webhook. El POST real se corta en la **resolución de Espacio por `phone_number_id`**: no hay conexión habilitada persistida. Suscribir WABA en Meta **no** crea la fila de Growth OS.

No hay audit `settings.integrations.update` sobre `growth_whatsapp_connections` (solo tests antiguos 2026-09-08 en `adl`).

---

## 2. Fix mínimo aplicado

| Archivo | Cambio |
| --- | --- |
| `receive.ts` | Firma (plataforma/legacy) **antes** de exigir conexión. Si firma OK y sin mapeo → **200** + `ignored` (ACK Meta) + log `signed inbound without enabled connection <phoneNumberIds>`. Ya no 403 por número no mapeado cuando hay `META_APP_SECRET`. |
| `route.ts` | `console.error` en rechazo y en “signed but nothing persisted”. |
| `meta-platform.ts` | `META_APP_SECRET` tolera comillas envolventes (paridad con verify token). |
| `parse.ts` | `phone_number_id` numérico → string. |
| `upsert-connection.ts` | Con Meta de plataforma lista, no exige duplicar verify/appSecret por Espacio (como Embedded Signup). |
| `test-connection.ts` | No marca “incomplete” una conexión ES/plataforma sin secretos por Espacio. |

**No** se inventó `phone_number_id` ni se tocó UI/Cloudflare/GET/Keycloak.

---

## 3. Validación

```bash
npx tsx --test tests/baseline/growth-messaging-002.test.ts \
  tests/baseline/growth-whatsapp-webhook-verify-fix-001.test.ts \
  tests/baseline/growth-whatsapp-meta-001.test.ts \
  tests/baseline/growth-messaging-003.test.ts \
  tests/baseline/growth-messaging-005.test.ts \
  tests/baseline/growth-e2e-fix-002.test.ts
```

| Suite | Resultado |
| --- | --- |
| Todas las anteriores | **70/70 PASS** |

---

## 4. Ops para cerrar live (criterio Mensajes)

Tras **deploy** de este fix:

1. En el Espacio de prueba: **Ajustes → Canales → configuración técnica** con:
   - Phone Number ID del número de producción (Meta)
   - Access token (Generar token / business token)
   - Verify token + App Secret (mismos de plataforma; el formulario aún los marca required en connect)
2. Guardar → debe existir **1** doc en `growth_whatsapp_connections` (`enabled: true`).
3. Reenviar un WhatsApp real al número de producción.
4. Verificar Growth OS → Mensajes + Persona/Oportunidad (H2).

Sin el paso 1–2, el POST firmado ahora hará **200 ignored** (no 403), pero **no** creará conversación: sigue faltando el mapeo Espacio.

`META_ES_CONFIG_ID` sigue ausente en `.env` local → Embedded Signup `meta.ready=false`; el camino operable hoy es el formulario técnico.

---

## 5. Veredicto

| Dimensión | Resultado |
| --- | --- |
| Primer corte identificado | **Sí** — `unknown_phone_number` / 0 connections |
| Fix mínimo código | **APTO** |
| Criterio live Mensajes + H2 | **PENDIENTE OPS** (persistir conexión del Espacio + redeploy) |

**OT-GROWTH-WHATSAPP-INBOUND-LIVE-FIX-001 — CERRADA (código APTO).**
