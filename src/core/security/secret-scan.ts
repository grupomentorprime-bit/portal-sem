export interface SecretFinding {
  rule: string;
  line: number;
}

const RULES: Array<{ id: string; pattern: RegExp }> = [
  { id: "private-key", pattern: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/ },
  { id: "aws-access-key", pattern: /AKIA[0-9A-Z]{16}/ },
  { id: "github-token", pattern: /ghp_[A-Za-z0-9]{36}/ },
  { id: "slack-token", pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { id: "stripe-live", pattern: /sk_live_[0-9a-zA-Z]{10,}/ },
  { id: "mongo-credential", pattern: /mongodb(?:\+srv)?:\/\/(?!user:pass@)[^/\s:]+:[^@\s]+@/ },
];

/** Devuelve la regla y la línea. No devuelve el texto que coincidió. */
export function scanTextForSecrets(text: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        findings.push({ rule: rule.id, line: index + 1 });
      }
    }
  });
  return findings;
}

export function formatSecretFindings(file: string, findings: SecretFinding[]): string {
  return findings.map((finding) => `${file}:${finding.line} ${finding.rule}`).join("\n");
}
