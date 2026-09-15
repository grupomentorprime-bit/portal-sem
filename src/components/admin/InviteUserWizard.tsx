"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { isValidEmail, isValidFullName } from "@/lib/validation/identity";
import { cn } from "@/lib/utils";

import type { AssignableRole } from "@/components/admin/UserCmsCard";

interface InviteUserWizardProps {
  onSubmit: (payload: {
    email: string;
    displayName: string;
    roleCode: string;
  }) => Promise<void>;
  error?: string;
  onSuccess?: () => void;
  assignableRoles?: AssignableRole[];
  /** Sin borde exterior cuando va dentro de otra tarjeta */
  embedded?: boolean;
}

export function InviteUserWizard({
  onSubmit,
  error,
  onSuccess,
  assignableRoles = [],
  embedded = false,
}: InviteUserWizardProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [roleId, setRoleId] = useState<string>(assignableRoles[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedRole = assignableRoles.find((r) => r.id === roleId) ?? assignableRoles[0];

  function validate(): boolean {
    let valid = true;
    setEmailError("");
    setNameError("");

    if (!displayName.trim()) {
      setNameError("El nombre es obligatorio.");
      valid = false;
    } else if (!isValidFullName(displayName)) {
      setNameError("Ingresa nombre y apellido.");
      valid = false;
    }

    if (!email.trim()) {
      setEmailError("El correo es obligatorio.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Ingresa un correo válido.");
      valid = false;
    }

    return valid;
  }

  async function handleSend() {
    if (!validate()) return;
    if (!selectedRole?.code) return;

    setSubmitting(true);
    try {
      await onSubmit({
        email: email.trim(),
        displayName: displayName.trim(),
        roleCode: selectedRole.code,
      });
      setEmail("");
      setDisplayName("");
      setRoleId(assignableRoles[0]?.id ?? "");
      setSuccess(true);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(embedded ? "" : "rounded-xl border border-border bg-background p-5")}
      data-team-invite-form
    >
      {success ? (
        <div className="mb-4 rounded-xl border border-[var(--state-success-border)] bg-[var(--state-success-bg)] px-4 py-3 text-sm text-[var(--color-success)]">
          Invitación enviada. La persona recibirá un correo para unirse a este Espacio.
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="team-invite-name">Nombre</Label>
          <Input
            id="team-invite-name"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setNameError("");
              setSuccess(false);
            }}
            placeholder="María González"
            autoComplete="name"
            required
          />
          {nameError ? (
            <p className="text-sm text-[var(--color-danger)]">{nameError}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="team-invite-email">Correo</Label>
          <Input
            id="team-invite-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
              setSuccess(false);
            }}
            placeholder="nombre@institucion.cl"
            autoComplete="email"
            required
          />
          {emailError ? (
            <p className="text-sm text-[var(--color-danger)]">{emailError}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label id="team-invite-role-label">Rol</Label>
          <div
            className="grid gap-2 sm:grid-cols-2"
            role="group"
            aria-labelledby="team-invite-role-label"
          >
            {assignableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setRoleId(role.id);
                  setSuccess(false);
                }}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition",
                  roleId === role.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span className="block font-medium">{role.label}</span>
              </button>
            ))}
          </div>
          {assignableRoles.length === 0 ? (
            <p className="text-sm text-muted">No hay roles disponibles para invitar.</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

        <Button
          type="button"
          onClick={handleSend}
          disabled={submitting || assignableRoles.length === 0}
        >
          {submitting ? "Enviando…" : "Enviar invitación"}
        </Button>
      </div>
    </div>
  );
}
