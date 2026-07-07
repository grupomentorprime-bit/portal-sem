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
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [roleId, setRoleId] = useState<string>(assignableRoles[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedRole = assignableRoles.find((r) => r.id === roleId) ?? assignableRoles[0];

  function validateStep1(): boolean {
    let valid = true;
    setEmailError("");
    setNameError("");

    if (!email.trim()) {
      setEmailError("El correo es obligatorio.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Ingresa un correo electrónico válido.");
      valid = false;
    }

    if (!displayName.trim()) {
      setNameError("El nombre completo es obligatorio.");
      valid = false;
    } else if (!isValidFullName(displayName)) {
      setNameError("Ingresa nombre y apellido (mínimo dos palabras).");
      valid = false;
    }

    return valid;
  }

  async function handleSend() {
    setSubmitting(true);
    try {
      await onSubmit({
        email: email.trim(),
        displayName: displayName.trim(),
        roleCode: selectedRole?.code ?? "",
      });
      setEmail("");
      setDisplayName("");
      setRoleId(assignableRoles[0]?.id ?? "");
      setStep(1);
      setSuccess(true);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn(embedded ? "" : "rounded-xl border border-border bg-background p-5")}>
      {success ? (
        <div className="mb-4 rounded-xl border border-[var(--state-success-border)] bg-[var(--state-success-bg)] px-4 py-3 text-sm text-[var(--color-success)]">
          Invitación enviada. La persona recibirá un correo para crear su contraseña y acceder al CMS.
        </div>
      ) : null}

      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                step >= n ? "bg-primary text-text-inverse" : "bg-background-muted text-muted"
              )}
            >
              {n}
            </span>
            {n < 4 ? <span className="h-px flex-1 bg-border" /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Paso 1 — Datos de la persona</h3>
            <p className="text-sm text-muted">
              Correo institucional y nombre completo tal como aparecerá en el CMS.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-email">Correo electrónico</Label>
            <Input
              id="wizard-email"
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
            <Label htmlFor="wizard-name">Nombre completo</Label>
            <Input
              id="wizard-name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setNameError("");
                setSuccess(false);
              }}
              placeholder="María González Pérez"
              autoComplete="name"
              required
            />
            {nameError ? (
              <p className="text-sm text-[var(--color-danger)]">{nameError}</p>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
          >
            Continuar
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Paso 2 — Rol</h3>
            <p className="text-sm text-muted">Define el nivel de acceso en el CMS.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {assignableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setRoleId(role.id)}
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
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Paso 3 — Permisos</h3>
            <p className="text-sm text-muted">
              El rol <strong>{selectedRole?.label ?? "—"}</strong> incluye los permisos estándar del CMS para
              esa función.
            </p>
          </div>
          <ul className="rounded-xl bg-background-muted/50 p-4 text-sm text-muted">
            <li>· Acceso acorde al rol institucional seleccionado</li>
            <li>· Cambios auditados en el historial de actividad</li>
            <li>· Enlace de invitación válido por 7 días</li>
            <li>· La persona define su propia contraseña al aceptar</li>
            <li>· El acceso se activa al completar la invitación</li>
          </ul>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button type="button" onClick={() => setStep(4)}>
              Revisar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Paso 4 — Enviar invitación</h3>
            <p className="text-sm text-muted">Confirma los datos antes de enviar.</p>
          </div>
          <dl className="grid gap-3 rounded-xl border border-border p-4 text-sm">
            <div>
              <dt className="text-muted">Correo</dt>
              <dd className="font-medium">{email}</dd>
            </div>
            <div>
              <dt className="text-muted">Nombre</dt>
              <dd className="font-medium">{displayName}</dd>
            </div>
            <div>
              <dt className="text-muted">Rol</dt>
              <dd className="font-medium">{selectedRole?.label ?? "—"}</dd>
            </div>
          </dl>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>
              Atrás
            </Button>
            <Button type="button" onClick={handleSend} disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar invitación"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
