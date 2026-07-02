import { PortalContainer } from "@/components/portal/layout";
import type { AdmissionClosingConfig } from "@/types/admission-closing";
import { sortClosingBlocks } from "@/lib/portal/admission-closing-utils";
import { ClosingBackgroundOverlay, buildClosingBackgroundStyle } from "./closing/ClosingBackground";
import { ClosingBenefits } from "./closing/ClosingBenefits";
import { ClosingContact } from "./closing/ClosingContact";
import { ClosingCopyright } from "./closing/ClosingCopyright";
import { ClosingFinalCta } from "./closing/ClosingFinalCta";
import { ClosingFooter } from "./closing/ClosingFooter";
import { ClosingHeroBand } from "./closing/ClosingHeroBand";
import { ClosingIndicators } from "./closing/ClosingIndicators";
import { ClosingQuotes } from "./closing/ClosingQuotes";
import { ClosingSeal } from "./closing/ClosingSeal";

interface AdmissionClosingProps {
  tenant: string;
  closing: AdmissionClosingConfig;
}

function findBlock<T extends AdmissionClosingConfig["blocks"][number]["type"]>(
  blocks: AdmissionClosingConfig["blocks"],
  type: T
) {
  return blocks.find((block) => block.type === type && block.enabled);
}

export async function AdmissionClosing({ tenant, closing }: AdmissionClosingProps) {
  if (!closing.enabled) return null;

  const blocks = sortClosingBlocks(closing.blocks).filter((block) => block.enabled);
  if (blocks.length === 0) return null;

  const messageBlock = findBlock(blocks, "message");
  const actionsBlock = findBlock(blocks, "actions");
  const indicatorsBlock = findBlock(blocks, "indicators");
  const quoteBlock = findBlock(blocks, "quote");
  const contactBlock = findBlock(blocks, "contact");
  const footerBlock = findBlock(blocks, "footer");
  const backdropBlock = findBlock(blocks, "backdrop");
  const sealBlock = findBlock(blocks, "seal");
  const copyrightBlock = findBlock(blocks, "copyright");
  const benefitsBlock = findBlock(blocks, "benefits");
  const finalCtaBlock = findBlock(blocks, "final_cta");

  const { className: editorialBgClass, style: editorialBgStyle } = await buildClosingBackgroundStyle(
    tenant,
    backdropBlock?.type === "backdrop" ? backdropBlock.data : undefined
  );

  const sealLines = sealBlock?.type === "seal" ? sealBlock.data.lines : [];

  return (
    <section id="cierre-institucional" className="admission-closing">
      {messageBlock?.type === "message" || actionsBlock?.type === "actions" ? (
        <ClosingHeroBand
          tenant={tenant}
          message={
            messageBlock?.type === "message"
              ? messageBlock.data
              : {
                  eyebrow: "",
                  title: "",
                  subtitle: "",
                  description: "",
                  overlay: 0,
                  alignment: "left",
                }
          }
          actions={
            actionsBlock?.type === "actions" ? actionsBlock.data : { items: [] }
          }
        />
      ) : null}

      {indicatorsBlock?.type === "indicators" || quoteBlock?.type === "quote" ? (
        <div className="admission-closing__zone admission-closing__zone--light">
          <PortalContainer size="lg" className="admission-closing__zone-inner">
            {indicatorsBlock?.type === "indicators" ? (
              <ClosingIndicators items={indicatorsBlock.data.items} />
            ) : null}
            {quoteBlock?.type === "quote" ? (
              <ClosingQuotes items={quoteBlock.data.items} />
            ) : null}
          </PortalContainer>
        </div>
      ) : null}

      {contactBlock?.type === "contact" ? (
        <div className="admission-closing__zone admission-closing__zone--contact">
          <PortalContainer size="lg" className="admission-closing__zone-inner">
            <ClosingContact data={contactBlock.data} />
          </PortalContainer>
        </div>
      ) : null}

      {footerBlock?.type === "footer" ||
      sealBlock?.type === "seal" ||
      copyrightBlock?.type === "copyright" ? (
        <div className="admission-closing__zone admission-closing__zone--editorial">
          <div className={editorialBgClass} style={editorialBgStyle} aria-hidden />
          {backdropBlock?.type === "backdrop" ? (
            <ClosingBackgroundOverlay overlay={backdropBlock.data.overlay} />
          ) : null}
          {sealBlock?.type === "seal" ? <ClosingSeal data={sealBlock.data} /> : null}
          <PortalContainer size="lg" className="admission-closing__editorial-content">
            {footerBlock?.type === "footer" ? (
              <ClosingFooter data={footerBlock.data} />
            ) : null}
            {copyrightBlock?.type === "copyright" ? (
              <ClosingCopyright data={copyrightBlock.data} sealLines={sealLines} />
            ) : null}
          </PortalContainer>
        </div>
      ) : null}

      {benefitsBlock?.type === "benefits" ? (
        <div className="admission-closing__zone admission-closing__zone--benefits">
          <PortalContainer size="lg" className="admission-closing__zone-inner">
            <ClosingBenefits items={benefitsBlock.data.items} />
          </PortalContainer>
        </div>
      ) : null}

      {finalCtaBlock?.type === "final_cta" ? (
        <div className="admission-closing__zone admission-closing__zone--final-cta">
          <PortalContainer size="lg" className="admission-closing__zone-inner">
            <ClosingFinalCta data={finalCtaBlock.data} />
          </PortalContainer>
        </div>
      ) : null}
    </section>
  );
}
