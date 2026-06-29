import { Container, Grid, Section, Stack } from "@/components/layout";
import { SectionTitle, TeacherCard } from "@/components/institutional";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { asString, type TeacherItemSettings } from "@/lib/cms/block-utils";

interface TeachersGridProps {
  settings: Record<string, unknown>;
}

export function TeachersGrid({ settings }: TeachersGridProps) {
  const items = getResolvedItems<TeacherItemSettings>(settings);
  const limit = getQueryLimit(settings, items.length);
  const visible = items.slice(0, limit);

  if (visible.length === 0) return null;

  return (
    <Section id="equipo" padding="lg" muted>
      <Container>
        <Stack gap={12}>
          <SectionTitle
            overline={asString(settings.overline) || undefined}
            title={asString(settings.title, "Equipo")}
            description={asString(settings.description) || undefined}
            align="center"
            className="mx-auto"
          />
          <Grid cols={1} smCols={2} lgCols={4} gap={6}>
            {visible.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
