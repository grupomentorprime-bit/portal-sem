"use client";

import { Container, Section, Stack } from "@/components/layout";
import { Input, Textarea, Button } from "@/components/ui";
import { SectionTitle } from "@/components/institutional";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import type { ContactInfo } from "@/types/cms";

interface ContactFormProps {
  settings: Record<string, unknown>;
  contact?: ContactInfo;
}

export function ContactForm({ settings, contact }: ContactFormProps) {
  return (
    <Section id="contacto" padding="lg" muted>
      <Container size="md">
        <Stack gap={8}>
          <SectionTitle
            title={asString(settings.title, "Contáctanos")}
            description={asString(settings.description) || undefined}
            align="center"
            className="mx-auto"
          />
          <form className="institutional-card mx-auto max-w-xl space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Input label="Nombre" name="name" required />
            <Input label="Correo" name="email" type="email" required />
            <Textarea label="Mensaje" name="message" required />
            <Button type="submit" variant="primary" className="w-full">
              Enviar mensaje
            </Button>
          </form>
          <div className="text-center text-caption text-muted">
            {asBoolean(settings.showEmail, true) && contact?.email ? (
              <p>{contact.email}</p>
            ) : null}
            {asBoolean(settings.showPhone, true) && contact?.phone ? (
              <p>{contact.phone}</p>
            ) : null}
            {asBoolean(settings.showAddress, true) && contact?.address ? (
              <p>{contact.address}</p>
            ) : null}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
