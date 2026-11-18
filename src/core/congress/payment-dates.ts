const PAID_ON_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SANTIAGO = "America/Santiago";

export function isValidPaidOn(value: string): boolean {
  const m = PAID_ON_RE.exec(value.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function todayPaidOnSantiago(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SANTIAGO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function effectivePaidOn(payment: {
  paidOn?: string | null;
  createdAt: string;
}): string {
  if (payment.paidOn && isValidPaidOn(payment.paidOn)) return payment.paidOn;
  return todayPaidOnSantiago(new Date(payment.createdAt));
}
