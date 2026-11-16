# Deuda de seguridad: ROPC y ruta a Authorization Code + PKCE

**Estado:** deuda abierta. No está implementada.  
**IdP:** Keycloak sigue siendo el único proveedor de identidad.  
**Alcance de esta nota:** el login del escritorio (`POST /api/identity/auth/keycloak/session`). No cambia Growth OS, Aprende Hoy ni RR.HH. NELZURI Connect no sustituye este login.

## Qué queda mal

El login productivo usa Resource Owner Password Credentials (Direct Access Grants):

1. El navegador envía correo y contraseña a Growth OS.
2. El servidor los reenvía a Keycloak (`grant_type=password`) y recibe tokens.
3. Growth OS guarda una cookie opaca `ah_session` y no deja sesión del IdP en el navegador.

Consecuencias:

- La contraseña pasa por la aplicación, no solo por Keycloak.
- No hay sesión de SSO en el dominio del IdP. Por eso Cumple no puede entrar con un authorization code del navegador sin volver a pedir la contraseña.
- El cliente OIDC actual (`growth-os-dev` / `growth-os-web`) tiene un solo `redirect_uri`, el callback de Growth OS.
- ROPC no transporta la empresa activa, el plan ni la llave. Aunque el login migre, Cumple sigue necesitando el canje de Connect para eso.

Connect no empeora esta deuda: no añade otro grant de contraseña ni otro IdP.

## A dónde se migra

Authorization Code con PKCE, Keycloak como servidor de autorización, Growth OS como cliente público o confidencial del escritorio. El navegador habla con Keycloak. La aplicación solo recibe un `code` de un solo uso y lo canjea en el servidor con `code_verifier`.

Eso no elimina Launch/Exchange. El code de Keycloak identifica a la persona. El código de Connect sigue atando empresa, plan, llave y destino.

## Ruta

Cada paso es desplegable solo. No se apaga ROPC hasta que el paso 4 lleva tráfico real.

1. **Cliente Keycloak del escritorio.** Registrar (o ampliar) el cliente con `redirect_uri` únicamente del origen del escritorio, PKCE S256 obligatorio, y Direct Access Grants todavía encendido para no cortar el login actual. Sin `redirect_uri` de Cumple: Cumple no es un cliente OIDC.
2. **Arranque paralelo.** Nueva ruta de login que redirige a Keycloak con `code_challenge`. El callback existente (`/api/identity/auth/keycloak/callback`) ya canjea con `code_verifier` y emite `ah_session`. El formulario ROPC sigue disponible mientras tanto.
3. **Cookie y sesión.** La sesión opaca no cambia de forma: mismo `identity_sessions`, misma cookie host-only, sin atributo `Domain`. No se comparte con Cumple. Los tokens de Keycloak no se guardan en el navegador.
4. **Corte.** Cuando el tráfico del formulario ROPC sea nulo, quitar el formulario, borrar el grant de contraseña del servidor y apagar Direct Access Grants en el cliente. Las invitaciones ya evitan ROPC y no se tocan en esta deuda.
5. **Connect se queda.** Después del corte, el escritorio tiene sesión de IdP en el navegador, pero Cumple sigue entrando por Launch/Exchange. Un authorization code de Keycloak hacia el host de Cumple sería otro cliente y otro `redirect_uri`, y seguiría sin conocer plan ni llave. No forma parte de esta ruta.

## Qué no hacer en el corte

- No poner la contraseña en un cliente de Cumple.
- No copiar `ah_session` al host de Cumple.
- No usar el token de Keycloak como sesión del producto.
- No ampliar el `redirect_uri` de Growth OS al origen de Cumple.

## Cómo se sabe que terminó

- El navegador obtiene el code en Keycloak y el servidor lo canjea con PKCE.
- `POST /api/identity/auth/keycloak/session` ya no acepta contraseñas.
- Direct Access Grants del cliente queda apagado.
- Connect sigue exigiendo empresa, plan, llave y canje de servidor.
