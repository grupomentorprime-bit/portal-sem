import { can, requirePermission } from "@/core/identity";
import type { AuthContext } from "@/types/identity";

export async function requireCongressView() {
  return requirePermission("congress.view");
}

export async function requireCongressOperate() {
  return requirePermission("congress.operate");
}

export async function requireCongressPayments() {
  return requirePermission("congress.payments");
}

export async function requireCongressImport() {
  return requirePermission("congress.import");
}

export async function requireCongressFinanceCorrect() {
  return requirePermission("congress.finance.correct");
}

export function congressCapabilities(ctx: AuthContext) {
  return {
    view: can(ctx, "congress.view"),
    operate: can(ctx, "congress.operate"),
    payments: can(ctx, "congress.payments"),
    financeCorrect: can(ctx, "congress.finance.correct"),
    import: can(ctx, "congress.import"),
  };
}
