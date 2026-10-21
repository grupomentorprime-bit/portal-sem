import type { Db } from "mongodb";
import {
  CUMPLE_DIAGNOSTICOS_COLLECTION,
  type CumpleDiagnostico,
  type CumpleDiagnosticoStore,
} from "@/sites/cumple/diagnostico-record";

let indexesReady: Promise<void> | null = null;

export async function ensureCumpleDiagnosticoIndexes(db: Db): Promise<void> {
  if (!indexesReady) {
    const collection = db.collection(CUMPLE_DIAGNOSTICOS_COLLECTION);
    indexesReady = Promise.all([
      collection.createIndex(
        { tenantId: 1, submissionId: 1 },
        { unique: true, name: "cumple_diagnostico_submission" }
      ),
      collection.createIndex(
        { reportToken: 1 },
        { unique: true, name: "cumple_diagnostico_report_token" }
      ),
      collection.createIndex(
        { tenantId: 1, oportunidadId: 1, createdAt: -1 },
        { name: "cumple_diagnostico_oportunidad" }
      ),
    ])
      .then(() => undefined)
      .catch((error: unknown) => {
        indexesReady = null;
        throw error;
      });
  }
  await indexesReady;
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export function createMongoCumpleDiagnosticoStore(db: Db): CumpleDiagnosticoStore {
  const collection = db.collection<CumpleDiagnostico>(CUMPLE_DIAGNOSTICOS_COLLECTION);

  return {
    findBySubmission(tenantId, submissionId) {
      return collection.findOne({ tenantId, submissionId });
    },
    findById(tenantId, id) {
      return collection.findOne({ tenantId, _id: id });
    },
    findByReportToken(token) {
      return collection.findOne({ reportToken: token });
    },
    async insert(doc) {
      try {
        await collection.insertOne(doc);
        return { doc, existed: false };
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        const existing = await collection.findOne({
          tenantId: doc.tenantId,
          submissionId: doc.submissionId,
        });
        if (!existing) throw error;
        return { doc: existing, existed: true };
      }
    },
    async attachVinculo(tenantId, id, vinculo) {
      const updated = await collection.findOneAndUpdate(
        {
          tenantId,
          _id: id,
          personaId: { $exists: false },
          oportunidadId: { $exists: false },
        },
        {
          $set: {
            personaId: vinculo.personaId,
            oportunidadId: vinculo.oportunidadId,
            vinculadoEn: vinculo.at,
          },
        },
        { returnDocument: "after" }
      );
      if (updated) return updated;
      return collection.findOne({ tenantId, _id: id });
    },
    listByOportunidad(tenantId, oportunidadId) {
      return collection
        .find({ tenantId, oportunidadId })
        .sort({ createdAt: -1 })
        .toArray();
    },
    listByEmpresa(tenantId, empresaClave) {
      return collection.find({ tenantId, empresaClave }).sort({ createdAt: -1 }).toArray();
    },
  };
}
