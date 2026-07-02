/**
 * @deprecated
 *
 * Reemplazado por:
 * GenericContentBlockSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { Container, Section } from "@/components/layout";
import { sanitizeHtml } from "@/lib/cms/sanitize";
import { asString } from "@/lib/cms/block-utils";

interface HtmlBlockProps {
  settings: Record<string, unknown>;
}

export function HtmlBlock({ settings }: HtmlBlockProps) {
  const content = sanitizeHtml(asString(settings.content));
  if (!content) return null;

  return (
    <Section padding="lg">
      <Container>
        <div
          className="prose prose-sm max-w-none text-body text-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Container>
    </Section>
  );
}
