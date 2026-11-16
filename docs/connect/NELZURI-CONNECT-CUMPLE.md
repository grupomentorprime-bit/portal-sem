# NELZURI Connect — primera entrada: Cumple

**Rama:** `feat/nelzuri-connect-cumple` (desde `feat/escritorio-mentor-prime`)  
**Fecha:** 2026-11-16  
**IdP:** Keycloak sigue siendo el único proveedor de identidad. Connect no abre otro.

## Decisión

El SSO OIDC de Keycloak **no** resuelve la entrada a Cumple con menos complejidad y el mismo nivel de seguridad. El primer flujo real es un código de lanzamiento de un solo uso (Launch/Exchange).

El login productivo es ROPC: `POST /api/identity/auth/keycloak/session` valida correo y contraseña en el servidor y emite la cookie opaca `ah_session`. El navegador no visita Keycloak, así que no queda una sesión de SSO en el dominio del IdP. Redirigir a Cumple por el authorization code volvería a pedir la contraseña.

El cliente OIDC existente (`growth-os-dev` / `growth-os-web`) tiene un solo `redirect_uri`, el callback de Growth OS. No hay cliente ni redirect registrado para el host de Cumple. Inventar ese cliente sería configuración ausente y un cambio en el IdP, fuera de este alcance.

Keycloak tampoco conoce la empresa activa, el plan (`contractedApps`) ni la llave individual (`authorizedApps`). Un code OIDC prueba quién es la persona, no que esa empresa le abrió Cumple. Habría que volver a atar empresa, plan, llave y destino en la aplicación. Eso es el mismo problema, con un salto más al IdP.

Compartir `ah_session` entre `growthos` y `cumple` queda descartado: la cookie es host-only a propósito, y Cumple debe tener su propia sesión.

## Flujo

1. El escritorio, con sesión Keycloak ya abierta, hace `POST /api/connect/launch` con `{ "appId": "cumple" }`.
2. El servidor exige sesión, empresa activa, membresía activa, `contractedApps` que incluya `cumple` y `authorizedApps` que incluya `cumple`. Si el plan o la llave no están guardados, no usa el default del escritorio.
3. El destino sale del origen resuelto del Espacio `cumple` (`cumple.<apex>` o `cumple.localhost`). No se acepta una URL del navegador.
4. El navegador crea una transacción de 32 bytes y envía solo su SHA-256 en `POST /api/connect/launch`. El servidor emite un código de 32 bytes (`base64url`), válido 60 segundos. En `connect_launch_codes` se guarda el hash del código y el hash de la transacción, ligados a usuario, empresa, app, destino y origen del escritorio. La respuesta no devuelve la transacción.
5. El navegador envía código y transacción con `POST` al callback de Cumple (cuerpo del formulario, `Referrer-Policy: no-referrer`). `form-action` de la CSP admite ese origen de Cumple y no un comodín. Un `GET` o un `?code=` no se canjea. El código solo, aunque el `Origin` sea el del escritorio, no alcanza.
6. El callback exige la transacción de esa emisión y que `Origin` sea el origen del escritorio (`APP_URL` / `NEXT_PUBLIC_APP_URL`). El `Origin` no sustituye a la transacción: un cliente puede falsificar el encabezado. Un `Authorization` que traiga el navegador se rechaza: el secreto no viaja en esa petición. Después el servidor canjea con el secreto de su entorno. Sin ese secreto, no hay emisión ni canje. Una transacción distinta no quema el código.
7. `POST /api/connect/exchange` es el canje entre servidores: `Authorization: Bearer`, la transacción, atómico (`findOneAndUpdate` con `usedAt: null`), sin cookie. Acepta el secreto vigente o, durante una rotación, el anterior. El callback de este mismo despliegue llama a la misma función; no pide el secreto al navegador ni crea la sesión a partir del POST sin canjear.
8. Al canjear se releen membresía, plan, llave y la empresa del código. Si el acceso ya no está, o la empresa no es la del código, el código queda quemado y se audita `connect.revoke`.
9. Cumple crea otra fila en `identity_sessions` con `audience: "cumple"` y una cookie `ah_session` sin atributo `Domain`. Esa audiencia no entra a `loadSessionContext`: no abre `/admin`, `/escritorio`, `/platform` ni las APIs que usan la sesión de Growth OS. Una sesión de escritorio (sin audiencia, o `desk`) tampoco se acepta cuando el host es el de Cumple.
10. La única lectura de esa cookie es `GET /api/connect/session`, que responde `{ "ok": true }` y nada más. En cada lectura vuelve a exigir membresía, plan y llave. Si faltan, borra la sesión. Un fallo al resolver el origen no la borra.
11. «Escritorio» en Cumple apunta al origen del escritorio, no a una ruta relativa del host del producto. El botón solo aparece si `/api/connect/session` responde bien.

Growth OS sigue abriendo `/admin` en el mismo origen. Aprende Hoy sigue su URL `https` si existe, sin receptor de Connect. RR.HH. sigue sin entrada.

## Auditoría

`connect.launch`, `connect.exchange`, `connect.reject`, `connect.revoke` en `identity_audit`. El metadata lleva app, empresa y motivo. No lleva código, hash ni secreto.

## Configuración

`CONNECT_EXCHANGE_SECRET` es obligatorio y no se inventa en el código. Tiene que ser la salida de un generador criptográfico de 32 bytes (256 bits), en base64url, por ejemplo:

```bash
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'))"
```

No va en `NEXT_PUBLIC_*`, ni en el bundle del navegador, ni en la respuesta de `/api/connect/launch`. El módulo que lo lee está marcado `server-only`.

Rotación, en los dos hosts y antes de quitar el valor viejo:

1. Generar un secreto nuevo.
2. Ponerlo en `CONNECT_EXCHANGE_SECRET`.
3. Mover el vigente a `CONNECT_EXCHANGE_SECRET_PREVIOUS`.
4. Publicar los dos procesos. El canje acepta ambos; la emisión exige el nuevo.
5. Cuando el despliegue ya no usa el anterior, borrar `CONNECT_EXCHANGE_SECRET_PREVIOUS`.

El código no lleva el secreto dentro, así que no hay que reemitir códigos: duran 60 segundos. El plan y la llave tienen que estar persistidos. El origen del escritorio sale de `APP_URL` o `NEXT_PUBLIC_APP_URL`; si en producción solo aparece el bind `localhost`, se usa el origen canónico de Growth OS, el mismo que ya usa el callback de Keycloak. El destino de Cumple es `cumple.localhost` o `https://cumple.{base}` (`SPACE_BASE_DOMAIN`, o el padre del origen del escritorio). `https://cumple.otro-dominio` no es destino. No hay migración de datos ni publicación de este flujo.

## Deuda: ROPC

El login del escritorio sigue siendo ROPC. Esa deuda y la ruta hacia Authorization Code + PKCE, con Keycloak como IdP, están en [ROPC-AUTH-CODE-PKCE.md](./ROPC-AUTH-CODE-PKCE.md). Sigue siendo una tarea independiente: este cierre no la implementa ni cambia el login. La transacción de Connect no es el PKCE de Keycloak.

## Prueba entre hosts

Hecha el 2026-11-16 contra un Mongo aislado en `127.0.0.1:27018`, base `nelzuri_connect_lab`. No se escribió en el Mongo ni en el Keycloak productivos. El secreto quedó solo en el proceso del laboratorio.

El login ROPC no se ejecutó: eso hablaría con el IdP productivo. La sesión de escritorio fue una fila real de `identity_sessions` en esa base aislada, que es el estado de «ya ingresó». A partir de ahí el recorrido fue el de la aplicación, en Chromium, con dos hosts del mismo proceso: `http://localhost:4017` y `http://cumple.localhost:4017`.

Resultado de ese recorrido:

- Una sola sesión de escritorio. Cumple se abrió desde el dock.
- El callback respondió 303 a `http://cumple.localhost:4017/` y dejó otra cookie `ah_session`, httpOnly, sin atributo `Domain`.
- Las dos cookies son de host distinto y no se aceptan cruzadas: la de Cumple no abre el escritorio; la del escritorio no abre la sesión de Cumple.
- «Escritorio» volvió a `http://localhost:4017/escritorio` con la misma persona.
- Sin sesión, sin transacción, con otra empresa, sin plan, sin llave, con código vencido o reutilizado, o con la llave revocada, no hay sesión de Cumple. Un código con `Origin` correcto pero transacción ajena no se quema y tampoco entra.

Node en este Windows no resuelve `*.localhost`. Las negativas HTTP que no cabían en el clic usaron `Host: cumple.localhost` contra `127.0.0.1:4017`, el mismo servidor. El clic del navegador sí usó el nombre `cumple.localhost`.

## Pruebas

`tests/baseline/connect-launch.test.ts` cubre hash, transacción, configuración ausente, aislamiento de empresa y destino, doble canje, expiración, secreto de servidor, rotación, revocación, cambio de empresa, código en la URL, retorno al escritorio, audiencia de sesión, el origen de Cumple en `form-action` y que Growth OS no cambia de entrada.
