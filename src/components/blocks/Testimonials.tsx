/**
 * @deprecated
 *
 * Reemplazado por:
 * TestimonialsSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { Container, Grid, Section, Stack } from "@/components/layout";
import { SectionTitle, TestimonialCard } from "@/components/institutional";
import { getResolvedItems } from "@/lib/content/block-settings";
import { asString, type TestimonialItemSettings } from "@/lib/cms/block-utils";

interface TestimonialsProps {
  settings: Record<string, unknown>;
}

export function Testimonials({ settings }: TestimonialsProps) {
  const items = getResolvedItems<TestimonialItemSettings>(settings);
  if (items.length === 0) return null;

  return (
    <Section id="testimonios" padding="lg" muted>
      <Container>
        <Stack gap={12}>
          <SectionTitle
            overline={asString(settings.overline) || undefined}
            title={asString(settings.title, "Testimonios")}
            description={asString(settings.description) || undefined}
            align="center"
            className="mx-auto"
          />
          <Grid cols={1} mdCols={3} gap={6}>
            {items.map((item) => (
              <TestimonialCard key={item.id} testimonial={item} />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
