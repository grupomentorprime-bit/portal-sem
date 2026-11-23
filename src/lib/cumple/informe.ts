import "server-only";

import { getDatabase } from "@/lib/mongodb";
import { getPortalContext } from "@/lib/portal/site";
import {
  diagnosticoEnEspacio,
  type CumpleDiagnostico,
  type CumpleDiagnosticoStore,
} from "@/sites/cumple/diagnostico-record";
import {
  createMongoCumpleDiagnosticoStore,
  ensureCumpleDiagnosticoIndexes,
} from "./diagnostico-store";

/** Lee el informe ya guardado. No crea otro documento. */
export async function reportPathForStoredSubmission(
  store: Pick<CumpleDiagnosticoStore, "findBySubmission">,
  tenantId: string,
  submissionId: string
): Promise<string | null> {
  const id = submissionId.trim();
  if (!tenantId.trim() || !id) return null;
  const found = await store.findBySubmission(tenantId, id);
  const record = diagnosticoEnEspacio(found, tenantId);
  if (!record) return null;
  return `/informe/${encodeURIComponent(record.reportToken)}`;
}

/** Ruta del informe que acaba de guardar este envío, solo en su Espacio. */
export async function reportPathForSubmission(
  tenantId: string,
  submissionId: string
): Promise<string | null> {
  const id = submissionId.trim();
  if (!tenantId.trim() || !id) return null;
  const db = await getDatabase();
  await ensureCumpleDiagnosticoIndexes(db);
  return reportPathForStoredSubmission(
    createMongoCumpleDiagnosticoStore(db),
    tenantId,
    id
  );
}

/** Informe del Espacio del host. Otro Espacio o un token ajeno no lo ven. */
export async function loadInformeDelHost(token: string): Promise<CumpleDiagnostico | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const ctx = await getPortalContext();
  if (!ctx?.tenant) return null;
  const db = await getDatabase();
  await ensureCumpleDiagnosticoIndexes(db);
  const found = await createMongoCumpleDiagnosticoStore(db).findByReportToken(trimmed);
  return diagnosticoEnEspacio(found, ctx.tenant);
}
