# Operador Congreso — control total + acceso por clave desde login

**Fecha:** 2026-11-17  
**Estado:** diseño aprobado (conversación); pendiente plan de implementación  
**Enfoque:** A — reutilizar invitaciones / reenvío de acceso existentes

## Objetivo

1. Que el rol **Operador Congreso Varones** opere todo el control del congreso **sin depender de Soporte**.
2. Que la **invitación por correo** deje claro cómo crear la clave y **dónde entrar** al sistema (`/login`).
3. Que en el **login** exista una opción para **solicitar / reenviar** el enlace de clave (crear o recuperar), sin intervención de Soporte.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Enfoque | A: reutilizar flujo de invitación / `resendMemberAccess` |
| Recuperación | Self-service en `/login` (opción C: pendiente + cuenta activa) |
| Clave “igual” | No se reenvía la misma clave; siempre enlace nuevo para crear/renovar |
| Login URL | `GROWTH_LOGIN_PATH` = `/login` |
| Shell operador | Sigue acotado al congreso (+ help / profile / notifications) |
| Alcance fuera | Reset nativo Keycloak UI; cambios UX del panel recepción; despliegue |

## 1. Permisos del operador

Plantilla `ROLE_CODES.CONGRESS_OPERATOR` / `ROLE_PERMISSION_TEMPLATES`:

| Permiso | Valor |
|---------|-------|
| `congress.view` | true |
| `congress.operate` | true |
| `congress.payments` | true |
| `congress.import` | true |
| **`congress.finance.correct`** | **true** (cambio) |

Actualizar también `permissionIds` en defaults del rol y el test `congress-access.test.ts` (hoy espera `finance.correct === false`).

Sin cambios de catálogo de permisos ni de rutas del shell.

## 2. Correo de invitación

Mantener CTA principal **“Crear mi contraseña”** → `/invite/{token}`.

Ampliar copy para dejar explícito el acceso posterior:

- Pasos: abrir enlace → definir contraseña → **entrar en `/login`** con correo y contraseña creada.
- Texto visible con la URL absoluta de login (`emailAbsoluteUrl(..., GROWTH_LOGIN_PATH)`), no solo “centro de administración”.
- Vencimiento del enlace de invitación sin cambio de política.
- Reenvío desde Equipo: renueva token; el enlace anterior deja de servir (comportamiento actual).
- Marca departamento Varones sin cambio.

Archivos típicos: `renderInvitationEmail` en `src/lib/notifications/email.ts` (+ voz en `email-brand` solo si hace falta ajustar subject/preview).

## 3. Login — solicitar / reenviar clave

### UI

En `LoginForm` (ruta `/login`):

- Enlace: **“¿No tienes o perdiste tu clave?”**
- Al activarlo: campo correo + botón **“Enviar enlace”**
- Mensaje de éxito **siempre genérico** (exista o no el correo):  
  *“Si el correo está registrado, enviamos un enlace para crear o renovar tu clave.”*
- Errores solo de validación de formato / rate limit / fallo de envío genérico; nunca “usuario no encontrado”.

### Servidor (API pública, sin sesión)

Endpoint nuevo (nombre orientativo): `POST /api/identity/access/request-link`

Body: `{ email: string }`

Comportamiento:

| Situación | Acción |
|-----------|--------|
| Invitación `pending` para ese email (tenant resoluble) | `renewInvitationToken` + `sendInvitationEmail` |
| Usuario con membership activa | Reutilizar lógica equivalente a `resendMemberAccessEmail` (enlace para crear/renovar clave) |
| Desconocido / sin acceso | No enviar; responder **200** con el mismo mensaje genérico |

Seguridad:

- Respuesta uniforme (anti-enumeración).
- Rate limit básico por IP y/o email normalizado.
- Enlace nuevo; anterior invalidado al renovar.
- No depender de `settings.team` ni de Soporte.

Resolución de tenant: seguir el patrón más seguro ya usado en identity para flujos públicos (si hay ambigüedad multi-tenant, no filtrar existencia; solo enviar cuando el match sea inequívoco según reglas existentes del proyecto). Documentar la regla concreta en el plan al inspeccionar código.

## 4. Verificación

- Operador con `congress.finance.correct` puede corregir/anular sin Soporte.
- Invitación nueva muestra CTA de clave + URL de `/login`.
- Desde login, correo con invitación pendiente o miembro activo recibe enlace; correo desconocido ve el mismo OK.
- Tras crear/renovar clave con el enlace, login con correo + clave funciona.
- Tests: plantilla de permisos; mensaje genérico / no leak; (si aplica) rate limit.

## 5. Fuera de alcance

- UI de reset de Keycloak.
- Rediseño del panel Congreso / recepción.
- Commit/PR/despliegue salvo pedido explícito.
- Cambiar el reenvío desde Equipo (sigue existiendo como canal admin).

## Criterios de éxito

1. Operador Congreso no necesita Soporte para operar ni corregir finanzas del congreso.
2. El invitado entiende dónde crear la clave y dónde entrar después.
3. Desde login puede pedir un enlace nuevo sin ayuda humana.
4. No se revela si un correo existe o no.
