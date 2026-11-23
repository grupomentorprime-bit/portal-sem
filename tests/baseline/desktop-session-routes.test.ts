/**
 * Presencia y Atención contra el Mongo de pruebas.
 * Sin cookie: 401. Sesión sin Espacio ni capacidad: 403. Operador: 200.
 * No abre el Mongo de desarrollo.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, describe, it } from "node:test";
import { MongoClient } from "mongodb";
import { classifyLocalMongo } from "../../src/lib/mongo/local-boundary";

createRequire(import.meta.url)("./desktop-session-stub.cjs");

const OPERATOR = "nzsess-operator";
const STRANGER = "nzsess-stranger";
const OPERATOR_SESSION = "nzsess-operator-session";
const STRANGER_SESSION = "nzsess-stranger-session";
const IDS = [OPERATOR, STRANGER];
const SESSION_IDS = [OPERATOR_SESSION, STRANGER_SESSION];

declare global {
  var __nelzuriTestSession: string | undefined;
}

function declaredEndpoint(): { uri: string; port: string; db: string; target: string } {
  const uri = process.env.MONGODB_URI?.trim() ?? "";
  const port = uri ? new URL(uri).port : "";
  return {
    uri,
    port,
    db: (process.env.MONGODB_DB ?? "").trim(),
    target: (process.env.MONGODB_TARGET ?? "").trim(),
  };
}

function user(id: string, roles: string[]) {
  const now = new Date().toISOString();
  return {
    _id: id,
    email: `${id}@example.test`,
    emailVerified: true,
    displayName: id,
    status: "active",
    platformRoles: roles,
    createdAt: now,
    updatedAt: now,
  };
}

function session(id: string, userId: string) {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return {
    _id: id,
    userId,
    tenantId: "",
    createdAt: now,
    expiresAt: expires,
    lastActivity: now,
  };
}

describe("presencia y atención con sesión de pruebas", () => {
  const endpoint = declaredEndpoint();
  let client: MongoClient | null = null;

  after(async () => {
    globalThis.__nelzuriTestSession = "";
    if (!client) return;
    const db = client.db(endpoint.db);
    await db.collection<{ _id: string }>("identity_users").deleteMany({ _id: { $in: IDS } });
    await db.collection<{ _id: string }>("identity_sessions").deleteMany({ _id: { $in: SESSION_IDS } });
    await db.collection<{ _id: string }>("attention_presence").deleteMany({ _id: { $in: IDS } });
    await client.close();
    const shared = await import("../../src/lib/mongodb")
      .then((mod) => mod.getMongoClient())
      .catch(() => null);
    await shared?.close();
  });

  it("rechaza sin sesión y responde con una sesión válida en el puerto 27018", async (t) => {
    if (!endpoint.uri) {
      t.skip("Mongo de pruebas no configurado");
      return;
    }
    assert.equal(endpoint.target, "isolated-test");
    assert.equal(endpoint.db, "nelzuri_fixture");
    assert.equal(endpoint.port, "27018");
    assert.equal(classifyLocalMongo(endpoint.uri, process.env), "isolated-test");
    assert.equal(endpoint.uri.includes("27019"), false);
    assert.equal(endpoint.uri.includes("nelzuri_dev"), false);

    client = new MongoClient(endpoint.uri);
    await client.connect();
    const db = client.db(endpoint.db);
    await db.collection<{ _id: string }>("identity_users").deleteMany({ _id: { $in: IDS } });
    await db.collection<{ _id: string }>("identity_sessions").deleteMany({ _id: { $in: SESSION_IDS } });
    await db.collection<{ _id: string }>("attention_presence").deleteMany({ _id: { $in: IDS } });
    await db.collection<ReturnType<typeof user>>("identity_users").insertMany([
      user(OPERATOR, ["platform_operator"]),
      user(STRANGER, []),
    ]);
    await db.collection<ReturnType<typeof session>>("identity_sessions").insertMany([
      session(OPERATOR_SESSION, OPERATOR),
      session(STRANGER_SESSION, STRANGER),
    ]);

    const presence = await import("../../src/app/api/desktop/presence/route");
    const attention = await import("../../src/app/api/desktop/attention/route");

    globalThis.__nelzuriTestSession = "";
    const absentPresence = await presence.GET();
    const absentAttention = await attention.GET();
    assert.equal(absentPresence.status, 401);
    assert.equal(absentAttention.status, 401);

    globalThis.__nelzuriTestSession = STRANGER_SESSION;
    const deniedPresence = await presence.GET();
    const deniedAttention = await attention.GET();
    assert.equal(deniedPresence.status, 403);
    assert.equal(deniedAttention.status, 403);

    globalThis.__nelzuriTestSession = OPERATOR_SESSION;
    const beat = await presence.POST();
    const seen = await presence.GET();
    const desk = await attention.GET();
    assert.equal(beat.status, 200);
    assert.equal(seen.status, 200);
    assert.equal(desk.status, 200);
    const beatBody = (await beat.json()) as { ok?: boolean; staffOnline?: boolean };
    const seenBody = (await seen.json()) as { ok?: boolean; staffOnline?: boolean };
    const deskBody = (await desk.json()) as { ok?: boolean; mode?: string };
    assert.equal(beatBody.ok, true);
    assert.equal(beatBody.staffOnline, true);
    assert.equal(seenBody.ok, true);
    assert.equal(seenBody.staffOnline, true);
    assert.equal(deskBody.ok, true);
    assert.equal(deskBody.mode, "panel");

    const stored = await db.collection<{ _id: string; kind?: string }>("attention_presence").findOne({
      _id: OPERATOR,
    });
    assert.equal(stored?.kind, "staff");
  });
});
