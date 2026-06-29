import { Container, Grid, Section, Stack } from "@/components/layout";
import { EventCard, SectionTitle } from "@/components/institutional";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { asString, type EventItemSettings } from "@/lib/cms/block-utils";

interface EventsGridProps {
  settings: Record<string, unknown>;
}

export function EventsGrid({ settings }: EventsGridProps) {
  const items = getResolvedItems<EventItemSettings>(settings);
  const limit = getQueryLimit(settings, items.length);
  const visible = items.slice(0, limit);

  if (visible.length === 0) return null;

  return (
    <Section padding="lg" muted>
      <Container>
        <Stack gap={8}>
          <SectionTitle
            overline={asString(settings.overline) || undefined}
            title={asString(settings.title, "Eventos")}
            description={asString(settings.description) || undefined}
          />
          <Grid cols={1} mdCols={2} gap={6}>
            {visible.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
