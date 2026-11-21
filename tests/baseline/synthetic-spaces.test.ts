/**
 * Los seis Espacios sintéticos nacen en una base emitida por la barrera.
 * Si no hay Mongo de pruebas, se omite. Una cadena operativa hace fallar la prueba.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MongoClient } from "mongodb";
import { seedSyntheticSpaces } from "../../src/dev/synthetic-spaces";
import {
  createOwnedDatabase,
  dropOwnedDatabase,
} from "../../src/lib/mongo/destructive-guard";
import {
  assertNonProductionClient,
  classifyLocalMongo,
} from "../../src/lib/mongo/local-boundary";

const CODES = [
  "T001",
  "T002",
  "IPN_CHILE",
  "CUMPLE",
  "MENTOR_PRIME_CAPACITACION",
  "FUNDACION_MUEVE",
];

describe("fixtures sintéticos de Espacios", () => {
  it("SEM, ADL y los otros cuatro quedan aislados y sin cuentas", async (t) => {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      t.skip("Mongo aislado no autorizado");
      return;
    }
    assertNonProductionClient(uri, process.env);
    if (classifyLocalMongo(uri, process.env) !== "isolated-test") {
      throw new Error("Las pruebas solo abren el Mongo isolated-test.");
    }

    const owned = createOwnedDatabase(process.env);
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const db = client.db(owned.name);
      const first = await seedSyntheticSpaces(db);
      const second = await seedSyntheticSpaces(db);
      assert.deepEqual(
        first.map((space) => space.code),
        CODES
      );
      assert.deepEqual(
        second.map((space) => space.code),
        CODES
      );
      assert.equal(await db.collection("tenants").countDocuments(), 6);
      assert.equal(await db.collection("identity_users").countDocuments(), 0);
      const manifest = await db.collection("dev_fixture_manifest").findOne({
        _id: "synthetic-spaces-v1",
      });
      assert.equal(manifest?.synthetic, true);
      assert.equal(manifest?.copiedFromOperational, false);
      const personal = await db
        .collection("site_config")
        .find({
          tenantId: {
            $in: ["ipn-chile", "mentor-cumple", "mentor-capacitacion", "fundacion-mueve"],
          },
          $or: [
            { "contact.email": { $nin: ["", null] } },
            { "contact.phone": { $nin: ["", null] } },
            { "contact.whatsapp": { $nin: ["", null] } },
          ],
        })
        .toArray();
      assert.equal(personal.length, 0);
    } finally {
      try {
        await dropOwnedDatabase(client, uri, owned, process.env);
      } finally {
        await client.close();
      }
    }
  });
});
