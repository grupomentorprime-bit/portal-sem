export function isConvocatoriaIdentityReady(values: Record<string, unknown>): boolean {
  const mode = String(values.registrationMode ?? "");
  if (mode === "roster") {
    return Boolean(String(values.studentId ?? "").trim());
  }
  if (mode === "manual") {
    const name = String(values.fullName ?? "").trim();
    return name.length >= 2;
  }
  return false;
}

export function canSubmitConvocatoriaForm(values: Record<string, unknown>): boolean {
  return isConvocatoriaIdentityReady(values) && Boolean(String(values.attendance ?? "").trim());
}
