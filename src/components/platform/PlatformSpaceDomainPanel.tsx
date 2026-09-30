"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  customDomainDnsRecords,
  customDomainHostSet,
  type CustomDomainConnectStatus,
} from "@/core/tenant/custom-domain-records";

const STATUS_LABEL: Record<CustomDomainConnectStatus, string> = {
  none: "Sin dominio propio",
  pending: "Falta la configuración",
  mismatch: "Aún no coincide",
  dns_ready: "Casi listo",
  connected: "Conectado",
};

const STATUS_TONE: Record<CustomDomainConnectStatus, string> = {
  none: "border-border bg-background-soft text-foreground",
  pending:
    "border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_8%,white)] text-foreground",
  mismatch:
    "border-[color-mix(in_srgb,var(--color-danger)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-danger)_6%,white)] text-foreground",
  dns_ready:
    "border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_8%,white)] text-foreground",
  connected:
    "border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_8%,white)] text-foreground",
};

function previewHostname(raw: string): string {
  return (
    raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.split(":")[0] ?? ""
  );
}

function isDevHost(host: string): boolean {
  const name = host.split(":")[0] ?? host;
  return name === "localhost" || name.endsWith(".localhost");
}

/** Lo que se escribe en el campo Nombre del DNS. @ es la raíz del dominio. */
function registrarDnsName(recordHost: string): string {
  const labels = recordHost.split(".").filter(Boolean);
  if (labels.length <= 2) return "@";
  if (labels[0] === "www" && labels.length === 3) return "www";
  return labels.slice(0, -2).join(".");
}

function visibleCnameTarget(value: string): string {
  const target = value.trim().toLowerCase().replace(/\.$/, "");
  if (!target.includes(".") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(target)) return "";
  return target;
}

export function PlatformSpaceDomainPanel({
  tenantId,
  subdomain,
  subdomainHosts,
  customDomain,
  customIsPrimary = false,
  cnameTarget,
  endpoint,
  layout = "custom",
  hideFieldLabel = false,
  helper = "Opcional. Si lo dejas vacío, se usa el subdominio.",
  placeholder = "ej. organizacion.cl",
}: {
  tenantId: string;
  subdomain: string | null;
  /** Subdominios del Espacio, incluido el de este equipo. */
  subdomainHosts?: Array<{ host: string; isPrimary: boolean }>;
  customDomain: string | null;
  customIsPrimary?: boolean;
  /** Nombre al que el cliente apunta el CNAME. Nunca es la IP del servidor. */
  cnameTarget: string;
  /** Ruta de guardado. Por defecto, la del operador de plataforma. */
  endpoint?: string;
  /** `both` muestra subdominio y dominio propio. `custom` solo el dominio. */
  layout?: "both" | "custom";
  /** La ficha ya explica el campo, así que no se repite la etiqueta. */
  hideFieldLabel?: boolean;
  helper?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [host, setHost] = useState(customDomain ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [status, setStatus] = useState<CustomDomainConnectStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  useEffect(() => {
    setHost(customDomain ?? "");
  }, [customDomain]);

  const hosts =
    subdomainHosts ??
    (subdomain ? [{ host: subdomain, isPrimary: !customIsPrimary }] : []);
  const publicHosts = hosts.filter((item) => !isDevHost(item.host));
  const devHosts = hosts.filter((item) => isDevHost(item.host));
  const shownHosts = publicHosts.length > 0 ? publicHosts : devHosts;
  const extraDevHosts = publicHosts.length > 0 ? devHosts : [];
  const action =
    endpoint ?? `/api/platform/spaces/${encodeURIComponent(tenantId)}/domain`;
  const draft = previewHostname(host);
  const target = visibleCnameTarget(cnameTarget);
  const records =
    draft.includes(".") && target ? customDomainDnsRecords(draft, target) : [];
  const savedNames = customDomain ? customDomainHostSet(customDomain).hosts : [];
  const draftNames = draft.includes(".") ? customDomainHostSet(draft).hosts : [];
  const canCheck =
    Boolean(customDomain) &&
    (draftNames.length === 0 ||
      draftNames.some((name) => savedNames.includes(name)));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSaved("");
    setStatus(null);
    setStatusMessage("");
    try {
      const res = await fetch(action, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
        domain?: { customDomain?: string | null };
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo actualizar el dominio.");
        return;
      }
      setSaved(data.message || "Dominio actualizado");
      setHost(data.domain?.customDomain ?? "");
      router.refresh();
    } catch {
      setError("No se pudo actualizar el dominio.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    setError("");
    setStatus(null);
    setStatusMessage("");
    try {
      const res = await fetch(action, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        connection?: { status?: CustomDomainConnectStatus; message?: string };
      };
      if (!res.ok || !data.ok || !data.connection?.status) {
        setError(data.error || "No se pudo comprobar el dominio.");
        return;
      }
      setStatus(data.connection.status);
      setStatusMessage(data.connection.message || "");
    } catch {
      setError("No se pudo comprobar el dominio.");
    } finally {
      setChecking(false);
    }
  }

  async function copyValue(recordHost: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedHost(recordHost);
      window.setTimeout(() => {
        setCopiedHost((current) => (current === recordHost ? null : current));
      }, 1600);
    } catch {
      setCopiedHost(null);
    }
  }

  const domainField = (
    <Input
      id={layout === "both" ? "dominio-propio" : undefined}
      label={layout === "both" || hideFieldLabel ? undefined : "Dominio del cliente"}
      aria-label={layout === "both" || hideFieldLabel ? "Dominio propio" : undefined}
      value={host}
      onChange={(event) => {
        setHost(event.target.value);
        setSaved("");
        setStatus(null);
        setStatusMessage("");
      }}
      placeholder={placeholder}
      helper={helper || undefined}
      autoComplete="off"
      disabled={submitting}
    />
  );

  const form = (
    <form
      onSubmit={handleSubmit}
      className={
        layout === "both"
          ? "space-y-3 border-t border-[var(--color-border-default)] pt-4"
          : "mt-3 space-y-3"
      }
    >
      {layout === "both" ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-[var(--gray-900)]">
              Dominio propio
            </p>
            {customIsPrimary ? (
              <span className="text-[12px] text-[var(--gray-500)]">Principal</span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--gray-500)]">
            La dirección del cliente. El subdominio sigue activo.
          </p>
        </div>
      ) : subdomain ? null : (
        <p className="text-[12px] text-[var(--gray-500)]">
          El subdominio se asigna con el Espacio.
        </p>
      )}

      {hideFieldLabel ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">{domainField}</div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="submit" loading={submitting} disabled={submitting}>
              Guardar dominio
            </Button>
            {customDomain ? (
              <Button
                type="button"
                variant="outline"
                loading={checking}
                disabled={!canCheck || checking || submitting}
                onClick={handleCheck}
              >
                Comprobar conexión
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        domainField
      )}

      {records.length > 0 ? (
        <div className="overflow-hidden rounded-[8px] border border-[var(--color-border-default)]">
          <div className="border-b border-[var(--color-border-default)] bg-[var(--color-background-default)] px-3.5 py-2.5">
            <p className="text-[13px] font-medium text-[var(--gray-900)]">
              Crea estos CNAME
            </p>
            <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[12px] leading-relaxed text-[var(--gray-500)]">
              <li>Entra al DNS del dominio.</li>
              <li>
                Crea un registro por fila. En Nombre escribe lo de la tabla: @ es
                la raíz y www es el sitio con www.
              </li>
              <li>
                En la raíz, si tu DNS no acepta CNAME, usa ALIAS. En Valor pega el
                nombre de la tabla. No uses una IP.
              </li>
              <li>Guarda el dominio aquí y pulsa Comprobar conexión.</li>
            </ol>
          </div>
          <table className="w-full bg-white text-left">
            <thead>
              <tr className="text-[11px] text-[var(--gray-500)]">
                <th className="px-3.5 py-1.5 font-medium">Tipo</th>
                <th className="px-3.5 py-1.5 font-medium">Nombre en el DNS</th>
                <th className="px-3.5 py-1.5 font-medium">Destino</th>
                <th className="w-10 px-2 py-1.5">
                  <span className="sr-only">Copiar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record.host}
                  className="border-t border-[var(--color-border-default)]"
                >
                  <td className="px-3.5 py-2 align-middle">
                    <span className="inline-flex h-6 items-center rounded-md bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] px-1.5 text-[11px] font-semibold text-[var(--growth-os-primary)]">
                      {record.type}
                    </span>
                  </td>
                  <td className="break-all px-3.5 py-2 text-[13px] text-[var(--gray-900)]">
                    <span className="font-medium">{registrarDnsName(record.host)}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-[var(--gray-500)]">
                      {record.host}
                    </span>
                  </td>
                  <td className="break-all px-3.5 py-2 font-mono text-[13px] text-[var(--gray-900)]">
                    {record.value}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => copyValue(record.host, record.value)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--gray-500)] transition hover:bg-[var(--color-background-default)] hover:text-[var(--gray-900)]"
                      aria-label={`Copiar destino de ${record.name}`}
                    >
                      {copiedHost === record.host ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {status ? (
        <p
          className={`rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed ${STATUS_TONE[status]}`}
          role="status"
        >
          <span className="font-medium">{STATUS_LABEL[status]}.</span>{" "}
          {statusMessage}
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-danger)_6%,white)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {saved ? (
        <p
          className="rounded-xl border border-[color-mix(in_srgb,var(--color-success)_30%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_8%,white)] px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground"
          role="status"
        >
          {saved}
        </p>
      ) : null}

      {hideFieldLabel ? null : (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" loading={submitting} disabled={submitting}>
            Guardar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={checking}
            disabled={!canCheck || checking || submitting}
            onClick={handleCheck}
          >
            Comprobar conexión
          </Button>
        </div>
      )}
    </form>
  );

  if (layout !== "both") return form;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-medium text-[var(--gray-900)]">Subdominio</p>
        <p className="mt-0.5 text-[12px] text-[var(--gray-500)]">
          Siempre disponible, sin configurar DNS.
        </p>
        {shownHosts.length === 0 ? (
          <p className="mt-2 text-[13px] text-[var(--gray-500)]">
            Se asigna con el Espacio.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {shownHosts.map((item) => (
              <li
                key={item.host}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 break-all text-[13px] text-[var(--gray-900)]">
                  {item.host}
                </span>
                {item.isPrimary ? (
                  <span className="shrink-0 text-[12px] text-[var(--gray-500)]">
                    Principal
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {extraDevHosts.length > 0 ? (
          <p className="mt-1.5 break-all text-[12px] text-[var(--gray-500)]">
            En este equipo: {extraDevHosts.map((item) => item.host).join(", ")}
          </p>
        ) : null}
      </div>
      {form}
    </div>
  );
}
