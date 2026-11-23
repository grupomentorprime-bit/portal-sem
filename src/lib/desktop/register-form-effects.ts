import "server-only";

import { registerCongressFormEffect } from "@/core/congress/form-effect";
import { registerSemFormEffect } from "@/lib/student-affairs/form-effect";
import { registerCumpleFormEffect } from "@/sites/cumple/form-effect";

/**
 * Efectos que leen o escriben después del envío.
 * No entra al sidebar ni al escritorio: esos módulos son de cliente.
 */
export function ensureFormEffects(): void {
  registerSemFormEffect();
  registerCongressFormEffect();
  registerCumpleFormEffect();
}

ensureFormEffects();
