import { InstitutionalImage } from "@/components/portal/media/InstitutionalImage";
import { PortalContainer } from "@/components/portal/layout";
import type {
  AdmissionClosingActionsData,
  AdmissionClosingMessageData,
} from "@/types/admission-closing";
import { ClosingActions } from "./ClosingActions";
import { ClosingMediaImage } from "./ClosingMediaImage";
import { ClosingMessage } from "./ClosingMessage";

interface ClosingHeroBandProps {
  tenant: string;
  message: AdmissionClosingMessageData;
  actions: AdmissionClosingActionsData;
}

export async function ClosingHeroBand({ tenant, message, actions }: ClosingHeroBandProps) {
  const hasMessage =
    message.title.trim() || message.subtitle.trim() || message.description.trim();
  const hasActions = actions.items.some((item) => item.visible && item.label.trim());

  if (!hasMessage && !hasActions) return null;

  return (
    <section className="admission-closing__hero-band" aria-label="Mensaje institucional">
      <div className="admission-closing__hero-grid">
        <div className="admission-closing__hero-copy">
          <div className="admission-closing__hero-copy-bg" aria-hidden />
          <PortalContainer size="md" className="admission-closing__hero-copy-inner">
            {hasMessage ? <ClosingMessage data={message} variant="split" /> : null}
            {hasActions ? <ClosingActions items={actions.items} layout="hero" /> : null}
          </PortalContainer>
        </div>

        <div className="admission-closing__hero-media">
          <div className="admission-closing__hero-media-frame">
            {message.mediaId ? (
              <ClosingMediaImage
                tenant={tenant}
                mediaId={message.mediaId}
                alt=""
                className="admission-closing__hero-image absolute inset-0 h-full w-full"
              />
            ) : (
              <InstitutionalImage
                assetId="hero-ministerial-call"
                alt="Seminario Eclesiástico Mayor"
                variant="hero"
                className="admission-closing__hero-image absolute inset-0 h-full w-full"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
