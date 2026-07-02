"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, Switch } from "@/components/ui";
import type { StorageAccessMode, StorageIntegrationPublic, StorageIntegrationUpdate, StorageProvider } from "@/types/integrations";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type TestStatus = "idle" | "testing" | "success" | "error";

const PROVIDER_OPTIONS = [
  { value: "backblaze-b2", label: "Backblaze B2" },
  { value: "s3-compatible", label: "S3 compatible (MinIO, R2, etc.)" },
  { value: "aws", label: "Amazon S3" },
] as const;

const ACCESS_MODE_OPTIONS = [
  { value: "private", label: "Bucket privado (recomendado)" },
  { value: "public", label: "Bucket público o CDN" },
] as const;

function emptyForm(): StorageIntegrationUpdate {
  return {
    enabled: false,
    provider: "backblaze-b2",
    accessMode: "private",
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    region: "auto",
    bucket: "",
    accessKeyId: "",
    secretAccessKey: "",
    publicUrl: "",
    forcePathStyle: true,
  };
}

function toForm(config: StorageIntegrationPublic): StorageIntegrationUpdate {
  return {
    enabled: config.enabled,
    provider: config.provider,
    accessMode: config.accessMode ?? "private",
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: "",
    publicUrl: config.publicUrl,
    forcePathStyle: config.forcePathStyle,
  };
}

export function StorageIntegrationsClient() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState<StorageIntegrationUpdate>(emptyForm());
  const [baseline, setBaseline] = useState<StorageIntegrationUpdate>(emptyForm());
  const [meta, setMeta] = useState<StorageIntegrationPublic | null>(null);
  const [hasExistingSecret, setHasExistingSecret] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [error, setError] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    const res = await fetch("/api/admin/integrations/storage");
    const data = await res.json();
    if (res.status === 403 || res.status === 401) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    if (!data.ok) {
      setError(data.error ?? "No se pudo cargar la configuración");
      setLoading(false);
      return;
    }
    const next = toForm(data.config as StorageIntegrationPublic);
    setForm(next);
    setBaseline(next);
    setMeta(data.config);
    setHasExistingSecret(Boolean(data.config.hasSecretAccessKey));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch<K extends keyof StorageIntegrationUpdate>(key: K, value: StorageIntegrationUpdate[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "provider") {
        const provider = value as StorageProvider;
        if (provider === "backblaze-b2") {
          next.forcePathStyle = true;
          next.accessMode = "private";
          if (!prev.endpoint) next.endpoint = "https://s3.us-east-005.backblazeb2.com";
        } else if (provider === "aws") {
          next.forcePathStyle = false;
        }
      }
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    setError("");
    const res = await fetch("/api/admin/integrations/storage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.ok) {
      setSaveStatus("error");
      setError(data.error ?? "No se pudo guardar");
      return;
    }
    const next = toForm(data.config as StorageIntegrationPublic);
    setForm(next);
    setBaseline(next);
    setMeta(data.config);
    setHasExistingSecret(Boolean(data.config.hasSecretAccessKey));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function handleTest() {
    setTestStatus("testing");
    setTestMessage("");
    setError("");
    const res = await fetch("/api/admin/integrations/storage/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: form }),
    });
    const data = await res.json();
    if (!data.ok) {
      setTestStatus("error");
      setTestMessage(data.error ?? "Conexión fallida");
      return;
    }
    setTestStatus("success");
    setTestMessage(data.message ?? "Conexión exitosa");
    setTimeout(() => setTestStatus("idle"), 4000);
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando integraciones…</p>;
  }

  if (forbidden) {
    return (
      <p className="text-sm text-muted">
        No tienes permisos para gestionar integraciones de almacenamiento.
      </p>
    );
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(baseline);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Almacenamiento en la nube (S3)</CardTitle>
          <CardDescription>
            Configura Backblaze B2 u otro proveedor compatible. Los archivos subidos desde Medios
            irán directamente al bucket, incluso en desarrollo local.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {meta ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              <p>
                <span className="font-medium">Estado:</span>{" "}
                {meta.configured && meta.enabled
                  ? meta.accessMode === "private"
                    ? "S3 activo (bucket privado, proxy del portal)"
                    : "S3 activo (URLs públicas)"
                  : "Almacenamiento local"}
              </p>
              {meta.source !== "none" ? (
                <p className="mt-1 text-muted">
                  Fuente actual: {meta.source === "database" ? "panel de administración" : "variables de entorno"}
                </p>
              ) : null}
            </div>
          ) : null}

          <form onSubmit={handleSave} className="grid gap-5">
            <Switch
              checked={form.enabled}
              onChange={(checked) => patch("enabled", checked)}
              label="Usar almacenamiento S3"
              description="Activa para subir todos los medios al bucket remoto."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="provider">Proveedor</Label>
                <Select
                  id="provider"
                  value={form.provider}
                  onChange={(e) => patch("provider", e.target.value as StorageProvider)}
                  options={[...PROVIDER_OPTIONS]}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  value={form.region}
                  onChange={(e) => patch("region", e.target.value)}
                  placeholder="auto"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="accessMode">Acceso a archivos</Label>
                <Select
                  id="accessMode"
                  value={form.accessMode}
                  onChange={(e) => patch("accessMode", e.target.value as StorageAccessMode)}
                  options={[...ACCESS_MODE_OPTIONS]}
                />
                <p className="text-xs text-muted">
                  {form.accessMode === "private"
                    ? "El bucket puede permanecer privado. Las imágenes se sirven a través del portal (/api/cms/media/stream)."
                    : "Los archivos se enlazan directamente desde el bucket o CDN público."}
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="endpoint">Endpoint S3</Label>
                <Input
                  id="endpoint"
                  value={form.endpoint}
                  onChange={(e) => patch("endpoint", e.target.value)}
                  placeholder="https://s3.us-east-005.backblazeb2.com"
                />
                <p className="text-xs text-muted">
                  Copia el endpoint S3 de Backblaze. Puedes pegarlo con o sin https:// — se normaliza automáticamente.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bucket">Bucket</Label>
                <Input
                  id="bucket"
                  value={form.bucket}
                  onChange={(e) => patch("bucket", e.target.value)}
                  required
                />
              </div>

              {form.accessMode === "public" ? (
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="publicUrl">URL pública (CDN o dominio del bucket)</Label>
                  <Input
                    id="publicUrl"
                    value={form.publicUrl}
                    onChange={(e) => patch("publicUrl", e.target.value)}
                    placeholder="https://f005.backblazeb2.com/file/Seminario-ipn"
                    required={form.enabled}
                  />
                  <p className="text-xs text-muted">
                    Base pública donde se sirven los archivos. Se añade /media/… automáticamente.
                  </p>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="accessKeyId">Access Key ID</Label>
                <Input
                  id="accessKeyId"
                  value={form.accessKeyId}
                  onChange={(e) => patch("accessKeyId", e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                <Input
                  id="secretAccessKey"
                  type="password"
                  value={form.secretAccessKey ?? ""}
                  onChange={(e) => patch("secretAccessKey", e.target.value)}
                  placeholder={hasExistingSecret ? "••••••••  (dejar vacío para mantener)" : ""}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Switch
              checked={form.forcePathStyle}
              onChange={(checked) => patch("forcePathStyle", checked)}
              label="Path-style URLs"
              description="Requerido para Backblaze B2 y la mayoría de S3 self-hosted."
            />

            {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
            {testMessage ? (
              <p
                className={
                  testStatus === "error"
                    ? "text-sm text-[var(--color-danger)]"
                    : "text-sm text-[var(--color-success,#15803d)]"
                }
              >
                {testMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saveStatus === "saving" || !isDirty}>
                {saveStatus === "saving"
                  ? "Guardando…"
                  : saveStatus === "saved"
                    ? "Guardado"
                    : "Guardar configuración"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={testStatus === "testing"}
                onClick={() => void handleTest()}
              >
                {testStatus === "testing" ? "Probando…" : "Probar conexión"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backblaze B2 — guía rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>1. Crea un bucket en B2 y déjalo en <strong>Private</strong> si usas modo bucket privado.</p>
          <p>2. Genera una Application Key con permisos de <strong>lectura, escritura y listado</strong> en ese bucket.</p>
          <p>3. Usa el endpoint S3 de tu región y activa path-style.</p>
          <p>4. En modo privado no necesitas URL pública — el portal sirve los archivos de forma segura.</p>
        </CardContent>
      </Card>
    </div>
  );
}
