export type DistributeRow = { registrationId: string; balanceClp: number };
export type DistributeAllocation = { registrationId: string; amountClp: number };

export function distributeProportional(
  rows: DistributeRow[],
  amountClp: number
): DistributeAllocation[] {
  const amount = Math.trunc(amountClp);
  if (!Number.isFinite(amount) || amount <= 0) return [];

  const eligible = rows
    .map((r) => ({
      registrationId: r.registrationId,
      balanceClp: Math.max(0, Math.trunc(r.balanceClp)),
    }))
    .filter((r) => r.balanceClp > 0);

  if (eligible.length === 0) return [];

  const totalBalance = eligible.reduce((s, r) => s + r.balanceClp, 0);
  if (amount > totalBalance) {
    throw new Error("amount_exceeds_balances");
  }

  const floors = eligible.map((r) => {
    const raw = (amount * r.balanceClp) / totalBalance;
    const floor = Math.floor(raw);
    return {
      registrationId: r.registrationId,
      balanceClp: r.balanceClp,
      amountClp: floor,
      remainderAfterFloor: r.balanceClp - floor,
    };
  });

  let leftover = amount - floors.reduce((s, r) => s + r.amountClp, 0);

  const order = [...floors].sort((a, b) => {
    if (b.remainderAfterFloor !== a.remainderAfterFloor) {
      return b.remainderAfterFloor - a.remainderAfterFloor;
    }
    return a.registrationId.localeCompare(b.registrationId);
  });

  for (const row of order) {
    if (leftover <= 0) break;
    if (row.amountClp >= row.balanceClp) continue;
    row.amountClp += 1;
    leftover -= 1;
  }

  while (leftover > 0) {
    let progressed = false;
    for (const row of order) {
      if (leftover <= 0) break;
      if (row.amountClp >= row.balanceClp) continue;
      row.amountClp += 1;
      leftover -= 1;
      progressed = true;
    }
    if (!progressed) break;
  }

  return floors
    .filter((r) => r.amountClp > 0)
    .map((r) => ({
      registrationId: r.registrationId,
      amountClp: r.amountClp,
    }));
}
