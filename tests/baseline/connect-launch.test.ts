import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildContentSecurityPolicy } from "../../src/core/security/http-headers";
import { allowedCumpleBase, deskOriginFromEnv } from "../../src/lib/connect/desk";
import { desktopClick } from "../../src/lib/desktop/contract";
import {
  CONNECT_CALLBACK_PATH,
  CONNECT_CODE_TTL_MS,
  auditCarriesSecret,
  connectLaunchForm,
  createTransactionVerifier,
  escritorioReturnHref,
  hashTransactionVerifier,
  evaluateConnectAccess,
  growthSessionAllowed,
  isLaunchCode,
  isSafeEscritorioHref,
  productLandingUrl,
  productSessionCookieOptions,
  productSessionVerdict,
  readCallbackSubmission,
} from "../../src/lib/connect/policy";
import {
  connectSecretHasEntropy,
  generateConnectExchangeSecret,
} from "../../src/lib/connect/secret-policy";
import {
  createLaunchCode,
  createMemoryLaunchCodeStore,
  hashLaunchCode,
  hashTransaction,
  issueLaunchCode,
  redeemLaunchCode,
} from "../../src/lib/connect/protocol";

const SECRET = "test-exchange-secret";
const PREVIOUS = "previous-exchange-secret";
const DEST = "https://cumple.mentorprime.cl";
const ISSUER = "https://growthos.mentorprime.cl";
const CODE = "a".repeat(43);
const TX = "b".repeat(43);
const TX_HASH = createHash("sha256").update(TX).digest("hex");
const STOLEN = "c".repeat(43);

function access(overrides: Record<string, unknown> = {}) {
  return {
    appId: "cumple",
    tenantId: "cumple",
    membershipActive: true,
    contractedApps: ["growth-os", "cumple"],
    authorizedApps: ["cumple"],
    resolvedOrigin: DEST,
    spaceBaseDomain: "mentorprime.cl",
    ...overrides,
  };
}

describe("NELZURI Connect — entrada a Cumple", () => {
  it("emite un código aleatorio de un solo uso y guarda solo el hash", async () => {
    const store = createMemoryLaunchCodeStore();
    const events: Array<{ action: string; metadata: Record<string, string> }> = [];
    const now = new Date("2026-11-16T12:00:00.000Z");
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store,
      audit: (event) => events.push(event),
    });

    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    assert.notEqual(createLaunchCode(), issued.code);
    assert.equal(issued.code.length >= 43, true);
    assert.equal(isLaunchCode(issued.code), true);
    assert.equal(hashLaunchCode(issued.code).length, 64);
    assert.equal(issued.callback, `${DEST}${CONNECT_CALLBACK_PATH}`);
    assert.equal(Date.parse(issued.expiresAt) - now.getTime(), CONNECT_CODE_TTL_MS);

    const stored = await store.find(hashLaunchCode(issued.code));
    assert.ok(stored);
    assert.equal(stored?.usedAt, null);
    assert.equal(JSON.stringify(stored).includes(issued.code), false);
    assert.equal(stored?.transactionHash, TX_HASH);
    assert.equal(JSON.stringify(stored).includes(TX), false);
    assert.equal(events[0]?.action, "connect.launch");
    assert.equal(auditCarriesSecret(events, [issued.code, hashLaunchCode(issued.code), TX, TX_HASH, SECRET]), false);

    const verifier = createTransactionVerifier();
    assert.equal(verifier.length, 43);
    assert.equal(await hashTransactionVerifier(verifier), hashTransaction(verifier));
  });

  it("no inventa plan ni llave cuando la configuración no está", async () => {
    assert.deepEqual(
      evaluateConnectAccess(access({ contractedApps: undefined })),
      { ok: false, reason: "no_plan" }
    );
    assert.deepEqual(
      evaluateConnectAccess(access({ contractedApps: null })),
      { ok: false, reason: "no_plan" }
    );
    assert.deepEqual(
      evaluateConnectAccess(access({ authorizedApps: null })),
      { ok: false, reason: "no_key" }
    );
    assert.deepEqual(
      evaluateConnectAccess(access({ authorizedApps: undefined })),
      { ok: false, reason: "no_key" }
    );
    assert.deepEqual(
      evaluateConnectAccess(access({ resolvedOrigin: null })),
      { ok: false, reason: "no_destination" }
    );
    assert.deepEqual(
      evaluateConnectAccess(access({ membershipActive: false })),
      { ok: false, reason: "no_membership" }
    );
    assert.deepEqual(
      evaluateConnectAccess(access({ tenantId: "" })),
      { ok: false, reason: "no_company" }
    );

    const store = createMemoryLaunchCodeStore();
    const denied = await issueLaunchCode({
      now: new Date(),
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access({ contractedApps: undefined }),
      store,
      audit: () => undefined,
    });
    assert.deepEqual(denied, { ok: false, reason: "no_plan" });
    assert.equal(await store.find(hashLaunchCode("unused")), null);
  });

  it("aísla el código a la empresa, la app y el destino autorizado", async () => {
    assert.equal(evaluateConnectAccess(access({ tenantId: "otro" })).ok, false);
    assert.equal(
      evaluateConnectAccess(access({ resolvedOrigin: "https://evil.example" })).ok,
      false
    );
    assert.equal(evaluateConnectAccess(access({ appId: "aprende-hoy" })).ok, false);
    assert.equal(evaluateConnectAccess(access({ appId: "rrhh" })).ok, false);
    assert.equal(evaluateConnectAccess(access({ appId: "growth-os" })).ok, false);

    const store = createMemoryLaunchCodeStore();
    const now = new Date("2026-11-16T12:00:00.000Z");
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store,
      audit: () => undefined,
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;

    const seen: string[] = [];
    const foreign = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      destinationOrigin: "https://otro.example",
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: (ticket) => {
        seen.push(ticket.tenantId);
        return access({ tenantId: ticket.tenantId });
      },
      store,
      audit: () => undefined,
    });
    assert.equal(foreign.ok, false);
    if (!foreign.ok) assert.equal(foreign.reason, "destination_mismatch");
    assert.deepEqual(seen, []);

    const again = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access(),
      store,
      audit: () => undefined,
    });
    assert.equal(again.ok, false);
  });

  it("canjea una sola vez, exige secreto de servidor y revalida la llave", async () => {
    const store = createMemoryLaunchCodeStore();
    const events: Array<{ action: string; metadata: Record<string, string> }> = [];
    const now = new Date("2026-11-16T12:00:00.000Z");
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store,
      audit: (event) => events.push(event),
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;

    const unauthenticated = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: "otro",
      code: issued.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access(),
      store,
      audit: (event) => events.push(event),
    });
    assert.deepEqual(unauthenticated, { ok: false, reason: "bad_secret" });

    let checks = 0;
    const [first, second] = await Promise.all([
      redeemLaunchCode({
        now,
        secret: SECRET,
        providedSecret: SECRET,
        code: issued.code,
        destinationOrigin: DEST,
        issuerOrigin: ISSUER,
        transaction: TX,
        accessFor: (ticket) => {
          checks += 1;
          assert.equal(ticket.tenantId, "cumple");
          assert.equal(ticket.userId, "user-1");
          return access();
        },
        store,
        audit: (event) => events.push(event),
      }),
      redeemLaunchCode({
        now,
        secret: SECRET,
        providedSecret: SECRET,
        code: issued.code,
        destinationOrigin: DEST,
        issuerOrigin: ISSUER,
        transaction: TX,
        accessFor: () => access(),
        store,
        audit: (event) => events.push(event),
      }),
    ]);
    const oks = [first, second].filter((result) => result.ok);
    assert.equal(oks.length, 1);
    assert.deepEqual(oks[0], { ok: true, userId: "user-1", tenantId: "cumple", appId: "cumple" });
    assert.equal(checks, 1);
    assert.equal(events.some((event) => event.action === "connect.exchange"), true);
    assert.equal(auditCarriesSecret(events, [issued.code, SECRET]), false);

    const expiredStore = createMemoryLaunchCodeStore();
    const short = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store: expiredStore,
      audit: () => undefined,
    });
    assert.equal(short.ok, true);
    if (!short.ok) return;
    const later = new Date(now.getTime() + CONNECT_CODE_TTL_MS);
    const expired = await redeemLaunchCode({
      now: later,
      secret: SECRET,
      providedSecret: SECRET,
      code: short.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access(),
      store: expiredStore,
      audit: () => undefined,
    });
    assert.deepEqual(expired, { ok: false, reason: "expired" });
  });

  it("el código interceptado no se canjea sin la transacción, aunque el origen coincida", async () => {
    const store = createMemoryLaunchCodeStore();
    const now = new Date("2026-11-16T12:00:00.000Z");
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store,
      audit: () => undefined,
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;

    const intercepted = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      transaction: STOLEN,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      accessFor: () => access(),
      store,
      audit: () => undefined,
    });
    assert.deepEqual(intercepted, { ok: false, reason: "transaction" });
    assert.equal((await store.find(hashLaunchCode(issued.code)))?.usedAt, null);

    const originAlone = readCallbackSubmission({
      method: "POST",
      queryCode: null,
      bodyCode: issued.code,
      bodyTransaction: null,
      originHeader: ISSUER,
      requestOrigin: DEST,
      allowedIssuer: ISSUER,
      spaceBaseDomain: "mentorprime.cl",
    });
    assert.deepEqual(originAlone, { ok: false, reason: "transaction" });

    const bound = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      transaction: TX,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      accessFor: () => access(),
      store,
      audit: () => undefined,
    });
    assert.deepEqual(bound, { ok: true, userId: "user-1", tenantId: "cumple", appId: "cumple" });

    const unbound = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: "",
      access: access(),
      store,
      audit: () => undefined,
    });
    assert.deepEqual(unbound, { ok: false, reason: "transaction" });
  });

  it("un acceso revocado no se canjea", async () => {
    const store = createMemoryLaunchCodeStore();
    const events: Array<{ action: string; metadata: Record<string, string> }> = [];
    const now = new Date("2026-11-16T12:00:00.000Z");
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store,
      audit: (event) => events.push(event),
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;

    const revoked = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access({ authorizedApps: [] }),
      store,
      audit: (event) => events.push(event),
    });
    assert.deepEqual(revoked, { ok: false, reason: "no_key" });
    assert.equal(events.some((event) => event.action === "connect.revoke"), true);
    assert.equal(auditCarriesSecret(events, [issued.code]), false);

    const burned = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access(),
      store,
      audit: () => undefined,
    });
    assert.equal(burned.ok, false);
  });

  it("rota el secreto de 256 bits y rechaza uno corto o repetido", async () => {
    const generated = generateConnectExchangeSecret();
    assert.equal(Buffer.from(generated, "base64url").length >= 32, true);
    assert.equal(connectSecretHasEntropy(generated), true);
    assert.equal(connectSecretHasEntropy(SECRET), false);
    assert.equal(connectSecretHasEntropy("a".repeat(43)), false);
    assert.equal(connectSecretHasEntropy(null), false);

    const store = createMemoryLaunchCodeStore();
    const now = new Date("2026-11-16T12:00:00.000Z");
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store,
      audit: () => undefined,
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const rotated = await redeemLaunchCode({
      now,
      secret: generated,
      previousSecret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access(),
      store,
      audit: () => undefined,
    });
    assert.equal(rotated.ok, true);

    const junk = await redeemLaunchCode({
      now,
      secret: generated,
      previousSecret: SECRET,
      providedSecret: generated,
      code: "no-es-un-codigo",
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access(),
      store,
      audit: () => undefined,
    });
    assert.deepEqual(junk, { ok: false, reason: "malformed" });
    assert.equal(await store.find(hashLaunchCode("no-es-un-codigo")), null);
  });

  it("un cambio de empresa quema el código", async () => {
    const store = createMemoryLaunchCodeStore();
    const now = new Date("2026-11-16T12:00:00.000Z");
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "cumple",
      appId: "cumple",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access(),
      store,
      audit: () => undefined,
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const moved = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access({ tenantId: "otra" }),
      store,
      audit: () => undefined,
    });
    assert.deepEqual(moved, { ok: false, reason: "no_company" });
    const again = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      destinationOrigin: DEST,
      issuerOrigin: ISSUER,
      transaction: TX,
      accessFor: () => access(),
      store,
      audit: () => undefined,
    });
    assert.equal(again.ok, false);
  });

  it("la sesión de Cumple no abre Growth OS y se revoca con la llave", () => {
    assert.equal(growthSessionAllowed({ audience: undefined, hostIsCumple: false }), true);
    assert.equal(growthSessionAllowed({ audience: "desk", hostIsCumple: false }), true);
    assert.equal(growthSessionAllowed({ audience: "cumple", hostIsCumple: true }), false);
    assert.equal(growthSessionAllowed({ audience: "desk", hostIsCumple: true }), false);
    assert.equal(
      productSessionVerdict({
        audience: "cumple",
        hostIsCumple: true,
        access: { ok: true },
      }),
      "allow"
    );
    assert.equal(
      productSessionVerdict({
        audience: "cumple",
        hostIsCumple: true,
        access: { ok: false, reason: "no_key" },
      }),
      "revoke"
    );
    assert.equal(
      productSessionVerdict({
        audience: "cumple",
        hostIsCumple: true,
        access: { ok: false, reason: "no_plan" },
      }),
      "revoke"
    );
    assert.equal(
      productSessionVerdict({
        audience: "cumple",
        hostIsCumple: true,
        access: { ok: false, reason: "no_membership" },
      }),
      "revoke"
    );
    assert.equal(
      productSessionVerdict({
        audience: "cumple",
        hostIsCumple: true,
        access: { ok: false, reason: "no_destination" },
      }),
      "deny"
    );
    assert.equal(
      productSessionVerdict({
        audience: "cumple",
        hostIsCumple: false,
        access: { ok: true },
      }),
      "deny"
    );
    assert.equal(
      productSessionVerdict({
        audience: "desk",
        hostIsCumple: true,
        access: { ok: true },
      }),
      "deny"
    );
    assert.equal(readCallbackSubmission({
      method: "POST",
      queryCode: null,
      bodyCode: CODE,
      bodyTransaction: TX,
      originHeader: null,
      requestOrigin: DEST,
      allowedIssuer: ISSUER,
      spaceBaseDomain: "mentorprime.cl",
    }).ok, false);
    assert.equal(allowedCumpleBase({ SPACE_BASE_DOMAIN: "mentorprime.cl" }), "mentorprime.cl");
    assert.equal(PREVIOUS.length > 0, true);
  });

  it("el callback rechaza código en la URL, otro origen y redirección libre", () => {
    assert.deepEqual(
      readCallbackSubmission({
        method: "GET",
        queryCode: "secreto",
        bodyCode: null,
        bodyTransaction: null,
        originHeader: ISSUER,
        requestOrigin: DEST,
        allowedIssuer: ISSUER,
      }),
      { ok: false, reason: "method" }
    );
    assert.deepEqual(
      readCallbackSubmission({
        method: "POST",
        queryCode: "en-la-url",
        bodyCode: "en-el-cuerpo",
        bodyTransaction: TX,
        originHeader: ISSUER,
        requestOrigin: DEST,
        allowedIssuer: ISSUER,
      }),
      { ok: false, reason: "query_code" }
    );
    assert.deepEqual(
      readCallbackSubmission({
        method: "POST",
        queryCode: null,
        bodyCode: CODE,
        bodyTransaction: TX,
        originHeader: "https://evil.example",
        requestOrigin: DEST,
        allowedIssuer: ISSUER,
      }),
      { ok: false, reason: "issuer" }
    );
    assert.deepEqual(
      readCallbackSubmission({
        method: "POST",
        queryCode: null,
        bodyCode: CODE,
        bodyTransaction: TX,
        originHeader: ISSUER,
        requestOrigin: DEST,
        allowedIssuer: ISSUER,
        spaceBaseDomain: "mentorprime.cl",
      }),
      { ok: true, code: CODE, transaction: TX, issuerOrigin: ISSUER, destinationOrigin: DEST }
    );
    assert.equal(productLandingUrl(DEST, "mentorprime.cl"), `${DEST}/`);
    assert.equal(
      productLandingUrl(`${DEST}/admin?next=https://evil.example`, "mentorprime.cl"),
      `${DEST}/`
    );
    assert.equal(productLandingUrl("https://cumple.evil.com", "mentorprime.cl"), null);
    assert.equal(productLandingUrl("https://evil.example", "mentorprime.cl"), null);
    assert.equal(
      evaluateConnectAccess(access({ resolvedOrigin: "http://cumple.localhost:3000" })).ok,
      false
    );

    const form = connectLaunchForm({
      callback: `${DEST}${CONNECT_CALLBACK_PATH}`,
      code: CODE,
      transaction: TX,
      deskOrigin: ISSUER,
    });
    assert.equal(form.ok, true);
    if (!form.ok) return;
    assert.equal(form.method, "POST");
    assert.equal(form.action, `${DEST}${CONNECT_CALLBACK_PATH}`);
    assert.equal(form.action.includes("?"), false);
    assert.equal(form.referrerPolicy, "origin");
    assert.equal(form.fields.transaction, TX);
    const localCsp = buildContentSecurityPolicy({
      APP_URL: "http://localhost:4017",
      NODE_ENV: "development",
    });
    assert.match(localCsp, /form-action[^;]*http:\/\/cumple\.localhost:4017/);
    assert.doesNotMatch(localCsp, /form-action[^;]*\*/);
    const publicCsp = buildContentSecurityPolicy({
      APP_URL: "https://growthos.mentorprime.cl",
      NODE_ENV: "production",
    });
    assert.match(publicCsp, /form-action[^;]*https:\/\/cumple\.mentorprime\.cl/);
    assert.doesNotMatch(publicCsp, /form-action[^;]*https:\/\/evil\.example/);
    assert.equal(connectLaunchForm({ callback: "https://evil.example/robar", code: CODE, transaction: TX, deskOrigin: ISSUER }).ok, false);
    assert.equal(connectLaunchForm({ callback: `${DEST}${CONNECT_CALLBACK_PATH}`, code: CODE, transaction: "", deskOrigin: ISSUER }).ok, false);
    assert.equal(
      connectLaunchForm({
        callback: "https://cumple.evil.com/api/connect/callback",
        code: CODE,
        transaction: TX,
        deskOrigin: ISSUER,
      }).ok,
      false
    );
  });

  it("la sesión de Cumple no comparte dominio de cookie y el retorno cruza al escritorio", () => {
    const cookie = productSessionCookieOptions(true);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.secure, true);
    assert.equal(Object.hasOwn(cookie, "domain"), false);

    assert.equal(
      escritorioReturnHref("https://cumple.mentorprime.cl", "https://growthos.mentorprime.cl"),
      "https://growthos.mentorprime.cl/escritorio"
    );
    assert.equal(
      escritorioReturnHref("http://cumple.localhost:3000", "http://localhost:3000"),
      "http://localhost:3000/escritorio"
    );
    assert.equal(escritorioReturnHref("http://localhost:3000", "http://localhost:3000"), "/escritorio");
    assert.equal(
      isSafeEscritorioHref(
        "https://growthos.mentorprime.cl/escritorio",
        "https://growthos.mentorprime.cl"
      ),
      true
    );
    assert.equal(
      isSafeEscritorioHref("https://evil.example/escritorio", "https://growthos.mentorprime.cl"),
      false
    );
    assert.equal(
      isSafeEscritorioHref("https://growthos.mentorprime.cl/admin", "https://growthos.mentorprime.cl"),
      false
    );
    assert.equal(isSafeEscritorioHref("javascript:alert(1)", "https://growthos.mentorprime.cl"), false);
    assert.equal(isSafeEscritorioHref("/escritorio", "https://growthos.mentorprime.cl"), true);
    assert.equal(
      deskOriginFromEnv({ APP_URL: "http://localhost:3000", NODE_ENV: "development" }),
      "http://localhost:3000"
    );
    assert.equal(
      deskOriginFromEnv({
        APP_URL: "https://localhost:3000",
        NEXT_PUBLIC_APP_URL: "https://growthos.mentorprime.cl",
        NODE_ENV: "production",
      }),
      "https://growthos.mentorprime.cl"
    );
    assert.equal(
      deskOriginFromEnv({ APP_URL: "https://localhost:3000", NODE_ENV: "production" }),
      "https://growthos.mentorprime.cl"
    );
  });

  it("Growth OS sigue en el mismo origen y Cumple deja de navegar a pelo", () => {
    const base = {
      tenantId: "cumple",
      contracted: ["growth-os", "cumple"] as const,
      authorized: ["growth-os", "cumple"] as const,
      aprendeHoyEntryUrl: "https://aprende.example/aula",
      cumpleOrigin: DEST,
    };
    assert.deepEqual(desktopClick({ ...base, appId: "growth-os" }), { kind: "open", href: "/admin" });
    assert.deepEqual(desktopClick({ ...base, appId: "cumple" }), { kind: "connect", appId: "cumple" });
    assert.deepEqual(
      desktopClick({
        ...base,
        appId: "aprende-hoy",
        contracted: ["aprende-hoy"],
        authorized: ["aprende-hoy"],
      }),
      { kind: "open", href: "https://aprende.example/aula" }
    );
    assert.deepEqual(
      desktopClick({ ...base, appId: "rrhh", contracted: ["rrhh"], authorized: ["rrhh"] }),
      { kind: "later" }
    );
    assert.deepEqual(
      desktopClick({ ...base, appId: "cumple", cumpleOrigin: null }),
      { kind: "disconnected" }
    );
    assert.deepEqual(
      desktopClick({ ...base, tenantId: "otro", appId: "cumple" }),
      { kind: "disconnected" }
    );

    const callback = readFileSync(
      resolve("src/app/api/connect/callback/route.ts"),
      "utf8"
    );
    assert.match(callback, /createSession/);
    assert.match(callback, /productSessionCookieOptions/);
    assert.match(callback, /audience: "cumple"/);
    assert.match(callback, /authorization/);
    assert.doesNotMatch(callback, /domain:/);
    assert.match(callback, /redeemLaunchCode/);
    const exchange = readFileSync(resolve("src/app/api/connect/exchange/route.ts"), "utf8");
    assert.match(exchange, /authorization/i);
    assert.match(exchange, /readPreviousConnectSecret/);
    assert.doesNotMatch(exchange, /setSessionCookie|cookies\.set/);
    const launch = readFileSync(resolve("src/app/api/connect/launch/route.ts"), "utf8");
    assert.match(launch, /transactionHash/);
    assert.match(launch, /contractedApps/);
    assert.match(callback, /bodyTransaction/);
    assert.match(exchange, /transaction/);
    assert.doesNotMatch(launch, /resolveContractedApps/);
    const secret = readFileSync(resolve("src/lib/connect/secret.ts"), "utf8");
    assert.match(secret, /server-only/);
    assert.match(secret, /CONNECT_EXCHANGE_SECRET_PREVIOUS/);
    for (const file of [
      "src/components/desktop/MentorDesktop.tsx",
      "src/components/desktop/EscritorioReturn.tsx",
      "src/lib/connect/policy.ts",
      "src/lib/connect/secret-policy.ts",
      "src/components/sites/cumple/CumpleShell.tsx",
    ]) {
      assert.equal(readFileSync(resolve(file), "utf8").includes("CONNECT_EXCHANGE_SECRET"), false);
    }
    const sessions = readFileSync(resolve("src/lib/identity/sessions.ts"), "utf8");
    assert.match(sessions, /growthSessionAllowed/);
    const probe = readFileSync(resolve("src/app/api/connect/session/route.ts"), "utf8");
    assert.match(probe, /productSessionVerdict/);
    assert.doesNotMatch(probe, /permissions|spaces|email/);
  });

  it("RR.HH. se emite hacia su origen y el canje devuelve esa app", async () => {
    const store = createMemoryLaunchCodeStore();
    const now = new Date("2026-11-16T18:00:00.000Z");
    const destination = "https://rrhh-dev-xltxcc-f041cc-212-47-70-32.sslip.io";
    const issued = await issueLaunchCode({
      now,
      secretConfigured: true,
      userId: "user-1",
      tenantId: "seminario-ipn",
      appId: "rrhh",
      issuerOrigin: ISSUER,
      transactionHash: TX_HASH,
      access: access({
        appId: "rrhh",
        tenantId: "seminario-ipn",
        contractedApps: ["growth-os", "rrhh"],
        authorizedApps: ["rrhh"],
        resolvedOrigin: destination,
        spaceBaseDomain: null,
      }),
      store,
      audit: () => undefined,
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    assert.equal(issued.callback, `${destination}/api/connect/callback`);
    const form = connectLaunchForm({
      callback: issued.callback,
      code: issued.code,
      transaction: TX,
      deskOrigin: ISSUER,
      rrhhOrigin: destination,
    });
    assert.equal(form.ok, true);
    const redeemed = await redeemLaunchCode({
      now,
      secret: SECRET,
      providedSecret: SECRET,
      code: issued.code,
      transaction: TX,
      destinationOrigin: destination,
      issuerOrigin: ISSUER,
      accessFor: () =>
        access({
          appId: "rrhh",
          tenantId: "seminario-ipn",
          contractedApps: ["growth-os", "rrhh"],
          authorizedApps: ["rrhh"],
          resolvedOrigin: destination,
          spaceBaseDomain: null,
        }),
      store,
      audit: () => undefined,
    });
    assert.deepEqual(redeemed, {
      ok: true,
      userId: "user-1",
      tenantId: "seminario-ipn",
      appId: "rrhh",
    });
    assert.equal(
      evaluateConnectAccess(
        access({
          appId: "rrhh",
          tenantId: "seminario-ipn",
          authorizedApps: ["growth-os"],
          contractedApps: ["growth-os", "rrhh"],
          resolvedOrigin: destination,
        })
      ).ok,
      false
    );
  });
});
