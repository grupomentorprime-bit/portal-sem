import { Container, Grid, Section, Stack } from "@/components/layout";
import { ProgramCard, SectionTitle } from "@/components/institutional";
import { Button } from "@/components/ui";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import {
  asBoolean,
  asString,
  resolveBlockIcon,
  type ProgramItemSettings,
} from "@/lib/cms/block-utils";

interface ProgramsGridProps {
  settings: Record<string, unknown>;
}

export function ProgramsGrid({ settings }: ProgramsGridProps) {
  const items = getResolvedItems<ProgramItemSettings>(settings);
  const limit = getQueryLimit(settings, items.length);
  const visible = items.slice(0, limit).map((item) => ({
    ...item,
    icon: resolveBlockIcon(item.icon),
  }));

  if (visible.length === 0) return null;

  return (
    <Section id="programas" padding="lg" muted>
      <Container>
        <Stack gap={12}>
          <SectionTitle
            overline={asString(settings.overline) || undefined}
            title={asString(settings.title, "Programas")}
            description={asString(settings.description) || undefined}
            align="center"
            className="mx-auto"
          />
          <Grid cols={1} mdCols={2} lgCols={3} gap={6}>
            {visible.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </Grid>
          {asBoolean(settings.showButton, true) ? (
            <div className="text-center">
              <Button href={asString(settings.buttonHref, "/programas")} variant="outline" size="lg">
                {asString(settings.buttonLabel, "Ver todos los programas")}
              </Button>
            </div>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
