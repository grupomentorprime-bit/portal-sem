/**
 * Desarrollo y pruebas solo abren un Mongo local declarado.
 * Producción (NODE_ENV=production, sin MONGODB_TARGET local) no pasa por aquí:
 * el proceso desplegado sigue usando la variable que ya tiene.
 * Este módulo no abre conexiones ni elimina bases.
 */
import { MongoClient } from "mongodb";
import {
  classifyMongoConnection,
  isDestructiveEnvironmentAuthorized,
} from "./destructive-guard";

export const DEV_DATABASE = "nelzuri_dev";
export const DEV_USER = "nelzuri_dev";
export const DEV_PORT = "27019";
export const TEST_DATABASE = "nelzuri_fixture";
export const TEST_USER = "nelzuri_fixture";

const BLOCKED_DATABASES = new Set([
  "seminarioipn",
  "nelzuri_core",
  "nelzuri_factura",
  "portal_sem",
  "sinca360",
  "sinca360_prod",
  "aprendehoy",
  "aprende_hoy",
  "rrhh",
  "fea",
  "mecanic-app",
  "admin",
  "local",
  "config",
]);

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);
const WRAPPED = Symbol.for("nelzuri.mongoGuard");

export type LocalMongoClass = "isolated-dev" | "isolated-test" | "operational" | "unknown";
export type LocalMongoRefusalCode = "target" | "connection";

type MongoClientLike = {
  s?: { url?: string };
  connect: (...args: unknown[]) => Promise<unknown>;
};

type WrappedConnect = MongoClientLike["connect"] & { [WRAPPED]?: boolean };

export class LocalMongoRefusal extends Error {
  readonly code: LocalMongoRefusalCode;

  constructor(code: LocalMongoRefusalCode, message: string) {
    super(message);
    this.name = "LocalMongoRefusal";
    this.code = code;
  }
}

function refusal(code: LocalMongoRefusalCode, message: string): never {
  throw new LocalMongoRefusal(code, message);
}

export function isBlockedDatabaseName(name: string): boolean {
  return BLOCKED_DATABASES.has(name.trim().toLowerCase());
}

interface ParsedMongoUri {
  scheme: string;
  hostname: string;
  port: string;
  database: string;
  username: string;
  authSource: string;
  replica: boolean;
}

function parseMongoUri(uri: string): ParsedMongoUri | null {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }
  const scheme = parsed.protocol.replace(":", "");
  const authority = uri.slice(scheme.length + 3).split("/")[0] ?? "";
  let username = "";
  try {
    username = decodeURIComponent(parsed.username || "").trim().toLowerCase();
  } catch {
    return null;
  }
  return {
    scheme,
    hostname: parsed.hostname.toLowerCase(),
    port: parsed.port || "27017",
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")).trim(),
    username,
    authSource: (parsed.searchParams.get("authSource") ?? "").trim().toLowerCase(),
    replica: authority.includes(","),
  };
}

function assertNotBlocked(name: string): void {
  if (isBlockedDatabaseName(name)) {
    refusal("connection", "La base no está autorizada fuera de producción.");
  }
}

function isIsolatedDev(uri: string, env: NodeJS.ProcessEnv): boolean {
  if (env.NODE_ENV === "production") return false;
  if ((env.MONGODB_TARGET ?? "").trim() !== "isolated-dev") return false;
  if ((env.MONGODB_DESTRUCTIVE_SCOPE ?? "").trim()) return false;
  if ((env.MONGODB_DB ?? "").trim() !== DEV_DATABASE) return false;
  if ((env.MONGODB_ISOLATED_PORT ?? "").trim() !== DEV_PORT) return false;
  const parsed = parseMongoUri(uri);
  if (!parsed) return false;
  if (parsed.scheme !== "mongodb" || parsed.replica) return false;
  if (!LOOPBACK.has(parsed.hostname)) return false;
  if (parsed.port !== DEV_PORT) return false;
  if (parsed.database !== DEV_DATABASE) return false;
  if (parsed.username !== DEV_USER) return false;
  if (parsed.authSource !== DEV_DATABASE) return false;
  return true;
}

export function classifyLocalMongo(
  uri: string,
  env: NodeJS.ProcessEnv = process.env
): LocalMongoClass {
  if (!uri.trim()) return "unknown";
  if (isIsolatedDev(uri, env)) return "isolated-dev";
  if (
    (env.MONGODB_TARGET ?? "").trim() === "isolated-test" &&
    (env.MONGODB_DB ?? "").trim() === TEST_DATABASE &&
    isDestructiveEnvironmentAuthorized(env) &&
    classifyMongoConnection(uri, env) === "isolated-test"
  ) {
    const parsed = parseMongoUri(uri);
    if (parsed?.username === TEST_USER && parsed.authSource === TEST_DATABASE) {
      return "isolated-test";
    }
  }
  return "operational";
}

function productionPassthrough(env: NodeJS.ProcessEnv): boolean {
  if (env.NODE_ENV !== "production") return false;
  const target = (env.MONGODB_TARGET ?? "").trim();
  return target !== "isolated-dev" && target !== "isolated-test";
}

/**
 * Exige el entorno declarado. En el proceso de producción, sin target local, no interviene.
 */
export function assertNonProductionClient(
  uri: string,
  env: NodeJS.ProcessEnv = process.env
): void {
  if (productionPassthrough(env)) return;
  if (!uri.trim()) {
    refusal("connection", "Falta la cadena de conexión del Mongo local.");
  }
  assertNotBlocked(env.MONGODB_DB ?? "");
  const parsed = parseMongoUri(uri);
  if (parsed) assertNotBlocked(parsed.database);

  const target = (env.MONGODB_TARGET ?? "").trim();
  if (target !== "isolated-dev" && target !== "isolated-test") {
    refusal(
      "target",
      "La operación exige MONGODB_TARGET=isolated-dev o MONGODB_TARGET=isolated-test."
    );
  }
  const actual = classifyLocalMongo(uri, env);
  if (actual !== target) {
    refusal("connection", "La conexión no corresponde al entorno declarado.");
  }
}

/** npm run dev y el proceso de Next en desarrollo. */
export function assertIsolatedDev(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === "production") {
    refusal("target", "El entorno de desarrollo no corre con NODE_ENV=production.");
  }
  const uri = env.MONGODB_URI?.trim() ?? "";
  if (!uri || !(env.MONGODB_DB ?? "").trim()) {
    refusal(
      "target",
      "Falta el Mongo de desarrollo. Copia docs/desarrollo/mongo-dev.example.env a .env.development.local."
    );
  }
  if ((env.MONGODB_DESTRUCTIVE_SCOPE ?? "").trim()) {
    refusal("target", "El Mongo de desarrollo no usa la barrera destructiva de pruebas.");
  }
  if ((env.MONGODB_TARGET ?? "").trim() !== "isolated-dev") {
    refusal("target", "npm run dev exige MONGODB_TARGET=isolated-dev.");
  }
  assertNonProductionClient(uri, env);
}

export function installOperationalMongoGuard(): void {
  const current = MongoClient.prototype.connect as unknown as WrappedConnect;
  if (current[WRAPPED]) return;
  const guarded: WrappedConnect = function guardedConnect(
    this: MongoClientLike,
    ...args: unknown[]
  ) {
    assertNonProductionClient(this?.s?.url ?? "", process.env);
    return current.apply(this, args);
  };
  guarded[WRAPPED] = true;
  MongoClient.prototype.connect = guarded as typeof MongoClient.prototype.connect;
}
