import { registerRouteRules } from "@/nelzuri";

/** Admisión no tiene shell enfocado. Dentro de su zona, la ruta sigue abierta. */
export function registerAdmissionRouteRules(): void {
  registerRouteRules("admision", {
    allowsPath: () => true,
    focusedShell: () => false,
    allowsNavItem: () => true,
  });
}
