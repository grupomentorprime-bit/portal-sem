# Mongo local de desarrollo y de pruebas

`SeminarioIPN` sigue siendo la base operativa. Este corte no la renombra, no la copia y no escribe en `nelzuri_core`.

Hay dos instancias locales. No comparten puerto, usuario ni base.

| Uso | Puerto | Base | Usuario | Variable |
| --- | --- | --- | --- | --- |
| `npm run dev` y `npm run fixtures:dev` | `127.0.0.1:27019` | `nelzuri_dev` | `nelzuri_dev` | `MONGODB_TARGET=isolated-dev` |
| `npm run test:isolated` | `127.0.0.1:27018` | `nelzuri_fixture` y bases `nz…` emitidas | `nelzuri_fixture` | `MONGODB_TARGET=isolated-test` |

El puerto `27017` queda fuera: lo usan el servidor operativo y el Mongo de Factura.

## Instancias

Quedaron dos contenedores, solo en `127.0.0.1`, con volúmenes propios. No usan el volumen de Factura.

| Contenedor | Volumen | Puerto |
| --- | --- | --- |
| `nelzuri-portal-dev` | `nelzuri_portal_dev` | `27019` |
| `nelzuri-portal-test` | `nelzuri_portal_test` | `27018` |

Para volver a levantarlos: `docker start nelzuri-portal-dev nelzuri-portal-test`.

Los scripts de alta están en `docker/mongo-local/`. La clave de cada usuario queda fuera de git: `.env.development.local` para desarrollo y `.env.mongo-aislado` para pruebas.

## Desarrollo

La plantilla está en `docs/desarrollo/mongo-dev.example.env`. El archivo que sí carga Next es `.env.development.local`, y no se versiona.

`npm run dev` revisa el entorno antes de arrancar. Sin `MONGODB_TARGET=isolated-dev`, o con una cadena que no sea `nelzuri_dev` en `127.0.0.1:27019`, el proceso se detiene y no abre conexión. Una variable ya exportada en la shell gana sobre los archivos: si esa variable apunta al servidor operativo, el arranque también se detiene.

Los fixtures salen del código, no de un volcado:

```text
npm run fixtures:dev
```

Quedan seis Espacios: SEM (`T001`), ADL (`T002`), IPN Chile, Mentor Cumple, Mentor Capacitación y Fundación Mueve. No se crean cuentas de persona. Los cuatro Espacios que no son SEM ni ADL no llevan correo ni teléfono. SEM conserva solo la identidad pública que ya está en el código (`sem-site-identity.ts`), no fichas del servidor.

La cuenta `nelzuri_dev` tiene `readWrite` únicamente sobre `nelzuri_dev`.

## Pruebas

La plantilla está en `docs/seguridad/mongo-aislado.example.env`. Las pruebas no leen `.env` ni `.env.local` para claves `MONGODB_`. Hay que pasar el archivo:

```text
npm run test:isolated
```

`npm run test:baseline` y `npm run test:smoke` instalan la misma barrera. Si no hay cadena de conexión, las pruebas que necesitan Mongo se omiten. Si la cadena está y no es `isolated-test`, fallan antes de conectar.

La limpieza sigue en `src/lib/mongo/destructive-guard.ts`: solo elimina un nombre emitido por esa ejecución. `SeminarioIPN`, `nelzuri_core`, `nelzuri_dev` y el resto de bases con prefijo `nelzuri_` no entran.

## Scripts

Cualquier script de `scripts/` que abre Mongo carga `scripts/_mongo-guard.ts`. Fuera de `NODE_ENV=production`, `MongoClient.connect` exige el target declarado. El proceso desplegado no lleva `MONGODB_TARGET` y no cambia de comportamiento.

El traslado futuro de la base operativa está en `docs/operacion/nelzuri-core-traslado.md`. La rotación de credenciales del servidor no forma parte de este corte.
