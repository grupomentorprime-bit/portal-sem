/**
 * OT-PORTAL-004 — Adapter de handoff Portal → AprendeHoy Learning OS.
 * El portal termina en Interesado; AprendeHoy comienza en Lead.
 */
import type { AdmissionHandoffPayload } from "@/types/admission";

export interface AdmissionAdapterResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface AdmissionAdapter {
  readonly name: string;
  handoff(payload: AdmissionHandoffPayload): Promise<AdmissionAdapterResult>;
}

/** Persistencia local + log — desarrollo y fallback */
export class LocalAdmissionAdapter implements AdmissionAdapter {
  readonly name = "local";

  async handoff(payload: AdmissionHandoffPayload): Promise<AdmissionAdapterResult> {
    if (process.env.NODE_ENV === "development") {
      console.info("[AdmissionAdapter:local] handoff interesado → lead", {
        interesadoId: payload.interesadoId,
        email: payload.applicant.email,
        programId: payload.applicant.programId,
      });
    }
    return { ok: true, externalId: `local-lead-${payload.interesadoId}` };
  }
}

/** Integración futura con API AprendeHoy */
export class AprendeHoyAdmissionAdapter implements AdmissionAdapter {
  readonly name = "aprendehoy";

  async handoff(payload: AdmissionHandoffPayload): Promise<AdmissionAdapterResult> {
    const baseUrl = process.env.APRENDEHOY_API_URL?.trim();
    const apiKey = process.env.APRENDEHOY_API_KEY?.trim();

    if (!baseUrl) {
      return {
        ok: false,
        error: "APRENDEHOY_API_URL no configurada — handoff diferido",
      };
    }

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          source: payload.source,
          portal_interesado_id: payload.interesadoId,
          tenant: payload.tenant,
          status: payload.aprendeHoyTarget,
          applicant: payload.applicant,
          submitted_at: payload.submittedAt,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { ok: false, error: text || `HTTP ${response.status}` };
      }

      const data = (await response.json()) as { id?: string; leadId?: string };
      return { ok: true, externalId: data.leadId ?? data.id };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Error de red",
      };
    }
  }
}

export function getAdmissionAdapter(): AdmissionAdapter {
  const mode = process.env.ADMISSION_ADAPTER?.trim() ?? "local";
  if (mode === "aprendehoy") {
    return new AprendeHoyAdmissionAdapter();
  }
  return new LocalAdmissionAdapter();
}
