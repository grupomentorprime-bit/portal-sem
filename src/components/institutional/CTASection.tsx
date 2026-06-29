import { Container, Section, Stack } from "@/components/layout";
import { Button } from "@/components/ui";
import { SectionTitle } from "./SectionTitle";

interface CTASectionProps {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "primary";
}

export function CTASection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = "default",
}: CTASectionProps) {
  return (
    <Section
      padding="lg"
      className={variant === "primary" ? "bg-primary" : "bg-background-soft"}
    >
      <Container size="md">
        <Stack gap={8} align="center" className="text-center">
          <SectionTitle
            title={title}
            description={description}
            align="center"
            className={variant === "primary" ? "[&_h2]:text-text-inverse [&_p]:text-text-inverse/80" : undefined}
          />
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              href={primaryHref}
              variant={variant === "primary" ? "secondary" : "primary"}
              size="lg"
            >
              {primaryLabel}
            </Button>
            {secondaryLabel && secondaryHref ? (
              <Button
                href={secondaryHref}
                variant="outline"
                size="lg"
                className={variant === "primary" ? "border-text-inverse/30 text-text-inverse hover:bg-white/10" : undefined}
              >
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
