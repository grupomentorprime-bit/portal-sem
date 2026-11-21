/**
 * Falla antes de `next dev` si el entorno no es el Mongo local de desarrollo.
 * No abre una conexión.
 */
import { applyNextDevEnv } from "../src/lib/mongo/dev-env-files";
import { assertIsolatedDev } from "../src/lib/mongo/local-boundary";

const merged = applyNextDevEnv();
assertIsolatedDev(merged);

const uri = merged.MONGODB_URI ?? "";
const parsed = new URL(uri);
console.log(
  JSON.stringify({
    target: merged.MONGODB_TARGET,
    db: merged.MONGODB_DB,
    host: parsed.hostname,
    port: parsed.port || "27017",
    user: decodeURIComponent(parsed.username),
  })
);
