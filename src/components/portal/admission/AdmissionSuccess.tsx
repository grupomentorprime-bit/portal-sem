import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { iconSizes } from "@/design";
import { PortalContainer, PortalCTA, PortalSection } from "@/components/portal/layout";
import type { AdmissionSuccessContent } from "@/types/admission";
import { ADMISSION_SUCCESS_CONTENT } from "@/lib/portal/admission-content";

interface AdmissionSuccessProps {
  content?: AdmissionSuccessContent;
}

export function AdmissionSuccess({ content = ADMISSION_SUCCESS_CONTENT }: AdmissionSuccessProps) {
  return (
    <PortalSection padding="lg" id="postulacion-enviada" className="admission-success">
      <PortalContainer size="sm" className="text-center">
        <span
          className="admission-success__icon mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"
          aria-hidden
        >
          <CheckCircle2 size={iconSizes.xl} strokeWidth={1.75} />
        </span>
        <h1 className="text-display-m font-semibold text-foreground">{content.title}</h1>
        <p className="mt-3 text-heading text-secondary">{content.lead}</p>
        <p className="mt-4 text-body text-muted">{content.body}</p>
        <p className="mt-4 text-body text-muted">{content.invitation}</p>

        <ul className="mt-10 flex flex-col gap-3 sm:items-center" role="list">
          {content.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex items-center gap-2 text-body font-medium text-secondary hover:text-primary"
              >
                {link.label}
                <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </PortalContainer>

      {content.ctaTitle && content.ctaLinks && content.ctaLinks.length > 0 ? (
        <PortalContainer size="md" className="mt-16">
          <PortalCTA
            title={content.ctaTitle}
            description=""
            primaryLabel={content.ctaLinks[0]?.label ?? ""}
            primaryHref={content.ctaLinks[0]?.href ?? "/"}
            secondaryLabel={content.ctaLinks[1]?.label}
            secondaryHref={content.ctaLinks[1]?.href}
            variant="default"
          />
        </PortalContainer>
      ) : null}
    </PortalSection>
  );
}
