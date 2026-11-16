"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import {
  MENTOR_APPS,
  mentorAppLabel,
  type MentorAppId,
} from "@/lib/desktop/catalog";

export function SpaceAppsPanel({
  tenantId,
  contractedApps,
  aprendeHoyEntryUrl,
  openAppRequests,
}: {
  tenantId: string;
  contractedApps: MentorAppId[];
  aprendeHoyEntryUrl: string | null;
  openAppRequests: Array<{ appId: MentorAppId }>;
}) {
  const router = useRouter();
  const [selectedApps, setSelectedApps] = useState<MentorAppId[]>(contractedApps);
  const [entryUrl, setEntryUrl] = useState(aprendeHoyEntryUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedApps(contractedApps);
  }, [contractedApps]);

  useEffect(() => {
    setEntryUrl(aprendeHoyEntryUrl ?? "");
  }, [aprendeHoyEntryUrl]);

  const openRequests = useMemo(
    () => new Set(openAppRequests.map((request) => request.appId)),
    [openAppRequests]
  );

  function toggleApp(appId: MentorAppId, checked: boolean) {
    setError("");
    setSelectedApps((current) => {
      const next = checked
        ? [...current, appId]
        : current.filter((value) => value !== appId);
      return MENTOR_APPS.filter((value) => next.includes(value));
    });
  }

  async function handleSave() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/platform/spaces/${encodeURIComponent(tenantId)}/apps`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractedApps: selectedApps,
            aprendeHoyEntryUrl: entryUrl,
          }),
        }
      ).catch(() => null);
      const body = (await response?.json().catch(() => null)) as
        | { ok?: boolean }
        | null;
      if (!response?.ok || !body?.ok) {
        setError("No se guardó.");
        return;
      }
      router.refresh();
    } catch {
      setError("No se guardó.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {MENTOR_APPS.map((appId) => {
          const checked = selectedApps.includes(appId);
          return (
            <div
              key={appId}
              className="rounded-[8px] border border-[var(--color-border-default)] bg-white px-3.5 py-3"
            >
              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={submitting}
                    onChange={(event) => toggleApp(appId, event.target.checked)}
                  />
                  <span className="text-[13px] font-medium text-[var(--gray-900)]">
                    {mentorAppLabel(appId)}
                  </span>
                </span>
                {openRequests.has(appId) ? (
                  <span className="text-[12px] text-[var(--gray-500)]">
                    Solicitud abierta
                  </span>
                ) : null}
              </label>
              {appId === "aprende-hoy" ? (
                <div className="mt-3">
                  <Input
                    label="URL de entrada"
                    value={entryUrl}
                    onChange={(event) => {
                      setError("");
                      setEntryUrl(event.target.value);
                    }}
                    placeholder="https://aula.ejemplo.cl"
                    autoComplete="off"
                    disabled={submitting}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? (
        <p
          className="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-danger)_6%,white)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSave()} loading={submitting} disabled={submitting}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
