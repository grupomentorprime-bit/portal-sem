import assert from "node:assert/strict";
import { isMintedDatabaseName } from "../../src/lib/mongo/destructive-guard";
import { isolatedDatabaseName } from "./mongo-isolation";
import { spawn } from "node:child_process";
import { describe, it } from "node:test";
import path from "node:path";
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import {
  RATE_LIMIT_FAILURE_RETRY_SEC,
  consumeSharedRateLimit,
  sharedRateLimitBackend,
} from "../../src/core/security/public-rate-limit";

describe("límite compartido", () => {
  it("producción usa Mongo y un fallo del almacén cierra la ruta", async () => {
    assert.equal(sharedRateLimitBackend({ NODE_ENV: "production" }), "mongo");
    assert.equal(sharedRateLimitBackend({ NODE_ENV: "production", RATE_LIMIT_BACKEND: "memory" }), "mongo");
    assert.equal(sharedRateLimitBackend({ NODE_ENV: "test" }), "memory");
    assert.equal(sharedRateLimitBackend({ NODE_ENV: "development", RATE_LIMIT_BACKEND: "mongo" }), "mongo");
    const source = readFileSync("src/core/security/public-rate-limit.ts", "utf8");
    assert.match(source, /security_rate_limits/);
    assert.match(source, /expireAfterSeconds: 0/);
    const denied = await consumeSharedRateLimit({
      key: "sensible|sintetica",
      limit: 20,
      windowMs: 60_000,
      nowMs: 5_000,
      store: {
        async increment() {
          throw new Error("mongo down");
        },
      },
    });
    assert.equal(denied.ok, false);
    if (denied.ok) return;
    assert.equal(denied.retryAfterSec, RATE_LIMIT_FAILURE_RETRY_SEC);
  });

  it("dos procesos comparten el tope en una base aislada", async (t) => {
    const uri = process.env.MONGODB_URI?.trim() ?? "";
    const dbName = isolatedDatabaseName(import.meta.url) ?? "";
    if (!uri || !dbName) {
      t.skip("sin Mongo aislado autorizado");
      return;
    }
    if (!isMintedDatabaseName(dbName)) {
      throw new Error("La base de la prueba no fue emitida por la barrera.");
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    try {
      await db.collection("security_rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      const key = `busqueda|${process.pid}`;
      const nowMs = 1_700_000_000_000;
      const limit = 20;
      const hits = 15;
      const run = () =>
        new Promise<{ allowed: number; blocked: number }>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [path.join("node_modules", "tsx", "dist", "cli.mjs"), "scripts/rate-limit-burst.ts"],
            {
              env: {
                ...process.env,
                MONGODB_URI: uri,
                MONGODB_DB: dbName,
                RATE_KEY: key,
                RATE_HITS: String(hits),
                RATE_LIMIT: String(limit),
                RATE_NOW_MS: String(nowMs),
              },
            }
          );
          let stdout = "";
          let stderr = "";
          child.stdout.on("data", (chunk) => {
            stdout += String(chunk);
          });
          child.stderr.on("data", (chunk) => {
            stderr += String(chunk);
          });
          child.on("error", reject);
          child.on("exit", (code) => {
            if (code !== 0) {
              reject(new Error(stderr || stdout || `burst ${code}`));
              return;
            }
            const line = stdout.trim().split(/\r?\n/).pop() ?? "";
            resolve(JSON.parse(line) as { allowed: number; blocked: number });
          });
        });
      const [first, second] = await Promise.all([run(), run()]);
      assert.equal(first.allowed + second.allowed, limit);
      assert.equal(first.blocked + second.blocked, hits * 2 - limit);
    } finally {
      await client.close();
    }
  });
});
