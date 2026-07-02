"use client";

import { Modal } from "@/components/ui/modal";

interface ExperienceModalHostProps {
  modalId: string | null;
  onClose: () => void;
}

/** Host de modales invocado por acciones type=modal. */
export function ExperienceModalHost({ modalId, onClose }: ExperienceModalHostProps) {
  return (
    <Modal
      open={Boolean(modalId)}
      onClose={onClose}
      title="Modal"
      description={modalId ? `ID: ${modalId}` : undefined}
      size="md"
    >
      <p className="text-body text-muted">
        Este modal se renderizará aquí cuando el Experience Studio esté conectado.
      </p>
    </Modal>
  );
}
