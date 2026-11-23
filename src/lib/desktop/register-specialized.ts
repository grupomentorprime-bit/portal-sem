import { SPECIALIZED_MANIFEST_REGISTRATIONS } from "@/nelzuri/catalog/manifests";
import {
  ensureSpecializedCapabilities as sealSpecializedCapabilities,
  registerSpecializedManifest,
  setSpecializedCapabilityInstaller,
} from "@/nelzuri/contracts/capabilities";

/**
 * Único lugar que inscribe las capacidades especializadas.
 * La inscripción es idempotente y ocurre antes de publicar el registro.
 */
setSpecializedCapabilityInstaller(() => {
  for (const entry of SPECIALIZED_MANIFEST_REGISTRATIONS) {
    registerSpecializedManifest(entry);
  }
});

export function ensureSpecializedCapabilities(): void {
  sealSpecializedCapabilities();
}

ensureSpecializedCapabilities();
