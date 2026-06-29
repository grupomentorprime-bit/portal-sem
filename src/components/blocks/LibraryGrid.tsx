import Link from "next/link";
import { Container, Grid, Section, Stack } from "@/components/layout";
import { SectionTitle } from "@/components/institutional";
import { InstitutionalCard } from "@/components/institutional/InstitutionalCard";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { asString, type LibraryItemSettings } from "@/lib/cms/block-utils";
import { Library } from "lucide-react";
import { iconSizes } from "@/design";

interface LibraryGridProps {
  settings: Record<string, unknown>;
}

export function LibraryGrid({ settings }: LibraryGridProps) {
  const items = getResolvedItems<LibraryItemSettings>(settings);
  const limit = getQueryLimit(settings, items.length);
  const visible = items.slice(0, limit);

  if (visible.length === 0) return null;

  return (
    <Section padding="lg">
      <Container>
        <Stack gap={8}>
          <SectionTitle
            overline={asString(settings.overline) || undefined}
            title={asString(settings.title, "Biblioteca")}
            description={asString(settings.description) || undefined}
          />
          <Grid cols={1} mdCols={3} gap={6}>
            {visible.map((item) => (
              <Link key={item.id} href={item.href}>
                <InstitutionalCard className="h-full">
                  <Library className="text-secondary" size={iconSizes.lg} strokeWidth={2} />
                  <h3 className="mt-4 text-heading text-foreground">{item.title}</h3>
                  <p className="mt-1 text-caption text-muted">{item.author}</p>
                </InstitutionalCard>
              </Link>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
