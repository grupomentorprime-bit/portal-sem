import { Container, Section } from "@/components/layout";
import { markdownToHtml } from "@/lib/cms/sanitize";
import { asString } from "@/lib/cms/block-utils";

interface MarkdownBlockProps {
  settings: Record<string, unknown>;
}

export function MarkdownBlock({ settings }: MarkdownBlockProps) {
  const content = asString(settings.content);
  if (!content) return null;

  return (
    <Section padding="lg">
      <Container>
        <div
          className="prose prose-sm max-w-none text-body text-foreground"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
        />
      </Container>
    </Section>
  );
}
