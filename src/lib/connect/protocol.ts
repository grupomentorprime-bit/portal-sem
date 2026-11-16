import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  CONNECT_APP_ID,
  CONNECT_CALLBACK_PATH,
  CONNECT_CODE_TTL_MS,
  evaluateConnectAccess,
  isDeskOrigin,
  isLaunchCode,
  isTransactionHash,
  isTransactionVerifier,
  normalizeOrigin,
  type ConnectAccessInput,
} from "@/lib/connect/policy";

export type LaunchTicket = {
  codeHash: string;
  userId: string;
  tenantId: string;
  appId: "cumple";
  destinationOrigin: string;
  issuerOrigin: string;
  transactionHash: string;
  expiresAt: string;
  usedAt: string | null;
};

export type ConnectAudit = {
  action: "connect.launch" | "connect.exchange" | "connect.reject" | "connect.revoke";
  tenantId: string;
  userId: string;
  metadata: Record<string, string>;
};

export interface LaunchCodeStore {
  insert(ticket: LaunchTicket): Promise<void>;
  consume(codeHash: string, nowIso: string): Promise<LaunchTicket | null>;
  find(codeHash: string): Promise<LaunchTicket | null>;
}

export function createLaunchCode(): string {
  return randomBytes(32).toString("base64url");
}

export function hashLaunchCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Mismo SHA-256 hex que `hashTransactionVerifier` en el navegador. */
export function hashTransaction(verifier: string): string {
  return createHash("sha256").update(verifier).digest("hex");
}

function transactionMatches(verifier: string, expectedHash: string): boolean {
  if (!isTransactionVerifier(verifier) || !isTransactionHash(expectedHash)) return false;
  const actual = createHash("sha256").update(verifier).digest();
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function secretsMatch(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function createMemoryLaunchCodeStore(): LaunchCodeStore {
  const rows = new Map<string, LaunchTicket>();
  let tail: Promise<void> = Promise.resolve();

  function exclusive<T>(fn: () => T): Promise<T> {
    const run = tail.then(fn);
    tail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  return {
    insert(ticket) {
      return exclusive(() => {
        const stored: LaunchTicket = {
          codeHash: ticket.codeHash,
          userId: ticket.userId,
          tenantId: ticket.tenantId,
          appId: ticket.appId,
          destinationOrigin: ticket.destinationOrigin,
          issuerOrigin: ticket.issuerOrigin,
          transactionHash: ticket.transactionHash,
          expiresAt: ticket.expiresAt,
          usedAt: null,
        };
        rows.set(stored.codeHash, stored);
      });
    },
    consume(codeHash, nowIso) {
      return exclusive(() => {
        const row = rows.get(codeHash);
        if (!row || row.usedAt) return null;
        if (Date.parse(row.expiresAt) <= Date.parse(nowIso)) return null;
        const before: LaunchTicket = { ...row, usedAt: null };
        row.usedAt = nowIso;
        return before;
      });
    },
    find(codeHash) {
      return exclusive(() => {
        const row = rows.get(codeHash);
        return row ? { ...row } : null;
      });
    },
  };
}

function reject(
  audit: (event: ConnectAudit) => void,
  event: ConnectAudit,
  reason: string
): { ok: false; reason: string } {
  audit(event);
  return { ok: false, reason };
}

export async function issueLaunchCode(input: {
  now: Date;
  secretConfigured: boolean;
  userId: string;
  tenantId: string;
  appId: string;
  issuerOrigin: string;
  transactionHash: string;
  access: ConnectAccessInput;
  store: LaunchCodeStore;
  audit: (event: ConnectAudit) => void;
}): Promise<
  { ok: true; code: string; callback: string; expiresAt: string } | { ok: false; reason: string }
> {
  const tenantId = input.tenantId.trim();
  if (!input.secretConfigured) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: tenantId || "none",
        userId: input.userId,
        metadata: { appId: input.appId, reason: "unconfigured" },
      },
      "unconfigured"
    );
  }

  const decision = evaluateConnectAccess({ ...input.access, appId: input.appId, tenantId });
  if (!decision.ok) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: tenantId || "none",
        userId: input.userId,
        metadata: { appId: input.appId, reason: decision.reason },
      },
      decision.reason
    );
  }

  const transactionHash = input.transactionHash.trim().toLowerCase();
  if (!isTransactionHash(transactionHash)) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId,
        userId: input.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "transaction" },
      },
      "transaction"
    );
  }

  const issuer = normalizeOrigin(input.issuerOrigin);
  if (!issuer || !isDeskOrigin(issuer)) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId,
        userId: input.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "no_destination" },
      },
      "no_destination"
    );
  }

  const code = createLaunchCode();
  const expiresAt = new Date(input.now.getTime() + CONNECT_CODE_TTL_MS).toISOString();
  await input.store.insert({
    codeHash: hashLaunchCode(code),
    userId: input.userId,
    tenantId,
    appId: CONNECT_APP_ID,
    destinationOrigin: decision.destinationOrigin,
    issuerOrigin: issuer,
    transactionHash,
    expiresAt,
    usedAt: null,
  });
  input.audit({
    action: "connect.launch",
    tenantId,
    userId: input.userId,
    metadata: { appId: CONNECT_APP_ID, tenantId },
  });
  return {
    ok: true,
    code,
    callback: `${decision.destinationOrigin}${CONNECT_CALLBACK_PATH}`,
    expiresAt,
  };
}

export async function redeemLaunchCode(input: {
  now: Date;
  secret: string | null;
  previousSecret?: string | null;
  providedSecret: string;
  code: string;
  transaction: string;
  destinationOrigin: string;
  issuerOrigin: string | null;
  accessFor: (ticket: {
    userId: string;
    tenantId: string;
    appId: "cumple";
  }) => ConnectAccessInput | Promise<ConnectAccessInput>;
  store: LaunchCodeStore;
  audit: (event: ConnectAudit) => void;
}): Promise<
  { ok: true; userId: string; tenantId: string; appId: "cumple" } | { ok: false; reason: string }
> {
  if (!input.secret) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: "none",
        userId: "none",
        metadata: { appId: CONNECT_APP_ID, reason: "unconfigured" },
      },
      "unconfigured"
    );
  }
  const currentOk = secretsMatch(input.providedSecret, input.secret);
  const previousOk = input.previousSecret
    ? secretsMatch(input.providedSecret, input.previousSecret)
    : false;
  if (!currentOk && !previousOk) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: "none",
        userId: "none",
        metadata: { appId: CONNECT_APP_ID, reason: "bad_secret" },
      },
      "bad_secret"
    );
  }

  if (!isLaunchCode(input.code)) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: "none",
        userId: "none",
        metadata: { appId: CONNECT_APP_ID, reason: "malformed" },
      },
      "malformed"
    );
  }

  const transaction = input.transaction.trim();
  if (!isTransactionVerifier(transaction)) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: "none",
        userId: "none",
        metadata: { appId: CONNECT_APP_ID, reason: "transaction" },
      },
      "transaction"
    );
  }

  const nowIso = input.now.toISOString();
  const codeHash = hashLaunchCode(input.code);
  const pending = await input.store.find(codeHash);
  if (!pending) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: "none",
        userId: "none",
        metadata: { appId: CONNECT_APP_ID, reason: "unknown" },
      },
      "unknown"
    );
  }
  if (pending.usedAt) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: pending.tenantId,
        userId: pending.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "reused" },
      },
      "reused"
    );
  }
  if (Date.parse(pending.expiresAt) <= Date.parse(nowIso)) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: pending.tenantId,
        userId: pending.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "expired" },
      },
      "expired"
    );
  }
  if (!transactionMatches(transaction, pending.transactionHash)) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: pending.tenantId,
        userId: pending.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "transaction" },
      },
      "transaction"
    );
  }

  const ticket = await input.store.consume(codeHash, nowIso);
  if (!ticket) {
    const existing = await input.store.find(codeHash);
    const reason = !existing ? "unknown" : existing.usedAt ? "reused" : "expired";
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: existing?.tenantId ?? "none",
        userId: existing?.userId ?? "none",
        metadata: { appId: CONNECT_APP_ID, reason },
      },
      reason
    );
  }

  const destination = normalizeOrigin(input.destinationOrigin);
  if (!destination || destination !== ticket.destinationOrigin) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: ticket.tenantId,
        userId: ticket.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "destination_mismatch" },
      },
      "destination_mismatch"
    );
  }

  const issuer = normalizeOrigin(input.issuerOrigin);
  if (!issuer || issuer !== ticket.issuerOrigin) {
    return reject(
      input.audit,
      {
        action: "connect.reject",
        tenantId: ticket.tenantId,
        userId: ticket.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "issuer_mismatch" },
      },
      "issuer_mismatch"
    );
  }

  const fresh = await input.accessFor({
    userId: ticket.userId,
    tenantId: ticket.tenantId,
    appId: ticket.appId,
  });
  if (fresh.tenantId.trim() !== ticket.tenantId) {
    return reject(
      input.audit,
      {
        action: "connect.revoke",
        tenantId: ticket.tenantId,
        userId: ticket.userId,
        metadata: { appId: CONNECT_APP_ID, reason: "no_company" },
      },
      "no_company"
    );
  }
  const decision = evaluateConnectAccess({
    ...fresh,
    appId: ticket.appId,
    tenantId: ticket.tenantId,
  });
  if (!decision.ok || decision.destinationOrigin !== ticket.destinationOrigin) {
    const reason = decision.ok ? "no_destination" : decision.reason;
    return reject(
      input.audit,
      {
        action: "connect.revoke",
        tenantId: ticket.tenantId,
        userId: ticket.userId,
        metadata: { appId: CONNECT_APP_ID, reason },
      },
      reason
    );
  }

  input.audit({
    action: "connect.exchange",
    tenantId: ticket.tenantId,
    userId: ticket.userId,
    metadata: { appId: CONNECT_APP_ID, tenantId: ticket.tenantId },
  });
  return {
    ok: true,
    userId: ticket.userId,
    tenantId: ticket.tenantId,
    appId: CONNECT_APP_ID,
  };
}
