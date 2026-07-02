"use client";

import { useEffect } from "react";

/**
 * Oculta el footer global del portal en la página de admisión;
 * el cierre institucional incluye su propio pie editorial.
 */
export function AdmissionPageChrome() {
  useEffect(() => {
    document.body.dataset.portalPage = "admission";
    return () => {
      delete document.body.dataset.portalPage;
    };
  }, []);

  return null;
}
