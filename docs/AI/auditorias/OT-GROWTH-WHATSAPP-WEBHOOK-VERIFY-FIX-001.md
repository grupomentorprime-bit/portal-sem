# OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 — Handshake GET Meta

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 |
| Tipo | Fix / Operatividad |
| Fecha | 2026-09-16 |
| Entrada | [OT-GROWTH-WHATSAPP-META-001](./OT-GROWTH-WHATSAPP-META-001.md) · síntoma producción (Meta no valida URL/token; GET → 403) |
| Estado | **CERRADA · APTO (código)** · Verify and Save en Meta Dashboard = **PENDIENTE OPS** tras deploy |
| Alcance | GET `/api/webhooks/whatsapp` (hub.mode / hub.verify_token / hub.challenge); exclusión explícita en proxy; prueba focalizada |
| Fuera de alcance | Cloudflare · MongoDB · Keycloak · POST firma (solo se conserva) · otro webhook · otros módulos |

**Restricciones cumplidas:** sin segundo webhook ni motor; POST con `X-Hub-Signature-256` / App Secret intacto; sin tocar edge/Cloudflare/producción fuera del código.

---

## Gate final

# APTO

El handshake oficial GET responde **200 + `hub.challenge` en texto plano** cuando `hub.mode=subscribe` y el token coincide con `META_WEBHOOK_VERIFY_TOKEN`, **sin abrir Mongo** y **sin gate de sesión**. Token incorrecto o GET sin parámetros → **403**. POST sigue exigiendo firma válida.

---

## 1. Causa raíz

| Hallazgo | Detalle |
| --- | --- |
| **Quién devolvía 403** | El propio handler GET, no Keycloak ni `IDENTITY_ENFORCE` |
| **Archivo / líneas (antes)** | `src/app/api/webhooks/whatsapp/route.ts` (~L47–60): cualquier `!result.ok` → `403` |
| **Cadena middleware** | `src/proxy.ts` **no** exigía sesión en `/api/*`; el 403 no venía del proxy |
| **Fragilidad** | El GET **abría siempre** `openGrowthWhatsAppConnectionStore` (Mongo) **antes** de validar el token de plataforma. Con Embedded Signup, `verifyToken` por Espacio queda vacío → si el camino de plataforma falla o se demora, el handshake Meta colapsa a 403/timeout |
| **Síntoma “GET directo → 403”** | Un GET sin `hub.*` es `invalid_mode` / params faltantes → **403 controlado** (esperado). Meta falla igual si el token no coincide o el camino plataforma no es el primero |

No había un bloqueo de auth sobre el webhook; el contrato de verify debía endurecerse para el camino oficial Meta (env) sin depender de DB en el happy path.

---

## 2. Cambio mínimo

| Archivo | Cambio |
| --- | --- |
| `src/core/growth/whatsapp/verify.ts` | `store` nullable; plataforma primero; challenge sin `trim`; sin DB si no hay store |
| `src/app/api/webhooks/whatsapp/route.ts` | GET: `verifyWhatsAppWebhookSubscription(null, query)` primero; Mongo solo en fallback legacy |
| `src/proxy.ts` | Early-return explícito para `/api/webhooks/` (público; sin sesión) |
| `src/core/growth/whatsapp/meta-platform.ts` | `getMetaWebhookVerifyToken` tolera comillas envolventes del env |
| `tests/baseline/growth-whatsapp-webhook-verify-fix-001.test.ts` | **Nuevo** — contrato GET/POST/proxy |

POST: sin cambios de política (sigue `receiveWhatsAppCloudWebhook` + firma).

---

## 3. Validación

```bash
npx tsx --test tests/baseline/growth-whatsapp-webhook-verify-fix-001.test.ts
npx tsx --test tests/baseline/growth-whatsapp-meta-001.test.ts
npx tsx --test tests/baseline/growth-messaging-002.test.ts
npx tsx --test tests/baseline/proxy-admin-gate.test.ts
```

| Suite | Resultado |
| --- | --- |
| `growth-whatsapp-webhook-verify-fix-001` | **PASS** (GET ok / 403 wrong / 403 bare / POST firma / proxy público) |
| `growth-whatsapp-meta-001` | **PASS** (regresión) |
| `growth-messaging-002` | **PASS** (regresión) |
| `proxy-admin-gate` | **PASS** |

---

## 4. Ops (fuera de código)

Tras desplegar este fix:

1. Confirmar que `META_WEBHOOK_VERIFY_TOKEN` en el runtime = Verify Token del App Dashboard (sin comillas extra).
2. Reintentar **Verify and Save** en Meta sobre `https://<host>/api/webhooks/whatsapp`.
3. No abrir el POST ni desactivar firma.

---

## 5. Veredicto

| Dimensión | Resultado |
| --- | --- |
| **Código / contrato GET** | **APTO** |
| **POST seguridad** | **Conservada** |
| **Meta live Verify and Save** | **PENDIENTE OPS** (deploy + reintento Dashboard) |

**OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 — CERRADA (código APTO).**
