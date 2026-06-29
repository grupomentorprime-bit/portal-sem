import { Container, Grid, Section } from "@/components/layout";
import { SectionTitle, VerseBlock } from "@/components/institutional";
import { asBoolean, asString } from "@/lib/cms/block-utils";

interface InstitutionPresentationProps {
  settings: Record<string, unknown>;
}

export function InstitutionPresentation({ settings }: InstitutionPresentationProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const description = asString(settings.description);
  const showVerse = asBoolean(settings.showVerse, true);
  const verseText = asString(settings.verseText);
  const verseReference = asString(settings.verseReference);

  return (
    <Section id="presentacion" padding="lg">
      <Container>
        <Grid cols={1} lgCols={2} gap={8} className="items-center">
          <SectionTitle
            overline={overline || undefined}
            title={title || "Presentación"}
            description={description || undefined}
          />
          {showVerse && verseText ? (
            <VerseBlock text={verseText} reference={verseReference} />
          ) : null}
        </Grid>
      </Container>
    </Section>
  );
}
