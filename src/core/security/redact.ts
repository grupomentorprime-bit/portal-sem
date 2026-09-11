import "server-only";

const SENSITIVE_PATTERNS: RegExp[] = [
  /mongodb(\+srv)?:\/\/[^\s'"\\]+/gi,
  /\b(sk_live|sk_test|re_)[A-Za-z0-9]+\b/g,
  /\bAKIA[A-Z0-9]{16}\b/g,
  /Bearer\s+[A-Za-z0-9._\-+=/]+/gi,
  /(?:client_secret|secret_access_key|secretAccessKey|SESSION_SECRET|MONGODB_URI|RESEND_API_KEY|KEYCLOAK_CLIENT_SECRET|KEYCLOAK_ADMIN_PASSWORD|S3_SECRET_ACCESS_KEY|WHATSAPP_APP_SECRET|verify_token|app_secret|access_token)\s*[=:]\s*[^\s&]+/gi,
  /(?:password|secret|api[_-]?key|access_token|id_token|refresh_token|verifyToken|appSecret|accessToken)\s*[=:]\s*[^\s&'"\\]+/gi,
];

const SENSITIVE_KEY =
  /^(token|accessToken|idToken|refreshToken|clientSecret|secretAccessKey|password|apiKey|authorization|verifyToken|appSecret|verify_token|app_secret|access_token)$/i;

export function redactSensitiveText(value: string): string {
  let redacted = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, "***");
  }
  return redacted;
}

export function logServerError(scope: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${scope}]`, error.name, redactSensitiveText(error.message));
    return;
  }
  console.error(`[${scope}]`, redactSensitiveText(String(error)));
}

export function omitSensitiveFields(
  record: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!record) return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEY.test(key) || /secret|password|token|apikey/i.test(key)) {
      continue;
    }
    result[key] = value;
  }
  return result;
}
