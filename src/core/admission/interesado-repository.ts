import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { getAdmissionAdapter } from "@/core/admission/admission-adapter";
import type {
  AdmissionApplicationInput,
  AdmissionHandoffPayload,
  PortalInteresado,
} from "@/types/admission";

const COLLECTION = "portal_interesados";

export interface CreateInteresadoResult {
  interesado: PortalInteresado;
  handoffOk: boolean;
  handoffExternalId?: string;
}

function validateApplication(input: AdmissionApplicationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.firstName?.trim()) errors.firstName = "El nombre es obligatorio.";
  if (!input.lastName?.trim()) errors.lastName = "Los apellidos son obligatorios.";
  if (!input.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Ingresa un correo válido.";
  }
  if (!input.phone?.trim()) errors.phone = "El teléfono es obligatorio.";
  if (!input.church?.trim()) errors.church = "La iglesia es obligatoria.";
  if (!input.city?.trim()) errors.city = "La ciudad es obligatoria.";
  if (!input.programId?.trim()) errors.programId = "Selecciona un programa.";
  return errors;
}

export async function createInteresadoFromApplication(
  tenant: string,
  input: AdmissionApplicationInput,
  programLabel?: string
): Promise<{ ok: true; result: CreateInteresadoResult } | { ok: false; errors: Record<string, string> }> {
  const errors = validateApplication(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const now = new Date().toISOString();
  const _id = new ObjectId();

  const interesado: PortalInteresado = {
    _id: _id.toString(),
    tenant,
    status: "interesado",
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    church: input.church.trim(),
    city: input.city.trim(),
    programId: input.programId.trim(),
    programLabel: programLabel?.trim(),
    message: input.message?.trim(),
    source: "portal-admision",
    createdAt: now,
  };

  const handoffPayload: AdmissionHandoffPayload = {
    interesadoId: interesado._id!,
    tenant,
    portalStatus: "interesado",
    aprendeHoyTarget: "lead",
    applicant: { ...input, programLabel },
    submittedAt: now,
    source: "portal-sem",
  };

  const adapter = getAdmissionAdapter();
  const handoff = await adapter.handoff(handoffPayload);

  interesado.handoff = {
    delivered: handoff.ok,
    externalId: handoff.externalId,
    deliveredAt: handoff.ok ? now : undefined,
    adapter: adapter.name,
  };

  const db = await getDatabase();
  await db.collection(COLLECTION).insertOne({
    ...interesado,
    _id,
  });

  return {
    ok: true,
    result: {
      interesado,
      handoffOk: handoff.ok,
      handoffExternalId: handoff.externalId,
    },
  };
}
