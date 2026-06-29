import { Container, Section, Stack } from "@/components/layout";
import { SectionTitle } from "@/components/institutional";
import { cn } from "@/lib/utils";
import { asString } from "@/lib/cms/block-utils";

interface TextSectionProps {
  settings: Record<string, unknown>;
}

export function TextSection({ settings }: TextSectionProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const body = asString(settings.body);
  const align = asString(settings.align, "left") as "left" | "center";

  if (!title && !body) return null;

  return (
    <Section padding="lg">
      <Container>
        <Stack gap={6} align={align === "center" ? "center" : "start"}>
          {(overline || title) && (
            <SectionTitle
              overline={overline || undefined}
              title={title || " "}
              align={align}
            />
          )}
          {body ? (
            <div
              className={cn(
                "max-w-3xl text-body text-muted whitespace-pre-line",
                align === "center" && "text-center"
              )}
            >
              {body}
            </div>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
