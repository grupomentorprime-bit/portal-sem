# Incidente 2026-11-20 — borrado de bases `nelzuri_*`

Registro de la investigación de solo lectura del 20 de noviembre de 2026 y de la barrera añadida en `integrate/nelzuri-local`. Esta nota no restaura datos, no cambia credenciales y no se aplicó sobre el Mongo remoto.

## Causa

Un script temporal, `tmp-drop-nelzuri.mjs`, se escribió en el worktree `.worktrees/nelzuri-integracion`, se ejecutó y se borró. Cargó solo `MONGODB_URI` de `portal-sem/.env` y recorrió todas las bases del servidor. Conservaba `SeminarioIPN` y eliminaba el resto con este filtro:

```text
name.startsWith("nelzuri_") && !/seminarioipn/i.test(name)
```

Cada nombre elegido recibía `dropDatabase()`. Ver `SeminarioIPN` no detenía el barrido: lo autorizaba. La cuenta del portal tenía permiso para listar bases y ejecutar `dropDatabase()` fuera de `SeminarioIPN`. `MONGODB_DB` de ese archivo es `SeminarioIPN`; el script lo ignoró.

`tests/baseline/mongo-isolation.ts`, en la versión que corrió el incidente, no fue el comando que borró las bases ajenas. Su `after()` solo eliminaba nombres anotados por ese proceso. El fallo de fondo es el mismo: una limpieza aceptaba el prefijo `nelzuri_` y una cuenta con privilegio de clúster.

## Alcance confirmado

La conexión usada fue la del portal, no la de NELZURI Factura.

| | Portal, la que usó el script | Factura, la de la aplicación |
| --- | --- | --- |
| Origen | `portal-sem/.env` | `portal-facturacion/.env.local` |
| Host | `45.94.58.234` | `127.0.0.1` |
| Puerto | `27017` | `27017` |
| Auth | usuario presente, `authSource=admin` | sin usuario |
| TLS en la URI | no | no |
| Réplica | no | `rs0`, contenedor local |

Confirmado en esa lectura, sin abrir documentos:

- En el remoto no quedó ninguna base `nelzuri_*`. Siguen `SeminarioIPN`, `AprendeHoy`, `aprende_hoy`, `fea`, `Mecanic-App`, `RRHH`, `sinca360` y `sinca360_prod`.
- La base local `nelzuri_factura` sigue en el contenedor de Factura, con unos 2,1 MB y 31 colecciones. Las colecciones DTE estaban vacías.
- El script no pudo haber corrido contra el Mongo local de Factura: abortaba si no veía `SeminarioIPN`, y esa base no está en el contenedor local.
- No hay commit, restauración ni otro `dropDatabase` en esta corrección.

## Incertidumbres

- La salida del script no se guardó. No hay lista literal de nombres borrados ni hora exacta. La sesión que lo ejecutó nombró `nelzuri_factura` como una base que ella no había creado. Cualquier otro `nelzuri_*` que ya estuviera en ese host cayó con el mismo comando.
- No se leyó el contenido de la base remota. No hay evidencia de que fuera la misma información que la base local.
- El remoto no tiene replica set ni oplog. El log en memoria no contenía `dropDatabase`. No se entró por SSH. No se comprobó si el proveedor del VPS tiene un snapshot de disco anterior al barrido.
- El acta del 17 de noviembre describe un dump local de drill que no se conservó. El contenedor `nelzuri-factura-mongo-standalone` estaba detenido; no se arrancó y no es un respaldo del servidor remoto.

No recrear `nelzuri_factura` en el remoto ni copiar la base local encima.

## Medida en este worktree

`src/lib/mongo/destructive-guard.ts` es la única llamada a `dropDatabase` y `dropCollection`.

- Emite un nombre `nz` + id de ejecución + nonce. Lo registra solo en memoria, con una prueba de propiedad que no se deduce del nombre.
- `dropOwnedDatabase` exige esa prueba, el id de la ejecución actual y `MONGODB_DESTRUCTIVE_SCOPE=isolated-test`.
- Rechaza prefijos, comodines y cualquier lista de bases descubiertas. No llama a `listDatabases`.
- Rechaza una conexión productiva u operativa: `mongodb+srv`, host que no sea loopback (salvo `MONGODB_ISOLATED_HOST`), `authSource` distinto de `nelzuri_fixture`, usuario administrador, puerto `27017`, base de la URI distinta de `nelzuri_fixture`, `NODE_ENV=production` o `MONGODB_TARGET` productivo.
- `SeminarioIPN`, `nelzuri_factura`, `sinca360_prod`, `admin`, `local`, `config` y cualquier nombre no emitido por la ejecución quedan fuera. Ver `SeminarioIPN` no autoriza nada.
- La limpieza de `tests/baseline/mongo-isolation.ts` solo entrega a la barrera los nombres que esa ejecución registró. `loadTestProcessEnv` carga `.env` y `.env.local` para el resto de variables y no copia ninguna clave `MONGODB_`. `npm run test:baseline` no pasa `--env-file`. Si `MONGODB_URI` ya viene en el proceso y no es un Mongo aislado, no se emite base y no hay conexión.

La plantilla del Mongo de pruebas está en `docs/seguridad/mongo-aislado.example.env`. No está cargada.

## Otras operaciones revisadas

No son un barrido de bases. No se reescribieron.

| Operación | Dónde | Qué hace | Relación con este incidente |
| --- | --- | --- | --- |
| Borrado de un Espacio | `src/core/tenant/delete-platform-space.ts` | Borra documentos de un tenant confirmado. `seminario-ipn` y `adl` están protegidos. | No ejecuta `dropDatabase`. Sigue dependiendo de la cuenta con la que se conecte. |
| Usuarios | `src/lib/platform/user-maintainer.ts`, `src/lib/identity/sessions.ts` | Borran filas de un `userId` concreto. | Acotado a un id. |
| Migración 023 | `src/core/migrations/023-growth-team-membership-unique.ts` | Borra membresías duplicadas por `_id` antes de un índice único. | No es un drop de base. No debe correr con una cuenta que pueda `dropDatabase`. |
| Scripts de simulación y smoke | `scripts/capture-growth-*.ts`, `scripts/seed-growth-home-sim-004.ts`, `scripts/ot-growth-smoke-cleanup-001.ts`, `scripts/validate-home-saas-multisector.ts`, `scripts/verify-*.ts` | `deleteMany` por etiqueta, tenant o `_id`. Algunos usan un prefijo de `_id` sintético. | No listan bases. Si se lanzan con `portal-sem/.env`, modifican la base operativa. La cuenta del portal todavía puede hacerlo. |
| Almacenamiento | `src/lib/cms/storage-s3.ts` | Borra una clave. La prueba de conexión borra solo `media/.portal-sem-connection-test`. | No vacía el bucket. |
| Archivos | `tests/baseline/security-remediation-ci.test.ts` | `rmSync` de un directorio temporal creado en la misma prueba. | No toca datos de clientes. |
| Fixture de smoke | `scripts/isolated-smoke-fixtures.ts` | Ahora exige Mongo aislado y solo escribe en `nelzuri_fixture`. | Antes rechazaba el nombre `SeminarioIPN` y aceptaba cualquier otra base de la URI configurada. |

No hay `deleteMany({})` en `src`, `tests` ni `scripts`.

## Quién usa la cuenta del portal

Lectura de código y de la forma de la URI, sin volcar usuario ni clave. La cuenta está en `portal-sem/.env`: host `45.94.58.234`, puerto `27017`, `authSource=admin`, sin TLS, sin réplica. La URI no trae base; `MONGODB_DB` es `SeminarioIPN`. No hay `.env.local` ni `.env.production` en ese directorio.

| Consumidor | Cómo la recibe | Qué hace con ella |
| --- | --- | --- |
| Portal Next, desarrollo | `portal-sem/.env`, proceso `next dev` | `getDatabase()` en `src/lib/mongodb.ts` |
| Portal Next, producción | Dokploy inyecta `MONGODB_URI` en el contenedor. Arranque: `node scripts/start-if-released.mjs` | La misma función. El `.dockerignore` excluye `.env` |
| Copia local | `.worktrees/nelzuri-identidad-1a/.env`, misma credencial | No es otro servicio. Si ese worktree arranca, entra con la misma cuenta. No se modificó |
| Scripts de operación | Solo si el operador pasa `--env-file=.env` o exporta la URI. `npm run backfill:growth` sí declara ese archivo | Migraciones, índices, semillas, capturas y correcciones de nómina. Escriben `SeminarioIPN` |

Factura no usa esta cuenta: su Mongo es local y la credencial es otra. `portal-semibold`, el respaldo de atención y `portal-sem-seg-1-4` no tienen esta URI. En `src` no hay `listDatabases`, `dropDatabase` ni `dropCollection` fuera de la barrera.

## Permisos mínimos de la cuenta del portal

Operaciones reales de `src`, sin contar la barrera: `find` / `findOne`, `countDocuments`, `distinct`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `replaceOne`, `deleteOne`, `deleteMany`, `findOneAndUpdate`, `createIndex`. No hay `aggregate`, `dropIndex`, `renameCollection`, `bulkWrite`, `watch` ni `db.command`. El borrado de un Espacio y la migración 023 borran documentos, no bases.

Rol nuevo `portalApp`, recurso `{ db: "SeminarioIPN", collection: "" }`, acciones: `find`, `insert`, `update`, `remove`, `createIndex`, `listIndexes`, `createCollection`, `listCollections`, `killCursors`. Sin `dropDatabase`, `dropCollection`, `dropIndex`, `listDatabases` ni roles `AnyDatabase`, `userAdmin`, `clusterAdmin`, `backup`, `restore`. `readWrite` serviría para los datos y además permitiría `dropCollection`; no usarlo. `authSource` pasa a ser `SeminarioIPN`, no `admin`.

## Rotación sin cortar Mongo

No ejecutada. La clave actual deja de servir en el momento en que se cambia, así que no se cambia la clave del usuario viejo: se crea otro usuario y se solapan.

1. Con la cuenta que hoy está en `portal-sem/.env`, crear el rol `portalApp` y el usuario `portal_app`. No cambiar la clave de la cuenta actual: sigue siendo el camino de vuelta.
2. Guardar la URI nueva solo en Dokploy y en el `.env` local que vaya a usarse. No commitearla. Forma: `mongodb://portal_app:<clave>@<host>:27017/SeminarioIPN?authSource=SeminarioIPN`. Hasta que exista TLS, no añadir `tls`.
3. Reiniciar solo el contenedor del portal para que lea la URI nueva. Mongo no se reinicia. Comprobar una lectura de `SeminarioIPN` con el proceso nuevo.
4. Si esa lectura falla, volver en Dokploy a la URI anterior y reiniciar el contenedor. El usuario viejo sigue pudiendo entrar. No borrar usuarios en este paso.
5. Si la lectura funciona, quitar los roles del usuario viejo. No borrar el usuario todavía. La copia de `.worktrees/nelzuri-identidad-1a/.env` y cualquier historial de shell que tenga la URI salen de circulación en esta misma ventana: si no, la clave vieja sigue viva.
6. Rollback después de quitar roles: volver a otorgar `portalApp` al usuario viejo, cuya clave no cambió, restaurar su URI y reiniciar el contenedor. Luego se revisa por qué falló `portal_app`.

## Red y TLS

No ejecutados. Hoy `45.94.58.234:27017` acepta la URI sin TLS.

1. No pasar la URI del portal a `127.0.0.1`. El Dockerfile no usa la red del host. La etapa final deja `NODE_ENV=production`, escucha en `0.0.0.0:3000` y arranca con `node scripts/start-if-released.mjs`. Ese script hereda `process.env` y no lee ni reescribe la URI. `.dockerignore` excluye `.env`. Dokploy inyecta `MONGODB_URI` dentro del contenedor. Desde ahí, `127.0.0.1` es el contenedor, no el `mongod` del VPS. El repositorio no declara `network_mode: host`.

   Antes de cerrar el puerto, y sin aplicarlo ahora, confirmar en el panel cuál de estos caminos ve el contenedor:
   - Mongo sigue en el host: la URI usa una dirección que la red bridge enruta (la IP del VPS que el portal ya usa, o la puerta de enlace de Docker). `bindIp: 127.0.0.1` en el host dejaría al contenedor sin base.
   - Mongo pasa a otro contenedor de la misma red Docker que la aplicación: la URI usa el nombre de ese servicio, no `127.0.0.1`.

   El desarrollo no usa el loopback del contenedor. Entra por túnel SSH o por la IP de origen que el firewall vaya a permitir.
2. En el firewall, permitir `27017` solo desde el origen ya comprobado y cerrar el resto. Hacerlo cuando el portal ya conecta por ese camino. Rollback: reponer la regla anterior si el portal pierde la base. No dejar `0.0.0.0` como estado final.
3. Certificado de servidor cuyo nombre coincida con el host de la URI. Primero `net.tls.mode: allowTLS`. Reiniciar Mongo: las URI sin TLS siguen entrando.
4. Añadir `tls=true` a la URI del portal, reiniciar el contenedor y comprobar la lectura.
5. Pasar a `requireTLS` y reiniciar Mongo. No usar `tlsAllowInvalidCertificates`.
6. Rollback de `requireTLS`: volver a `allowTLS` si el contenedor ya usa `tls=true`, o desactivar TLS si todavía no lo usa. No asignar `MONGODB_ISOLATED_HOST` a `45.94.58.234`.

## Mongo local de pruebas

Levantado el 20 de noviembre de 2026, usado solo para las pruebas de abajo y destruido al terminar. No queda contenedor, volumen ni directorio.

Alcance comprobado antes de crear el usuario y otra vez después de `--auth`:

- Contenedor `nelzuri-fixture-mongo`, imagen `mongo:7`, sin réplica (`hello.setName` nulo).
- Publicación `127.0.0.1:27018` hacia el `27017` del contenedor. No quedó en `0.0.0.0`.
- Datos en `C:\mongo-nelzuri-fixture`. No es el volumen de `nelzuri-factura-mongo` ni el de `nelzuri-dte-stage3-rs`.
- Usuario `nelzuri_fixture`, base y `authSource` `nelzuri_fixture`. La URI no contiene `45.94.58.234` ni el puerto `27017`.
- Una escritura sin usuario fue rechazada con código 13. Con la cuenta sintética se escribió y se borró un documento `_id: sintetico` en `nelzuri_fixture.scope_probe`.
- No se llamó a `listDatabases`. No se abrió Factura (`nelzuri-factura-mongo` en `0.0.0.0:27017`) ni el remoto.

En ese `mongod` desechable, y solo ahí, la cuenta recibió `dropDatabase` sobre `{ db: "", collection: "" }`. Las pruebas emiten bases `nz…` que aún no existen y Mongo no puede limitar ese permiso a un prefijo. Esa concesión no se creó en el VPS. Al terminar se hizo `docker rm -f -v nelzuri-fixture-mongo`, se borró `C:\mongo-nelzuri-fixture` y se borró `.env.mongo-aislado`.

Para repetirlo: puerto `27018` en `127.0.0.1`. El `27017` queda para el remoto y para el contenedor de Factura. Directorio de datos nuevo. Sin miembro de réplica, sin el volumen de Factura y sin la URI del portal.

Primero sin autenticación, publicado solo en loopback:

```text
docker run --name nelzuri-fixture-mongo -d -p 127.0.0.1:27018:27017 -v C:\mongo-nelzuri-fixture:/data/db mongo:7
```

Crear ahí el usuario `nelzuri_fixture` sobre la base `nelzuri_fixture`, con `authSource` `nelzuri_fixture`. Si el contenedor se borra al terminar, ese usuario puede tener `dropDatabase` sobre `{ db: "", collection: "" }` para limpiar las bases `nz…` de las pruebas. Si se va a conservar, no se le da `dropDatabase`. Parar el contenedor y volverlo a crear con el mismo volumen y `--auth`. Comprobar que el puerto publicado es `127.0.0.1:27018` y que la URI no contiene `45.94.58.234`.

La clave va en un archivo ignorado por git, `.env.mongo-aislado`, copiado de `docs/seguridad/mongo-aislado.example.env`. Se entrega con `--env-file`. No guardarla en `portal-sem/.env`.

Al terminar: `docker rm -f -v nelzuri-fixture-mongo` y borrar `C:\mongo-nelzuri-fixture`.

## Dos permisos distintos

La barrera solo acepta el usuario `nelzuri_fixture`, o una URI sin usuario, en `127.0.0.1` y en el puerto aislado. Por eso el usuario de limpieza no puede llamarse de otra forma sin cambiar la barrera ya aprobada. La separación es de cuenta y de servidor:

| Cuenta | Dónde existe | Qué puede |
| --- | --- | --- |
| `portal_app` | Solo el Mongo del VPS | Rol `portalApp` sobre `SeminarioIPN`. Sin `dropDatabase` |
| `nelzuri_fixture` | Solo `127.0.0.1:27018` | Leer y escribir `nelzuri_fixture` |

`dropDatabase` no cabe en `portal_app`. Mongo no puede limitarlo a un prefijo ni a bases que todavía no existen. En el `mongod` desechable, y solo ahí, `nelzuri_fixture` puede recibir `dropDatabase` sobre `{ db: "", collection: "" }` porque al terminar se borra el directorio. Esa concesión no se crea en el VPS. Si el local se va a conservar, no se le da `dropDatabase`: la limpieza es borrar el directorio, no un rol de producción.

## Pruebas y la URI del portal

`tests/baseline` y `tests/baseline/mongo-isolation.ts` ya no copian `MONGODB_*` desde `.env` ni `.env.local`. Una URI del portal puesta en esos archivos no llega al proceso. `isolatedDatabaseName`, el smoke aislado y `scripts/rate-limit-burst.ts` siguen rechazando una conexión que no clasifica como `isolated-test`. Las siete pruebas negativas de bases ajenas, prefijos, comodines y descubrimiento siguen en `tests/baseline/destructive-mongo-guard.test.ts`. Se añadió una que escribe un `.env` sintético con forma de URI del portal y comprueba que no se adopta.

Los scripts de operación no se convirtieron en pruebas. Siguen usando la URI del proceso cuando alguien los lanza con `--env-file=.env`. No son el fallback automático. No se ejecutan contra producción desde aquí.

Primera pasada, sin Mongo real: la barrera y las pruebas de fundación, borrado de Espacio, dominio y mensajería. 33 pasaron y 2 se omitieron porque no había Mongo aislado. Ninguna abrió el portal.

Segunda pasada, el 20 de noviembre de 2026, con la URI sintética entregada solo por `--env-file=.env.mongo-aislado`:

| Control | Resultado |
| --- | --- |
| `tests/baseline/destructive-mongo-guard.test.ts` | 8 pasaron |
| Barrera contra el `mongod` aislado: 8 nombres ajenos, 11 URI operativas, prefijo, comodín y descubrimiento | Rechazados. El cliente no ejecutó ningún drop en esos casos. El único drop real fue la base emitida por esa ejecución |
| Fundación universal y migración SEM, que eran las dos omitidas, más borrado de Espacio, dominio y mensajería | 27 pasaron, 0 omitidas |
| Equipo, resolución de host, aislamiento de host y límite compartido | 34 pasaron, 0 omitidas |
| `dev`, `test:baseline` y `test:smoke` | No pasan `--env-file`. Un proceso de prueba sin ese archivo no tiene `MONGODB_URI`. Next, en este worktree, no cargó ningún env y no vio la URI del portal |

`backfill:growth` sigue declarando `--env-file=.env`. No se ejecutó. Los demás scripts de operación tampoco.

## Snapshots del VPS

No hay réplica ni oplog, y no se entró por SSH. Desde el panel con el que ya se administra `45.94.58.234`, preguntar al proveedor de ese VPS:

- Si existe un snapshot o respaldo de disco anterior al 20 de noviembre de 2026.
- La hora del snapshot y hasta cuándo lo conservan.

No pedir que lo restauren. Restaurar el disco reemplazaría `SeminarioIPN` y las otras bases que siguen en el servidor. No recrear `nelzuri_factura` en el remoto ni copiar encima la base local de Factura.

## Qué no se ejecutó

No se rotaron claves del portal, no se creó `portal_app`, no se cambiaron roles, firewall ni TLS del VPS, no se restauró nada y no hubo push, merge ni deploy. El Mongo remoto no se tocó. Factura no se usó. Los otros worktrees no se modificaron.

El único usuario nuevo fue `nelzuri_fixture`, en el contenedor desechable de `127.0.0.1:27018`, y se destruyó con ese contenedor. Los `dropDatabase` de las pruebas cayeron solo sobre bases `nz…` emitidas por cada ejecución.
