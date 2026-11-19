"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NetworkTile, type NetworkId } from "@/components/brand/NetworkMark";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { BrandingPanel } from "@/components/config/BrandingPanel";
import { ContactForm } from "@/components/config/ContactForm";
import { InstitutionForm } from "@/components/config/InstitutionForm";
import { SocialLinksForm } from "@/components/config/SocialLinksForm";
import {
  displayValue,
  empresaBlockDirty,
  empresaBlockPatch,
  presenceBlocks,
  presenceConfigPatch,
  type EmpresaBlockId,
} from "@/lib/desktop/presence-patch";
import type { SpacePresencePanelId } from "@/lib/desktop/space-settings";
import { chileRegionForCity, isChileCountry } from "@/lib/geo/chile-locations";
import type { SiteConfig, SocialLinks } from "@/types/cms";

const SOCIAL_ROWS: { key: keyof SocialLinks; label: string; network: NetworkId }[] = [
  { key: "facebook", label: "Facebook", network: "facebook" },
  { key: "instagram", label: "Instagram", network: "instagram" },
  { key: "youtube", label: "YouTube", network: "youtube" },
  { key: "linkedin", label: "LinkedIn", network: "linkedin" },
  { key: "tiktok", label: "TikTok", network: "tiktok" },
  { key: "spotify", label: "Spotify", network: "spotify" },
];

const GROWTH_NETWORKS: {
  id: NetworkId;
  label: string;
  text: string;
  href?: string;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    text: "Canal activo. Se autoriza con Meta.",
    href: "/admin/settings/channels",
  },
  {
    id: "instagram",
    label: "Instagram",
    text: "Se autoriza con la página de Facebook.",
    href: "/admin/settings/channels#instagram",
  },
  {
    id: "facebook",
    label: "Facebook",
    text: "Messenger de la misma página.",
    href: "/admin/settings/channels#instagram",
  },
  {
    id: "chat",
    label: "Chat del sitio",
    text: "Atención en el portal. Aún sin conector.",
  },
  {
    id: "email",
    label: "Correo",
    text: "Bandeja de atención. Aún sin conector.",
  },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

const COPY: Record<SpacePresencePanelId, { title: string; lead: string }> = {
  empresa: {
    title: "Mi empresa",
    lead: "Consulta primero. Edita solo el bloque que necesitas cambiar.",
  },
  marca: {
    title: "Marca",
    lead: "Identidad visual de la organización. Misma ficha del Espacio.",
  },
  sitio: {
    title: "Sitio web",
    lead: "Presencia pública de este Espacio. Se administra con la aplicación del plan.",
  },
  canales: {
    title: "Canales",
    lead: "Contactos y redes con los que se atiende en este Espacio.",
  },
};

const SITE_LINKS = [
  {
    href: "/admin/site/domain",
    label: "Dominio",
    text: "Dirección con la que las personas encuentran el sitio.",
  },
  {
    href: "/admin/portal/forms",
    label: "Formularios",
    text: "Captación y experiencias públicas del sitio.",
  },
] as const;

function ReadRow({
  label,
  value,
  network,
}: {
  label: string;
  value: string;
  network?: NetworkId;
}) {
  return (
    <div className="cfg-read-row">
      <dt>
        {network ? (
          <NetworkTile id={network} className="h-[22px] w-[22px] rounded-[7px]" />
        ) : null}
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

export function DesktopSpacePresence({
  panel,
  onDirtyChange,
  growthOs = false,
  canConnectChannels = false,
}: {
  panel: SpacePresencePanelId;
  onDirtyChange?: (dirty: boolean) => void;
  /** El plan del Espacio incluye Growth OS. */
  growthOs?: boolean;
  /** Quien mira puede abrir la conexión de canales. */
  canConnectChannels?: boolean;
}) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [baseline, setBaseline] = useState<SiteConfig | null>(null);
  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const [editingBlock, setEditingBlock] = useState<EmpresaBlockId | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [blockMessage, setBlockMessage] = useState("");
  const copy = COPY[panel];
  const blocks = presenceBlocks(panel);
  const canEditEmpresa = blocks.length > 0;
  const canEditMarca = panel === "marca";

  useEffect(() => {
    let cancelled = false;
    setConfig(null);
    setBaseline(null);
    setDraft(null);
    setEditingBlock(null);
    setLoadError("");
    setSaveStatus("idle");
    setSaveError("");
    setBlockMessage("");
    void (async () => {
      const response = await fetch("/api/cms/config").catch(() => null);
      const body = (await response?.json().catch(() => null)) as {
        ok?: boolean;
        config?: SiteConfig;
        error?: string;
      } | null;
      if (cancelled) return;
      if (!response?.ok || !body?.ok || !body.config) {
        setLoadError(body?.error || "No se pudo cargar la ficha del Espacio.");
        return;
      }
      setConfig(body.config);
      setBaseline(body.config);
    })();
    return () => {
      cancelled = true;
    };
  }, [panel]);

  const marcaDirty = useMemo(
    () => Boolean(config && baseline && canEditMarca && JSON.stringify(config) !== JSON.stringify(baseline)),
    [baseline, canEditMarca, config]
  );

  const blockDirty = useMemo(
    () =>
      Boolean(
        canEditEmpresa &&
          editingBlock &&
          baseline &&
          draft &&
          empresaBlockDirty(editingBlock, baseline, draft)
      ),
    [baseline, canEditEmpresa, draft, editingBlock]
  );

  const isDirty = canEditEmpresa ? blockDirty : marcaDirty;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = window.setTimeout(() => setSaveStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    if (!blockMessage) return;
    const timer = window.setTimeout(() => setBlockMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [blockMessage]);

  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const beginEdit = useCallback(
    (block: EmpresaBlockId) => {
      if (!config || !baseline) return;
      if (editingBlock && blockDirty) {
        const leave = window.confirm(
          "Hay cambios sin guardar en este bloque. ¿Descartarlos?"
        );
        if (!leave) return;
      }
      setDraft(config);
      setEditingBlock(block);
      setSaveError("");
      setBlockMessage("");
      setSaveStatus("idle");
    },
    [baseline, blockDirty, config, editingBlock]
  );

  const cancelEdit = useCallback(() => {
    if (blockDirty) {
      const leave = window.confirm("¿Descartar los cambios de este bloque?");
      if (!leave) return;
    }
    setDraft(null);
    setEditingBlock(null);
    setSaveError("");
    setSaveStatus("idle");
  }, [blockDirty]);

  const saveBlock = useCallback(async () => {
    if (!canEditEmpresa || !editingBlock || !baseline || !draft) return;
    const patch = empresaBlockPatch(editingBlock, baseline, draft);
    if (Object.keys(patch).length === 0) {
      setDraft(null);
      setEditingBlock(null);
      return;
    }
    setSaveStatus("saving");
    setSaveError("");
    const response = await fetch("/api/cms/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      config?: SiteConfig;
      error?: string;
      errors?: Array<{ message?: string }>;
    } | null;
    if (!response?.ok || !body?.ok || !body.config) {
      const message =
        body?.errors?.map((item) => item.message).filter(Boolean).join(" ") ||
        body?.error ||
        "No se pudo guardar.";
      setSaveError(message);
      setSaveStatus("error");
      return;
    }
    setConfig(body.config);
    setBaseline(body.config);
    setDraft(null);
    setEditingBlock(null);
    setSaveStatus("saved");
    setBlockMessage("Cambios guardados.");
  }, [baseline, canEditEmpresa, draft, editingBlock]);

  const handleMarcaSave = useCallback(async () => {
    if (!canEditMarca || !config || !baseline) return;
    const patch = presenceConfigPatch(panel, baseline, config);
    if (Object.keys(patch).length === 0) return;
    setSaveStatus("saving");
    setSaveError("");
    const response = await fetch("/api/cms/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      config?: SiteConfig;
      error?: string;
      errors?: Array<{ message?: string }>;
    } | null;
    if (!response?.ok || !body?.ok || !body.config) {
      const message =
        body?.errors?.map((item) => item.message).filter(Boolean).join(" ") ||
        body?.error ||
        "No se pudo guardar.";
      setSaveError(message);
      setSaveStatus("error");
      return;
    }
    setConfig(body.config);
    setBaseline(body.config);
    setSaveStatus("saved");
  }, [baseline, canEditMarca, config, panel]);

  return (
    <div className="space-presence">
      <div className={`space-presence-bar${canEditMarca ? "" : " is-readonly"}`}>
        <div>
          <h3>{copy.title}</h3>
          <p>{copy.lead}</p>
        </div>
        {canEditMarca ? (
          <button
            type="button"
            className="primary"
            disabled={!config || !marcaDirty || saveStatus === "saving"}
            onClick={() => void handleMarcaSave()}
          >
            {saveStatus === "saving"
              ? "Guardando…"
              : saveStatus === "saved"
                ? "Guardado"
                : "Guardar"}
          </button>
        ) : null}
      </div>

      {loadError ? <p className="form-error" role="alert">{loadError}</p> : null}
      {saveError ? <p className="form-error" role="alert">{saveError}</p> : null}
      {blockMessage ? <p className="form-ok" role="status">{blockMessage}</p> : null}
      {!config && !loadError ? <p className="ajustes-wait">Cargando ficha…</p> : null}

      {config && canEditEmpresa ? (
        <div className="cfg-blocks" role="list">
          {blocks.map((block) => {
            const isEditing = editingBlock === block.id;
            const source = isEditing && draft ? draft : config;
            return (
              <section
                key={block.id}
                className={`cfg-block${isEditing ? " is-editing" : ""}`}
                role="listitem"
                aria-labelledby={`empresa-block-${block.id}`}
              >
                <header className="cfg-block-head">
                  <div>
                    <h4 id={`empresa-block-${block.id}`}>{block.title}</h4>
                    <p>{block.lead}</p>
                  </div>
                  {isEditing ? (
                    <div className="cfg-block-actions">
                      <button type="button" className="ghost" aria-label={`Cancelar ${block.title}`} onClick={cancelEdit}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="primary"
                        disabled={!blockDirty || saveStatus === "saving"}
                        aria-label={`Guardar ${block.title}`}
                        onClick={() => void saveBlock()}
                      >
                        {saveStatus === "saving" && editingBlock === block.id
                          ? "Guardando…"
                          : "Guardar"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="ghost"
                      disabled={Boolean(editingBlock)}
                      aria-label={`Editar ${block.title}`}
                      onClick={() => beginEdit(block.id)}
                    >
                      Editar
                    </button>
                  )}
                </header>

                {isEditing ? (
                  <div className="cfg-block-edit">
                    {block.id === "general" ? (
                      <InstitutionForm
                        value={source.institution}
                        showTenant={false}
                        framed={false}
                        onChange={(institution) => {
                          setDraft((prev) => (prev ? { ...prev, institution } : prev));
                          setSaveStatus("idle");
                        }}
                      />
                    ) : null}
                    {block.id === "contacto" ? (
                      <ContactForm
                        value={source.contact}
                        scope="contact"
                        framed={false}
                        onChange={(contact) => {
                          setDraft((prev) => (prev ? { ...prev, contact } : prev));
                          setSaveStatus("idle");
                        }}
                      />
                    ) : null}
                    {block.id === "ubicacion" ? (
                      <ContactForm
                        value={source.contact}
                        scope="location"
                        framed={false}
                        onChange={(contact) => {
                          setDraft((prev) => (prev ? { ...prev, contact } : prev));
                          setSaveStatus("idle");
                        }}
                      />
                    ) : null}
                    {block.id === "redes" ? (
                      <SocialLinksForm
                        value={source.social}
                        framed={false}
                        onChange={(social) => {
                          setDraft((prev) => (prev ? { ...prev, social } : prev));
                          setSaveStatus("idle");
                        }}
                      />
                    ) : null}
                  </div>
                ) : (
                  <dl className="cfg-read">
                    {block.id === "general" ? (
                      <>
                        <ReadRow label="Nombre" value={displayValue(source.institution.name)} />
                        <ReadRow
                          label="Nombre corto"
                          value={displayValue(source.institution.shortName)}
                        />
                        <ReadRow
                          label="Organización"
                          value={displayValue(source.institution.organization)}
                        />
                        <ReadRow
                          label="Sitio web"
                          value={displayValue(source.institution.website)}
                        />
                        <ReadRow
                          label="Lema"
                          value={displayValue(source.institution.tagline)}
                        />
                      </>
                    ) : null}
                    {block.id === "contacto" ? (
                      <>
                        <ReadRow label="Email" value={displayValue(source.contact.email)} />
                        <ReadRow label="Teléfono" value={displayValue(source.contact.phone)} />
                        <ReadRow
                          label="WhatsApp"
                          value={displayValue(source.contact.whatsapp)}
                        />
                        <ReadRow
                          label="Horario"
                          value={displayValue(source.contact.hours)}
                        />
                      </>
                    ) : null}
                    {block.id === "redes" ? (
                      <>
                        {SOCIAL_ROWS.map((row) => (
                          <ReadRow
                            key={row.key}
                            label={row.label}
                            network={row.network}
                            value={displayValue(source.social[row.key])}
                          />
                        ))}
                      </>
                    ) : null}
                    {block.id === "ubicacion" ? (
                      <>
                        <ReadRow
                          label="Dirección"
                          value={displayValue(source.contact.address)}
                        />
                        <ReadRow
                          label="Región"
                          value={displayValue(
                            source.contact.region ||
                              (isChileCountry(source.contact.country)
                                ? chileRegionForCity(source.contact.city)
                                : "")
                          )}
                        />
                        <ReadRow label="Ciudad" value={displayValue(source.contact.city)} />
                        <ReadRow label="País" value={displayValue(source.contact.country)} />
                      </>
                    ) : null}
                  </dl>
                )}
              </section>
            );
          })}
        </div>
      ) : null}

      {panel === "canales" && growthOs ? (
        <div className="space-presence-forms">
          <div className="space-site-card">
            <p className="space-site-kicker">{PLATFORM_DISPLAY_NAME}</p>
            <strong>Conectar las redes</strong>
            <p>
              WhatsApp, Instagram y Facebook se autorizan en {PLATFORM_DISPLAY_NAME}. El chat
              del sitio y el correo todavía no tienen conector.
            </p>
          </div>
          {canConnectChannels ? (
            <ul className="space-site-links">
              {GROWTH_NETWORKS.map((item) => (
                <li key={item.id}>
                  {item.href ? (
                    <a href={item.href} className="space-row is-network">
                      <NetworkTile id={item.id} className="h-9 w-9 rounded-[11px]" />
                      <span className="space-copy">
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </span>
                      <span className="space-go" aria-hidden="true">
                        →
                      </span>
                    </a>
                  ) : (
                    <div className="space-row is-network is-soon" aria-disabled="true">
                      <NetworkTile id={item.id} className="h-9 w-9 rounded-[11px]" />
                      <span className="space-copy">
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ajustes-wait">
              Hace falta permiso de integraciones para abrir esa conexión.
            </p>
          )}
        </div>
      ) : null}

      {config && panel === "marca" ? (
        <div className="space-presence-forms">
          <BrandingPanel
            value={config.branding}
            onChange={(branding) => {
              setConfig((prev) => (prev ? { ...prev, branding } : prev));
              setSaveStatus("idle");
            }}
            heroPortal={config.heroPortal}
            onHeroPortalChange={(heroPortal) => {
              setConfig((prev) => (prev ? { ...prev, heroPortal } : prev));
              setSaveStatus("idle");
            }}
            tenant={config.institution.tenant}
            includePortalHero={false}
          />
        </div>
      ) : null}

      {config && panel === "sitio" ? (
        <div className="space-presence-forms">
          <div className="space-site-card">
            <p className="space-site-kicker">Estado</p>
            <strong>{config.sitePublished ? "Publicado" : "No publicado"}</strong>
            <p>
              {config.institution.website?.trim()
                ? config.institution.website.trim()
                : "Sin dirección web registrada en la ficha del Espacio."}
            </p>
          </div>
          <ul className="space-site-links">
            {SITE_LINKS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="space-row">
                  <span className="space-copy">
                    <strong>{item.label}</strong>
                    <span>{item.text}</span>
                  </span>
                  <span className="space-go" aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="ajustes-wait">
            Dominio, formularios y publicación siguen en la aplicación del plan. Aquí no se duplica
            esa administración.
          </p>
        </div>
      ) : null}
    </div>
  );
}
