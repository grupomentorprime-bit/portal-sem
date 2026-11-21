/**
 * Única puerta para dropDatabase y dropCollection de pruebas.
 * Solo elimina un nombre emitido y registrado por la ejecución actual,
 * en un Mongo aislado expresamente autorizado. No lista bases.
 */
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

const PROTECTED_DATABASES = [
  "seminarioipn",
  "nelzuri_core",
  "nelzuri_factura",
  "portal_sem",
  "sinca360_prod",
  "admin",
  "local",
  "config",
] as const;

const ADMIN_USERS = new Set(["admin", "root", "portal", "portal-admin"]);
const FIXTURE_DATABASE = "nelzuri_fixture";
const OPERATIONAL_PORT = "27017";
const PREFIX_PATTERN = /^nelzuri_/i;

export type DestructiveRefusalCode =
  | "environment"
  | "connection"
  | "protected"
  | "foreign"
  | "ownership"
  | "execution"
  | "prefix"
  | "pattern"
  | "discovery";

export class DestructiveMongoRefusal extends Error {
  readonly code: DestructiveRefusalCode;

  constructor(code: DestructiveRefusalCode, message: string) {
    super(message);
    this.name = "DestructiveMongoRefusal";
    this.code = code;
  }
}

export interface OwnedDatabaseHandle {
  name: string;
  executionId: string;
  proof: string;
}

export interface OwnedCollectionHandle {
  database: OwnedDatabaseHandle;
  collection: string;
}

export interface DestructiveDatabaseClient {
  db(name: string): {
    dropDatabase(): Promise<unknown>;
  };
}

export interface DestructiveCollectionClient {
  db(name: string): {
    dropCollection(name: string): Promise<unknown>;
  };
}

export type MongoConnectionClass = "isolated-test" | "operational" | "unknown";

type ExecutionState = {
  id: string;
  databases: Map<string, string>;
  collections: Map<string, Set<string>>;
};

function refusal(code: DestructiveRefusalCode, message: string): never {
  throw new DestructiveMongoRefusal(code, message);
}

function freshExecution(): ExecutionState {
  return {
    id: randomUUID(),
    databases: new Map(),
    collections: new Map(),
  };
}

function compactExecutionId(id: string): string {
  return id.replace(/-/g, "").slice(0, 12);
}

function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function operationalTarget(env: NodeJS.ProcessEnv): boolean {
  const target = (env.MONGODB_TARGET ?? "").trim().toLowerCase();
  return target === "production" || target === "operational" || target === "operativa";
}

export function isProtectedDatabaseName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return PROTECTED_DATABASES.some((item) => item === normalized);
}

export function isMintedDatabaseName(name: string): boolean {
  return /^nz[0-9a-f]{28}$/.test(name);
}

export function isDestructiveEnvironmentAuthorized(env: NodeJS.ProcessEnv): boolean {
  if (env.NODE_ENV === "production") return false;
  if (operationalTarget(env)) return false;
  if ((env.MONGODB_DESTRUCTIVE_SCOPE ?? "").trim() !== "isolated-test") return false;
  const port = (env.MONGODB_ISOLATED_PORT ?? "").trim();
  if (!/^\d+$/.test(port) || port === OPERATIONAL_PORT) return false;
  return true;
}

export function classifyMongoConnection(
  uri: string,
  env: NodeJS.ProcessEnv = process.env
): MongoConnectionClass {
  if (env.NODE_ENV === "production" || operationalTarget(env)) return "operational";

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return "unknown";
  }

  const scheme = parsed.protocol.replace(":", "");
  if (scheme === "mongodb+srv") return "operational";
  if (scheme !== "mongodb") return "unknown";

  const authority = uri.slice(scheme.length + 3).split("/")[0] ?? "";
  if (authority.includes(",")) return "operational";

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (database !== FIXTURE_DATABASE) return "operational";

  const authSource = (parsed.searchParams.get("authSource") ?? "").trim().toLowerCase();
  if (authSource && authSource !== FIXTURE_DATABASE) return "operational";

  let username = "";
  try {
    username = decodeURIComponent(parsed.username || "").trim().toLowerCase();
  } catch {
    return "unknown";
  }
  if (username && (ADMIN_USERS.has(username) || username !== FIXTURE_DATABASE)) {
    return "operational";
  }

  const hostname = parsed.hostname.toLowerCase();
  const isolatedHost = (env.MONGODB_ISOLATED_HOST ?? "").trim().toLowerCase();
  const loopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (!loopback && !(isolatedHost && hostname === isolatedHost)) return "operational";

  const port = parsed.port || OPERATIONAL_PORT;
  const expectedPort = (env.MONGODB_ISOLATED_PORT ?? "").trim();
  if (port === OPERATIONAL_PORT || port !== expectedPort) return "operational";

  return "isolated-test";
}

export function dropDatabasesByPrefix(_prefix: string, _client?: unknown): never {
  refusal("prefix", "No se eliminan bases por prefijo.");
}

export function dropDatabasesByPattern(_pattern: string, _client?: unknown): never {
  refusal("pattern", "No se eliminan bases por comodín.");
}

export function dropDiscoveredDatabases(_names?: readonly string[], _client?: unknown): never {
  refusal("discovery", "No se eliminan bases descubiertas en el servidor.");
}

export interface DestructiveGuard {
  beginExecution(): { id: string };
  createOwnedDatabase(env?: NodeJS.ProcessEnv): OwnedDatabaseHandle;
  createOwnedCollection(
    database: OwnedDatabaseHandle,
    env?: NodeJS.ProcessEnv
  ): OwnedCollectionHandle;
  dropOwnedDatabase(
    client: DestructiveDatabaseClient,
    uri: string,
    handle: OwnedDatabaseHandle,
    env?: NodeJS.ProcessEnv
  ): Promise<void>;
  dropOwnedCollection(
    client: DestructiveCollectionClient,
    uri: string,
    handle: OwnedCollectionHandle,
    env?: NodeJS.ProcessEnv
  ): Promise<void>;
}

export function createDestructiveGuard(): DestructiveGuard {
  let state = freshExecution();

  function assertEnvironment(env: NodeJS.ProcessEnv): void {
    if (!isDestructiveEnvironmentAuthorized(env)) {
      refusal("environment", "El entorno no está autorizado para eliminar bases de prueba.");
    }
  }

  function assertOwnedDatabase(handle: OwnedDatabaseHandle, env: NodeJS.ProcessEnv): void {
    if (handle.name.includes("*") || handle.name.includes("?")) {
      refusal("pattern", "No se elimina por comodín.");
    }
    if (isProtectedDatabaseName(handle.name)) {
      refusal("protected", "La base está protegida y no se elimina.");
    }
    if (PREFIX_PATTERN.test(handle.name)) {
      refusal("prefix", "No se elimina una base por el prefijo nelzuri_.");
    }
    assertEnvironment(env);
    if (handle.executionId !== state.id) {
      refusal("execution", "La base pertenece a otra ejecución.");
    }
    const expected = new RegExp(`^nz${compactExecutionId(state.id)}[0-9a-f]{16}$`);
    if (!expected.test(handle.name)) {
      refusal("foreign", "La base no fue emitida por esta ejecución.");
    }
    const proof = state.databases.get(handle.name);
    if (!proof) {
      refusal("foreign", "La base no está registrada en esta ejecución.");
    }
    if (!sameSecret(handle.proof, proof)) {
      refusal("ownership", "La prueba de propiedad no corresponde a esta ejecución.");
    }
  }

  function assertIsolated(uri: string, env: NodeJS.ProcessEnv): void {
    if (classifyMongoConnection(uri, env) !== "isolated-test") {
      refusal("connection", "La conexión no es un Mongo aislado de pruebas.");
    }
  }

  return {
    beginExecution() {
      state = freshExecution();
      return { id: state.id };
    },

    createOwnedDatabase(env: NodeJS.ProcessEnv = process.env) {
      assertEnvironment(env);
      const name = `nz${compactExecutionId(state.id)}${randomBytes(8).toString("hex")}`;
      if (!isMintedDatabaseName(name) || isProtectedDatabaseName(name) || PREFIX_PATTERN.test(name)) {
        refusal("foreign", "No se pudo emitir un nombre propio de esta ejecución.");
      }
      const proof = randomBytes(32).toString("hex");
      state.databases.set(name, proof);
      state.collections.set(name, new Set());
      return { name, executionId: state.id, proof };
    },

    createOwnedCollection(database: OwnedDatabaseHandle, env: NodeJS.ProcessEnv = process.env) {
      assertOwnedDatabase(database, env);
      const collection = `c${randomBytes(8).toString("hex")}`;
      const known = state.collections.get(database.name);
      if (!known) refusal("foreign", "La base no está registrada en esta ejecución.");
      known.add(collection);
      return { database, collection };
    },

    async dropOwnedDatabase(client, uri, handle, env = process.env) {
      assertOwnedDatabase(handle, env);
      assertIsolated(uri, env);
      await client.db(handle.name).dropDatabase();
      state.databases.delete(handle.name);
      state.collections.delete(handle.name);
    },

    async dropOwnedCollection(client, uri, handle, env = process.env) {
      assertOwnedDatabase(handle.database, env);
      const known = state.collections.get(handle.database.name);
      const minted = /^c[0-9a-f]{16}$/.test(handle.collection);
      if (!known || !minted || !known.has(handle.collection)) {
        refusal("foreign", "La colección no fue emitida por esta ejecución.");
      }
      assertIsolated(uri, env);
      await client.db(handle.database.name).dropCollection(handle.collection);
      known.delete(handle.collection);
    },
  };
}

const sharedGuard = createDestructiveGuard();

export function createOwnedDatabase(env?: NodeJS.ProcessEnv): OwnedDatabaseHandle {
  return sharedGuard.createOwnedDatabase(env);
}

export function createOwnedCollection(
  database: OwnedDatabaseHandle,
  env?: NodeJS.ProcessEnv
): OwnedCollectionHandle {
  return sharedGuard.createOwnedCollection(database, env);
}

export function dropOwnedDatabase(
  client: DestructiveDatabaseClient,
  uri: string,
  handle: OwnedDatabaseHandle,
  env?: NodeJS.ProcessEnv
): Promise<void> {
  return sharedGuard.dropOwnedDatabase(client, uri, handle, env);
}

export function dropOwnedCollection(
  client: DestructiveCollectionClient,
  uri: string,
  handle: OwnedCollectionHandle,
  env?: NodeJS.ProcessEnv
): Promise<void> {
  return sharedGuard.dropOwnedCollection(client, uri, handle, env);
}
