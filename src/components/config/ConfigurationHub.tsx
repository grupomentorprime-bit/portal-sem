"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandingPanel } from "@/components/config/BrandingPanel";
import { ConfigurationLayout } from "@/components/config/ConfigurationLayout";
import { ContactForm } from "@/components/config/ContactForm";
import { FeatureTogglePanel } from "@/components/config/FeatureTogglePanel";
import { InstitutionForm } from "@/components/config/InstitutionForm";
import { PortalCopyForm } from "@/components/config/PortalCopyForm";
import { PortalCursorForm } from "@/components/config/PortalCursorForm";
import { PortalTopBarForm } from "@/components/config/PortalTopBarForm";
import { PortalStatusCard } from "@/components/config/PortalStatusCard";
import { SeoEditor } from "@/components/config/SeoEditor";
import { SocialLinksForm } from "@/components/config/SocialLinksForm";
import type { ConfigSectionId, SiteConfig, SiteConfigUpdate } from "@/types/cms";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ConfigurationHubProps {
  initialConfig: SiteConfig;
}

function toUpdate(config: SiteConfig): SiteConfigUpdate {
  return {
    schemaVersion: config.schemaVersion,
    modules: config.modules,
    institution: config.institution,
    branding: config.branding,
    heroPortal: config.heroPortal,
    seo: config.seo,
    contact: config.contact,
    social: config.social,
    features: config.features,
    portalCopy: config.portalCopy,
    topBar: config.topBar,
    portalExperience: config.portalExperience,
  };
}

export function ConfigurationHub({ initialConfig }: ConfigurationHubProps) {
  const [config, setConfig] = useState(initialConfig);
  const [baseline, setBaseline] = useState(initialConfig);
  const [activeSection, setActiveSection] = useState<ConfigSectionId>("general");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(baseline),
    [config, baseline]
  );

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/cms/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toUpdate(config)),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const message =
          data.errors?.map((e: { message: string }) => e.message).join(" ") ||
          data.error ||
          "No se pudo guardar la configuración.";
        setErrorMessage(message);
        setSaveStatus("error");
        return;
      }

      setConfig(data.config);
      setBaseline(data.config);
      setSaveStatus("saved");
    } catch {
      setErrorMessage("Error de red al guardar la configuración.");
      setSaveStatus("error");
    }
  }, [config]);

  const updateInstitution = (institution: SiteConfig["institution"]) => {
    setConfig((prev) => ({ ...prev, institution }));
    setSaveStatus("idle");
  };

  return (
    <ConfigurationLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      saveStatus={saveStatus}
      isDirty={isDirty}
      onSave={handleSave}
    >
      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </div>
      ) : null}

      {activeSection === "general" ? (
        <>
          <InstitutionForm value={config.institution} onChange={updateInstitution} />
          <div className="mt-6">
            <PortalCopyForm
              value={config.portalCopy}
              onChange={(portalCopy) => setConfig((prev) => ({ ...prev, portalCopy }))}
            />
          </div>
        </>
      ) : null}

      {activeSection === "branding" ? (
        <BrandingPanel
          value={config.branding}
          onChange={(branding) => setConfig((prev) => ({ ...prev, branding }))}
          heroPortal={config.heroPortal}
          onHeroPortalChange={(heroPortal) => setConfig((prev) => ({ ...prev, heroPortal }))}
          tenant={config.institution.tenant}
        />
      ) : null}

      {activeSection === "seo" ? (
        <SeoEditor
          value={config.seo}
          onChange={(seo) => setConfig((prev) => ({ ...prev, seo }))}
        />
      ) : null}

      {activeSection === "contact" ? (
        <>
          <ContactForm
            value={config.contact}
            onChange={(contact) => setConfig((prev) => ({ ...prev, contact }))}
          />
          <div className="mt-6">
            <PortalTopBarForm
              value={config.topBar}
              onChange={(topBar) => setConfig((prev) => ({ ...prev, topBar }))}
            />
          </div>
        </>
      ) : null}

      {activeSection === "social" ? (
        <SocialLinksForm
          value={config.social}
          onChange={(social) => setConfig((prev) => ({ ...prev, social }))}
        />
      ) : null}

      {activeSection === "features" ? (
        <FeatureTogglePanel
          value={config.features}
          onChange={(features) => setConfig((prev) => ({ ...prev, features }))}
        />
      ) : null}

      {activeSection === "experience" ? (
        <PortalCursorForm
          value={config.portalExperience.cursor}
          onChange={(cursor) =>
            setConfig((prev) => ({
              ...prev,
              portalExperience: { ...prev.portalExperience, cursor },
            }))
          }
        />
      ) : null}

      {activeSection === "status" ? (
        <PortalStatusCard
          institution={config.institution}
          config={config}
          onStatusChange={(status) =>
            updateInstitution({ ...config.institution, status })
          }
        />
      ) : null}
    </ConfigurationLayout>
  );
}
