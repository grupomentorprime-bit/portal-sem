"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { CMS_INVITE_ROLES } from "@/lib/admin/institutional";
import { cn } from "@/lib/utils";

interface InviteUserWizardProps {
  onSubmit: (payload: { email: string; roleName: string }) => Promise<void>;
  error?: string;
}

export function InviteUserWizard({ onSubmit, error }: InviteUserWizardProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>(CMS_INVITE_ROLES[1]?.id ?? "editor");
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = CMS_INVITE_ROLES.find((r) => r.id === roleId) ?? CMS_INVITE_ROLES[1];

  async function handleSend() {
    setSubmitting(true);
    try {
      await onSubmit({ email, roleName: selectedRole.internalName });
      setEmail("");
      setRoleId("editor");
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-5">
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
            <h3 className="font-medium">Paso 1 — Correo</h3>
            <p className="text-sm text-muted">Ingresa el email de la persona que invitarás.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-email">Correo institucional</Label>
            <Input
              id="wizard-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@institucion.cl"
              required
            />
          </div>
          <Button type="button" onClick={() => setStep(2)} disabled={!email.trim()}>
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
            {CMS_INVITE_ROLES.map((role) => (
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
              El rol <strong>{selectedRole.label}</strong> incluye los permisos estándar del CMS para
              esa función.
            </p>
          </div>
          <ul className="rounded-xl bg-background-muted/50 p-4 text-sm text-muted">
            <li>· Acceso acorde al rol institucional seleccionado</li>
            <li>· Cambios auditados en el historial de actividad</li>
            <li>· Invitación válida por 7 días</li>
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
              <dt className="text-muted">Rol</dt>
              <dd className="font-medium">{selectedRole.label}</dd>
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
