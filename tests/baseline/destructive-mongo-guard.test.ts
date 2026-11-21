/**
 * La barrera solo elimina bases emitidas por la ejecución actual.
 * El catálogo es sintético: estas pruebas no abren un Mongo.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import {
  DestructiveMongoRefusal,
  classifyMongoConnection,
  createDestructiveGuard,
  dropDatabasesByPattern,
  dropDatabasesByPrefix,
  dropDiscoveredDatabases,
  isDestructiveEnvironmentAuthorized,
  isProtectedDatabaseName,
  type OwnedDatabaseHandle,
} from "../../src/lib/mongo/destructive-guard";
import { loadTestProcessEnv } from "./mongo-isolation";

const SECRET = "clave-sintetica-no-real";
const ISOLATED_URI = `mongodb://nelzuri_fixture:${SECRET}@127.0.0.1:27018/nelzuri_fixture?authSource=nelzuri_fixture`;
const PORTAL_URI = `mongodb://app-user:${SECRET}@203.0.113.10:27017/SeminarioIPN?authSource=admin`;

const authorizedEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  MONGODB_DESTRUCTIVE_SCOPE: "isolated-test",
  MONGODB_ISOLATED_PORT: "27018",
};

function refusal(code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof DestructiveMongoRefusal);
    assert.equal(error.code, code);
    assert.equal(error.message.includes("mongodb://"), false);
    assert.equal(error.message.includes(SECRET), false);
    return true;
  };
}

function spyClient() {
  const dropped: string[] = [];
  const collections: string[] = [];
  let listed = false;
  return {
    dropped,
    collections,
    wasListed: () => listed,
    listDatabases() {
      listed = true;
      return Promise.resolve({ databases: [] });
    },
    db(name: string) {
      return {
        dropDatabase() {
          dropped.push(name);
          return Promise.resolve(true);
        },
        dropCollection(collection: string) {
          collections.push(`${name}.${collection}`);
          return Promise.resolve(true);
        },
      };
    },
  };
}

function sourceFiles(root: string): string[] {
  const out: string[] = [];
  const skip = new Set(["node_modules", ".next", "coverage", ".git"]);
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (skip.has(entry)) continue;
      const full = join(dir, entry);
      const info = statSync(full);
      if (info.isDirectory()) {
        walk(full);
        continue;
      }
      if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry)) out.push(full);
    }
  };
  for (const dir of ["src", "tests", "scripts"]) walk(join(root, dir));
  return out;
}

describe("barrera de borrado Mongo", () => {
  it("protege SeminarioIPN, nelzuri_factura, sinca360_prod y cualquier base ajena", async () => {
    const guard = createDestructiveGuard();
    const owned = guard.createOwnedDatabase(authorizedEnv);
    const client = spyClient();
    const foreign = [
      "SeminarioIPN",
      "seminarioipn",
      "nelzuri_core",
      "NELZURI_CORE",
      "portal_sem",
      "nelzuri_factura",
      "NELZURI_FACTURA",
      "sinca360_prod",
      "Sinca360_Prod",
      "cliente_operativa",
      "admin",
      "local",
      "config",
    ];

    for (const name of foreign) {
      const forged: OwnedDatabaseHandle = {
        name,
        executionId: owned.executionId,
        proof: owned.proof,
      };
      const code = isProtectedDatabaseName(name) ? "protected" : "foreign";
      await assert.rejects(
        () => guard.dropOwnedDatabase(client, ISOLATED_URI, forged, authorizedEnv),
        refusal(code)
      );
    }

    assert.deepEqual(client.dropped, []);
    assert.equal(client.wasListed(), false);
    assert.equal(owned.name.startsWith("nelzuri_"), false);
    assert.equal(isProtectedDatabaseName(owned.name), false);
  });

  it("rechaza prefijos, comodines y el descubrimiento de bases sin llamar al cliente", () => {
    const client = spyClient();
    assert.throws(() => dropDatabasesByPrefix("nelzuri_", client), refusal("prefix"));
    assert.throws(() => dropDatabasesByPrefix("Seminario", client), refusal("prefix"));
    assert.throws(() => dropDatabasesByPattern("nelzuri_*", client), refusal("pattern"));
    assert.throws(() => dropDatabasesByPattern("*", client), refusal("pattern"));
    assert.throws(() => dropDatabasesByPattern("sinca360_?", client), refusal("pattern"));
    assert.throws(
      () => dropDiscoveredDatabases(["SeminarioIPN", "nelzuri_factura", "sinca360_prod"], client),
      refusal("discovery")
    );
    assert.deepEqual(client.dropped, []);
    assert.equal(client.wasListed(), false);
  });

  it("elimina solo la base emitida cuando hay prueba de propiedad, id de ejecución y entorno autorizado", async () => {
    const guard = createDestructiveGuard();
    const first = guard.createOwnedDatabase(authorizedEnv);
    const second = guard.createOwnedDatabase(authorizedEnv);
    const client = spyClient();

    assert.equal(first.executionId, second.executionId);
    assert.notEqual(first.name, second.name);
    assert.match(first.name, /^nz[0-9a-f]{28}$/);
    assert.ok(first.proof.length >= 64);
    assert.notEqual(first.proof, first.name);

    await guard.dropOwnedDatabase(client, ISOLATED_URI, first, authorizedEnv);
    assert.deepEqual(client.dropped, [first.name]);
    assert.equal(client.wasListed(), false);

    await assert.rejects(
      () => guard.dropOwnedDatabase(client, ISOLATED_URI, first, authorizedEnv),
      refusal("foreign")
    );
    await assert.rejects(
      () =>
        guard.dropOwnedDatabase(
          client,
          ISOLATED_URI,
          { ...second, proof: "0".repeat(64) },
          authorizedEnv
        ),
      refusal("ownership")
    );
    assert.deepEqual(client.dropped, [first.name]);

    const previous = second;
    const next = guard.beginExecution();
    assert.notEqual(next.id, previous.executionId);
    await assert.rejects(
      () => guard.dropOwnedDatabase(client, ISOLATED_URI, previous, authorizedEnv),
      refusal("execution")
    );
    assert.deepEqual(client.dropped, [first.name]);
  });

  it("rechaza una conexión productiva u operativa aunque la base sea de esta ejecución", async () => {
    const guard = createDestructiveGuard();
    const owned = guard.createOwnedDatabase(authorizedEnv);
    const client = spyClient();
    const blocked = [
      PORTAL_URI,
      `mongodb+srv://app-user:${SECRET}@cluster.example.net/nelzuri_factura`,
      `mongodb://admin:${SECRET}@127.0.0.1:27018/nelzuri_fixture?authSource=admin`,
      `mongodb://root:${SECRET}@127.0.0.1:27018/nelzuri_fixture?authSource=nelzuri_fixture`,
      "mongodb://127.0.0.1:27017/nelzuri_fixture",
      "mongodb://127.0.0.1:27018/nelzuri_factura",
      "mongodb://127.0.0.1:27018/SeminarioIPN",
      "mongodb://127.0.0.1:27018/sinca360_prod",
      "mongodb://127.0.0.1:27019/nelzuri_fixture",
    ];

    for (const uri of blocked) {
      assert.notEqual(classifyMongoConnection(uri, authorizedEnv), "isolated-test");
      await assert.rejects(
        () => guard.dropOwnedDatabase(client, uri, owned, authorizedEnv),
        refusal("connection")
      );
    }
    assert.deepEqual(client.dropped, []);
    assert.equal(client.wasListed(), false);
  });

  it("exige el entorno isolated-test y niega producción", async () => {
    const guard = createDestructiveGuard();
    assert.equal(isDestructiveEnvironmentAuthorized(authorizedEnv), true);
    assert.equal(isDestructiveEnvironmentAuthorized({} as NodeJS.ProcessEnv), false);
    assert.equal(
      isDestructiveEnvironmentAuthorized({ ...authorizedEnv, NODE_ENV: "production" }),
      false
    );
    assert.equal(
      isDestructiveEnvironmentAuthorized({ ...authorizedEnv, MONGODB_DESTRUCTIVE_SCOPE: "production" }),
      false
    );
    assert.equal(
      isDestructiveEnvironmentAuthorized({ ...authorizedEnv, MONGODB_TARGET: "operational" }),
      false
    );
    assert.equal(
      isDestructiveEnvironmentAuthorized({ ...authorizedEnv, MONGODB_ISOLATED_PORT: "27017" }),
      false
    );

    assert.throws(
      () => guard.createOwnedDatabase({ ...authorizedEnv, NODE_ENV: "production" }),
      refusal("environment")
    );

    const owned = guard.createOwnedDatabase(authorizedEnv);
    const client = spyClient();
    await assert.rejects(
      () =>
        guard.dropOwnedDatabase(client, ISOLATED_URI, owned, {
          ...authorizedEnv,
          NODE_ENV: "production",
        }),
      refusal("environment")
    );
    assert.deepEqual(client.dropped, []);
  });

  it("solo elimina una colección emitida dentro de una base propia", async () => {
    const guard = createDestructiveGuard();
    const database = guard.createOwnedDatabase(authorizedEnv);
    const collection = guard.createOwnedCollection(database, authorizedEnv);
    const client = spyClient();

    await assert.rejects(
      () =>
        guard.dropOwnedCollection(
          client,
          ISOLATED_URI,
          { database, collection: "users" },
          authorizedEnv
        ),
      refusal("foreign")
    );
    await assert.rejects(
      () =>
        guard.dropOwnedCollection(
          client,
          PORTAL_URI,
          collection,
          authorizedEnv
        ),
      refusal("connection")
    );
    await guard.dropOwnedCollection(client, ISOLATED_URI, collection, authorizedEnv);

    assert.deepEqual(client.dropped, []);
    assert.deepEqual(client.collections, [`${database.name}.${collection.collection}`]);
    assert.equal(client.wasListed(), false);
  });

  it("el código de producción no ejecuta drop ni listDatabases fuera de la barrera", () => {
    const root = process.cwd();
    const allowed = new Set([
      join("src", "lib", "mongo", "destructive-guard.ts"),
      join("tests", "baseline", "destructive-mongo-guard.test.ts"),
    ]);
    const offenders: string[] = [];
    for (const file of sourceFiles(root)) {
      const rel = relative(root, file);
      if (allowed.has(rel)) continue;
      const text = readFileSync(file, "utf8");
      if (
        text.includes(".dropDatabase(") ||
        text.includes(".dropCollection(") ||
        text.includes("listDatabases") ||
        text.includes('startsWith("nelzuri_")') ||
        text.includes("startsWith('nelzuri_')")
      ) {
        offenders.push(rel);
      }
    }
    assert.deepEqual(offenders, []);
    const guardSource = readFileSync(
      join(root, "src", "lib", "mongo", "destructive-guard.ts"),
      "utf8"
    );
    assert.equal(guardSource.includes("listDatabases"), false);
    assert.equal(guardSource.includes('startsWith("nelzuri_")'), false);
  });

  it("un .env no rellena MONGODB_URI ni MONGODB_DB", () => {
    const dir = mkdtempSync(join(tmpdir(), "mongo-env-"));
    try {
      writeFileSync(
        join(dir, ".env"),
        [
          `MONGODB_URI=${PORTAL_URI}`,
          "MONGODB_DB=SeminarioIPN",
          "MONGODB_TARGET=operational",
          "APP_URL=http://127.0.0.1:3000",
        ].join("\n")
      );
      writeFileSync(join(dir, ".env.local"), `MONGODB_URI=${PORTAL_URI}\n`);
      const env: NodeJS.ProcessEnv = {};
      loadTestProcessEnv(dir, env);
      assert.equal(env.MONGODB_URI, undefined);
      assert.equal(env.MONGODB_DB, undefined);
      assert.equal(env.MONGODB_TARGET, undefined);
      assert.equal(env.APP_URL, "http://127.0.0.1:3000");

      const isolated: NodeJS.ProcessEnv = { MONGODB_URI: ISOLATED_URI };
      loadTestProcessEnv(dir, isolated);
      assert.equal(isolated.MONGODB_URI, ISOLATED_URI);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
