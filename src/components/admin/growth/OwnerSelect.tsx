"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OwnerSelect({
  opportunityId,
  ownerUserId,
  members,
  disabled,
}: {
  opportunityId: string;
  ownerUserId?: string;
  members: Array<{ userId: string; label: string }>;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const known = !ownerUserId || members.some((member) => member.userId === ownerUserId);

  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">Responsable</span>
      <select
        className="w-full rounded-[var(--radius-md)] border border-[var(--admin-border-subtle)] bg-white px-2 py-1.5 text-sm"
        value={ownerUserId ?? ""}
        disabled={disabled || pending}
        onChange={(event) => {
          const next = event.target.value;
          setPending(true);
          setError(null);
          void (async () => {
            try {
              const response = await fetch(
                `/api/growth/oportunidades/${encodeURIComponent(opportunityId)}/owner`,
                {
                  method: "PUT",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ ownerUserId: next || null }),
                }
              );
              if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                setError(data.error ?? "No se pudo asignar.");
              } else {
                router.refresh();
              }
            } finally {
              setPending(false);
            }
          })();
        }}
      >
        <option value="">Sin responsable</option>
        {!known && ownerUserId ? (
          <option value={ownerUserId}>Responsable sin acceso</option>
        ) : null}
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-destructive">{error}</span> : null}
    </label>
  );
}
