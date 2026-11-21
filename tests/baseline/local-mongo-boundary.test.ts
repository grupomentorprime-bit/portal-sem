/**
 * Desarrollo y pruebas rechazan el Mongo operativo antes de conectar.
 * Las cadenas de este archivo son sintéticas.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { MongoClient } from "mongodb";
import { mergeNextDevEnv } from "../../src/lib/mongo/dev-env-files";
import {
  LocalMongoRefusal,
  assertIsolatedDev,
  assertNonProductionClient,
  classifyLocalMongo,
  installOperationalMongoGuard,
} from "../../src/lib/mongo/local-boundary";

const SECRET = "clave-sintetica-no-real";
const DEV_URI = `mongodb://nelzuri_dev:${SECRET}@127.0.0.1:27019/nelzuri_dev?authSource=nelzuri_dev`;
const TEST_URI = `mongodb://nelzuri_fixture:${SECRET}@127.0.0.1:27018/nelzuri_fixture?authSource=nelzuri_fixture`;
const PORTAL_URI = `mongodb://app-user:${SECRET}@203.0.113.10:27017/SeminarioIPN?authSource=admin`;

const devEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "development",
  MONGODB_TARGET: "isolated-dev",
  MONGODB_ISOLATED_HOST: "127.0.0.1",
  MONGODB_ISOLATED_PORT: "27019",
  MONGODB_DB: "nelzuri_dev",
  MONGODB_URI: DEV_URI,
};

const testEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  MONGODB_TARGET: "isolated-test",
  MONGODB_DESTRUCTIVE_SCOPE: "isolated-test",
  MONGODB_ISOLATED_HOST: "127.0.0.1",
  MONGODB_ISOLATED_PORT: "27018",
  MONGODB_DB: "nelzuri_fixture",
  MONGODB_URI: TEST_URI,
};

function refusal(code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof LocalMongoRefusal);
    assert.equal(error.code, code);
    assert.equal(error.message.includes("mongodb://"), false);
    assert.equal(error.message.includes(SECRET), false);
    assert.equal(error.message.includes("203.0.113.10"), false);
    return true;
  };
}

describe("frontera del Mongo local", () => {
  it("acepta el desarrollo en 27019 y las pruebas en 27018", () => {
    assert.equal(classifyLocalMongo(DEV_URI, devEnv), "isolated-dev");
    assert.doesNotThrow(() => assertIsolatedDev(devEnv));
    assert.equal(classifyLocalMongo(TEST_URI, testEnv), "isolated-test");
    assert.doesNotThrow(() => assertNonProductionClient(TEST_URI, testEnv));
  });

  it("rechaza SeminarioIPN, nelzuri_core, el puerto 27017 y un target cruzado", () => {
    const blocked = [
      PORTAL_URI,
      `mongodb://nelzuri_dev:${SECRET}@127.0.0.1:27019/SeminarioIPN?authSource=nelzuri_dev`,
      `mongodb://nelzuri_dev:${SECRET}@127.0.0.1:27019/nelzuri_core?authSource=nelzuri_dev`,
      `mongodb://nelzuri_dev:${SECRET}@127.0.0.1:27017/nelzuri_dev?authSource=nelzuri_dev`,
      `mongodb://nelzuri_dev:${SECRET}@127.0.0.1:27018/nelzuri_dev?authSource=nelzuri_dev`,
      `mongodb://root:${SECRET}@127.0.0.1:27019/nelzuri_dev?authSource=admin`,
      TEST_URI,
    ];
    for (const uri of blocked) {
      assert.notEqual(classifyLocalMongo(uri, devEnv), "isolated-dev");
      assert.throws(() => assertNonProductionClient(uri, { ...devEnv, MONGODB_URI: uri }), refusal("connection"));
    }
    assert.throws(
      () => assertNonProductionClient(DEV_URI, { ...devEnv, MONGODB_DB: "SeminarioIPN" }),
      refusal("connection")
    );
    assert.throws(
      () => assertNonProductionClient(DEV_URI, { ...devEnv, MONGODB_DB: "nelzuri_core" }),
      refusal("connection")
    );
    assert.throws(
      () => assertIsolatedDev({ ...devEnv, MONGODB_DESTRUCTIVE_SCOPE: "isolated-test" }),
      refusal("target")
    );
    assert.throws(
      () => assertNonProductionClient(PORTAL_URI, { NODE_ENV: "development" }),
      refusal("connection")
    );
    assert.throws(
      () =>
        assertNonProductionClient(
          `mongodb://nelzuri_dev:${SECRET}@203.0.113.10:27019/nelzuri_dev?authSource=nelzuri_dev`,
          { NODE_ENV: "development" }
        ),
      refusal("target")
    );
  });

  it("el proceso de producción sin target local no exige la frontera", () => {
    assert.doesNotThrow(() =>
      assertNonProductionClient(PORTAL_URI, {
        NODE_ENV: "production",
        MONGODB_DB: "SeminarioIPN",
      })
    );
    assert.throws(
      () => assertNonProductionClient(DEV_URI, { ...devEnv, NODE_ENV: "production" }),
      refusal("connection")
    );
  });

  it("un .env operativo no arranca el desarrollo, y el archivo local sí", () => {
    const dir = mkdtempSync(join(tmpdir(), "mongo-dev-"));
    try {
      writeFileSync(
        join(dir, ".env"),
        [`MONGODB_URI=${PORTAL_URI}`, "MONGODB_DB=SeminarioIPN", "MONGODB_TARGET=operational"].join("\n")
      );
      assert.throws(() => assertIsolatedDev(mergeNextDevEnv(dir, {})), refusal("target"));

      writeFileSync(
        join(dir, ".env"),
        [
          `MONGODB_URI=${PORTAL_URI}`,
          "MONGODB_DB=SeminarioIPN",
          "MONGODB_TARGET=isolated-dev",
          "MONGODB_ISOLATED_PORT=27019",
          "NODE_ENV=development",
        ].join("\n")
      );
      assert.throws(() => assertIsolatedDev(mergeNextDevEnv(dir, {})), refusal("connection"));

      const locked = mergeNextDevEnv(dir, {
        MONGODB_URI: PORTAL_URI,
        MONGODB_DB: "SeminarioIPN",
        MONGODB_TARGET: "operational",
        NODE_ENV: "development",
      });
      assert.throws(() => assertIsolatedDev(locked), refusal("target"));

      writeFileSync(
        join(dir, ".env.development.local"),
        [
          `MONGODB_URI=${DEV_URI}`,
          "MONGODB_DB=nelzuri_dev",
          "MONGODB_TARGET=isolated-dev",
          "MONGODB_ISOLATED_HOST=127.0.0.1",
          "MONGODB_ISOLATED_PORT=27019",
          "NODE_ENV=development",
        ].join("\n")
      );
      assert.doesNotThrow(() => assertIsolatedDev(mergeNextDevEnv(dir, { NODE_ENV: "development" })));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("la plantilla versionada no apunta al puerto operativo", () => {
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    assert.equal(example.includes("27017"), false);
    assert.equal(example.includes("SeminarioIPN"), false);
    assert.equal(example.includes("portal_sem"), false);
    assert.match(example, /nelzuri_dev/);
    assert.match(example, /isolated-dev/);
  });

  it("connect rechaza una cadena operativa sin abrirla", async () => {
    installOperationalMongoGuard();
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_TARGET: process.env.MONGODB_TARGET,
      MONGODB_DB: process.env.MONGODB_DB,
      MONGODB_ISOLATED_PORT: process.env.MONGODB_ISOLATED_PORT,
      MONGODB_DESTRUCTIVE_SCOPE: process.env.MONGODB_DESTRUCTIVE_SCOPE,
    };
    process.env.NODE_ENV = "development";
    process.env.MONGODB_TARGET = "isolated-dev";
    process.env.MONGODB_DB = "nelzuri_dev";
    process.env.MONGODB_ISOLATED_PORT = "27019";
    delete process.env.MONGODB_DESTRUCTIVE_SCOPE;
    const client = new MongoClient(PORTAL_URI, { serverSelectionTimeoutMS: 200 });
    let refused = false;
    try {
      await client.connect();
    } catch (error) {
      refused = true;
      assert.equal((error as { name?: string }).name, "LocalMongoRefusal");
      assert.equal((error as { code?: string }).code, "connection");
      assert.equal(String((error as Error).message).includes(SECRET), false);
      assert.equal(String((error as Error).message).includes("mongodb://"), false);
    } finally {
      assert.equal(refused, true);
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
