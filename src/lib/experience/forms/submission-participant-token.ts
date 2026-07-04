import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { getAppBaseUrl } from "@/lib/app-url";

const TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("SESSION_SECRET no configurada.");
  }
  return secret;
}

function signBody(body: string): string {
  return createHmac("sha256", getSecret()).update(body).digest("base64url");
}

export function createSubmissionParticipantToken(submissionId: string): string {
  const payload = {
    sid: submissionId,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signBody(body)}`;
}

export function verifySubmissionParticipantToken(
  token: string,
  submissionId: string
): boolean {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signBody(body);

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      sid?: string;
      exp?: number;
    };
    if (payload.sid !== submissionId) return false;
    if (!payload.exp || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function buildParticipantJustifyUrl(submissionId: string): string {
  const token = createSubmissionParticipantToken(submissionId);
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/asistencia/justificar/${encodeURIComponent(submissionId)}?token=${encodeURIComponent(token)}`;
}
