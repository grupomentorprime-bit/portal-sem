/**
 * Cada prueba que necesita Mongo recibe un nombre emitido por la barrera.
 * La limpieza solo elimina esos nombres. No recorre el servidor.
 * .env y .env.local no pueden rellenar MONGODB_*: esa era la vía al portal.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { after } from "node:test";
import { MongoClient } from "mongodb";
import {
  DestructiveMongoRefusal,
  createOwnedDatabase,
  dropOwnedDatabase,
  isDestructiveEnvironmentAuthorized,
  type OwnedDatabaseHandle,
} from "../../src/lib/mongo/destructive-guard";
import {
  assertNonProductionClient,
  classifyLocalMongo,
} from "../../src/lib/mongo/local-boundary";

const pending = new Set<OwnedDatabaseHandle>();

export function assignTestFileEnv(key: string, value: string, env: NodeJS.ProcessEnv): void {
  if (key.startsWith("MONGODB_")) return;
  if (!env[key]) env[key] = value;
}

export function loadTestProcessEnv(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env
): void {
  for (const filename of [".env.local", ".env"]) {
    const envPath = resolve(cwd, filename);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      assignTestFileEnv(key, value, env);
    }
  }
}

export function isolatedDatabaseName(callerUrl: string): string | undefined {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) return undefined;
  assertNonProductionClient(uri, process.env);
  if (classifyLocalMongo(uri, process.env) !== "isolated-test") {
    throw new DestructiveMongoRefusal(
      "connection",
      "Las pruebas solo abren el Mongo isolated-test."
    );
  }
  if (!callerUrl.trim() || !isDestructiveEnvironmentAuthorized(process.env)) return undefined;
  const handle = createOwnedDatabase(process.env);
  pending.add(handle);
  return handle.name;
}

after(async () => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || pending.size === 0) return;
  if (
    !isDestructiveEnvironmentAuthorized(process.env) ||
    classifyLocalMongo(uri, process.env) !== "isolated-test"
  ) {
    throw new DestructiveMongoRefusal(
      "connection",
      "Limpieza abortada: la conexión no es un Mongo aislado autorizado."
    );
  }
  const client = new MongoClient(uri);
  await client.connect();
  try {
    for (const handle of [...pending]) {
      await dropOwnedDatabase(client, uri, handle, process.env);
      pending.delete(handle);
    }
  } finally {
    await client.close();
  }
});
