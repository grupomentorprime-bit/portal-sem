import { Container, Grid, Section, Stack } from "@/components/layout";
import { NewsCard, SectionTitle } from "@/components/institutional";
import { Button } from "@/components/ui";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { asBoolean, asString, type NewsItemSettings } from "@/lib/cms/block-utils";
import type { BlockContentQuery } from "@/types/content";

interface NewsGridProps {
  settings: Record<string, unknown>;
}

export function NewsGrid({ settings }: NewsGridProps) {
  const query = settings.query as BlockContentQuery | undefined;
  const category = query?.category ?? asString(settings.category);
  let items = getResolvedItems<NewsItemSettings>(settings);
  if (category) items = items.filter((n) => n.category === category);
  const limit = getQueryLimit(settings, items.length);
  const visible = items.slice(0, limit);

  if (visible.length === 0) return null;

  return (
    <Section id="noticias" padding="lg">
      <Container>
        <Stack gap={12}>
          <SectionTitle
            overline={asString(settings.overline) || undefined}
            title={asString(settings.title, "Noticias")}
            description={asString(settings.description) || undefined}
            align="center"
            className="mx-auto"
          />
          <Grid cols={1} mdCols={3} gap={6}>
            {visible.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </Grid>
          {asBoolean(settings.showButton, true) ? (
            <div className="text-center">
              <Button href={asString(settings.buttonHref, "/noticias")} variant="secondary">
                {asString(settings.buttonLabel, "Ver todas las noticias")}
              </Button>
            </div>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
