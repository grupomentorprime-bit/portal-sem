"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MediaField } from "@/components/media/MediaPicker";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { EditorField } from "@/sites/content/overlay";
import type { SiteContentValue } from "@/sites/types";

interface PageSummary {
  path: string;
  title: string;
  navLabel: string;
  slotCount: number;
}

interface PageEditorModel {
  path: string;
  title: string;
  navLabel: string;
  fields: EditorField[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function ConnectedSiteHub({ tenantId }: { tenantId: string }) {
  const apiPath = tenantId
    ? `/api/site/public-content?tenant=${encodeURIComponent(tenantId)}`
    : "/api/site/public-content";
  const cards = [
    {
      href: "/admin/config?section=contact",
      title: "Teléfono y correo",
      text: "Número, WhatsApp, correo, dirección y horario.",
    },
    {
      href: "/admin/config?section=social",
      title: "Redes",
      text: "Instagram, Facebook, LinkedIn y el resto de enlaces.",
    },
    {
      href: "/admin/config?section=branding",
      title: "Logo e imágenes",
      text: "Logo y foto de portada que leen los sitios conectados.",
    },
  ] as const;

  return (
    <div className="space-y-3">
      <ul className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="block h-full rounded-2xl border border-border bg-background px-5 py-4 transition hover:bg-background-muted"
            >
              <span className="block text-sm font-semibold text-foreground">{card.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{card.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-5 text-muted">
        Los sitios externos leen esta información en{" "}
        <code className="rounded bg-background-muted px-1.5 py-0.5">{apiPath}</code>
        . El diseño no se edita aquí.
      </p>
    </div>
  );
}

export function SitePagesClient({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPath = searchParams.get("path");
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [editor, setEditor] = useState<PageEditorModel | null>(null);
  const [values, setValues] = useState<Record<string, SiteContentValue>>({});
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/site/pages");
    const data = (await res.json()) as { ok?: boolean; pages?: PageSummary[]; error?: string };
    if (!res.ok || !data.ok) {
      setError(data.error || "No se pudieron cargar las páginas.");
      setPages([]);
      return;
    }
    setPages(data.pages ?? []);
    setError("");
  }, []);

  const loadEditor = useCallback(async (path: string) => {
    const res = await fetch(`/api/site/pages?path=${encodeURIComponent(path)}`);
    const data = (await res.json()) as { ok?: boolean; page?: PageEditorModel; error?: string };
    if (!res.ok || !data.ok || !data.page) {
      setError(data.error || "No se pudo abrir la página.");
      setEditor(null);
      return;
    }
    setEditor(data.page);
    const next: Record<string, SiteContentValue> = {};
    for (const field of data.page.fields) next[field.slot.id] = field.value;
    setValues(next);
    setError("");
    setStatus("idle");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      await loadList();
      if (selectedPath && !cancelled) await loadEditor(selectedPath);
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [loadEditor, loadList, selectedPath]);

  function updateValue(id: string, value: SiteContentValue) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setStatus("idle");
  }

  async function save() {
    if (!editor) return;
    setStatus("saving");
    setError("");
    const res = await fetch("/api/site/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: editor.path, values }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setStatus("error");
      setError(data.error || "No se pudo guardar.");
      return;
    }
    setStatus("saved");
  }

  async function restoreDefaults() {
    if (!editor) return;
    const empty: Record<string, SiteContentValue> = {};
    setStatus("saving");
    const res = await fetch("/api/site/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: editor.path, values: empty }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setStatus("error");
      setError(data.error || "No se pudo restaurar.");
      return;
    }
    await loadEditor(editor.path);
    setStatus("saved");
  }

  const selectedLabel = useMemo(
    () => pages.find((page) => page.path === selectedPath)?.navLabel ?? editor?.navLabel,
    [editor?.navLabel, pages, selectedPath]
  );

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/config" },
        { label: "Páginas", href: "/admin/site/pages" },
        ...(selectedLabel ? [{ label: selectedLabel }] : []),
      ]}
      title={editor ? editor.navLabel : "Contenido del sitio"}
      description={
        editor
          ? "Solo cambie imágenes o textos de este sitio. El diseño sigue en código."
          : "Los sitios públicos viven en su dominio. Aquí se edita teléfono, correo, redes e imágenes; el diseño se cambia en código."
      }
      actions={
        editor ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/site/pages")}>
              Todas las páginas
            </Button>
            <Button type="button" variant="outline" onClick={() => void restoreDefaults()}>
              Restaurar original
            </Button>
            <Button type="button" onClick={() => void save()} disabled={status === "saving"}>
              {status === "saving" ? "Guardando…" : status === "saved" ? "Guardado" : "Guardar"}
            </Button>
          </div>
        ) : (
          <Link href="/admin/config">
            <Button type="button" variant="outline">
              Publicar sitio
            </Button>
          </Link>
        )
      }
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_30%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando contenido…</p>
      ) : editor ? (
        editor.fields.length === 0 ? (
          <p className="rounded-2xl border border-border bg-background px-5 py-8 text-sm text-muted">
            Esta página no tiene campos editables. El diseño está en código.
          </p>
        ) : (
          <div className="space-y-5">
            {editor.fields.map((field) => {
              const value = values[field.slot.id] ?? field.value;
              if (field.slot.type === "text") {
                const current = value.type === "text" ? value.value : field.slot.default;
                if (field.slot.multiline) {
                  return (
                    <Textarea
                      key={field.slot.id}
                      label={field.slot.label}
                      helper={field.slot.description}
                      value={current}
                      onChange={(event) =>
                        updateValue(field.slot.id, { type: "text", value: event.target.value })
                      }
                    />
                  );
                }
                return (
                  <Input
                    key={field.slot.id}
                    label={field.slot.label}
                    helper={field.slot.description}
                    value={current}
                    onChange={(event) =>
                      updateValue(field.slot.id, { type: "text", value: event.target.value })
                    }
                  />
                );
              }
              if (field.slot.type === "image") {
                const image = value.type === "image" ? value : { type: "image" as const, ...field.slot.default };
                return (
                  <MediaField
                    key={field.slot.id}
                    label={field.slot.label}
                    description={field.slot.description}
                    tenant={tenantId}
                    folder="Hero"
                    value={image.mediaId || image.src}
                    onChange={(mediaId) =>
                      updateValue(field.slot.id, { ...image, type: "image", mediaId })
                    }
                    onAssetChange={(asset) => {
                      if (!asset) return;
                      updateValue(field.slot.id, {
                        type: "image",
                        mediaId: asset._id,
                        src: asset.url,
                        alt: asset.alt || asset.title || image.alt,
                      });
                    }}
                  />
                );
              }
              const enabled = value.type === "animation" ? value.enabled : field.slot.default;
              return (
                <Switch
                  key={field.slot.id}
                  label={field.slot.label}
                  description={field.slot.description}
                  checked={enabled}
                  onChange={(checked) =>
                    updateValue(field.slot.id, { type: "animation", enabled: checked })
                  }
                />
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <ConnectedSiteHub tenantId={tenantId} />
          {pages.length > 0 ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Imágenes de este sitio
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
                {pages.map((page) => (
                  <li key={page.path}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-background-muted"
                      onClick={() =>
                        router.push(`/admin/site/pages?path=${encodeURIComponent(page.path)}`)
                      }
                    >
                      <span>
                        <span className="block text-sm font-semibold text-foreground">
                          {page.navLabel}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{page.path}</span>
                      </span>
                      <span className="text-xs text-muted">
                        {page.slotCount > 0
                          ? `${page.slotCount} ${page.slotCount === 1 ? "campo" : "campos"}`
                          : "Solo código"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </AdminModulePage>
  );
}
