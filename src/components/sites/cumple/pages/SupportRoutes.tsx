import type { ReactNode } from "react";
import { CumpleShell } from "@/components/sites/cumple/CumpleShell";
import { ComoFuncionaPage } from "@/components/sites/cumple/pages/ComoFuncionaPage";
import { ContactoPage } from "@/components/sites/cumple/pages/ContactoPage";
import { EvaluarPage } from "@/components/sites/cumple/pages/EvaluarPage";
import { FaqPage } from "@/components/sites/cumple/pages/FaqPage";
import { NosotrosPage } from "@/components/sites/cumple/pages/NosotrosPage";
import type { CodedPageViewProps } from "@/sites/page-views";

function Wrapped({ contact, children }: Pick<CodedPageViewProps, "contact"> & { children: ReactNode }) {
  return <CumpleShell contact={contact}>{children}</CumpleShell>;
}

export function ComoFuncionaView({ contact }: CodedPageViewProps) {
  return (
    <Wrapped contact={contact}>
      <ComoFuncionaPage />
    </Wrapped>
  );
}

export function FaqView({ contact }: CodedPageViewProps) {
  return (
    <Wrapped contact={contact}>
      <FaqPage />
    </Wrapped>
  );
}

export function EvaluarView({ contact }: CodedPageViewProps) {
  return (
    <Wrapped contact={contact}>
      <EvaluarPage />
    </Wrapped>
  );
}

export function NosotrosView({ contact }: CodedPageViewProps) {
  return (
    <Wrapped contact={contact}>
      <NosotrosPage />
    </Wrapped>
  );
}

export function ContactoView({ contact, social }: CodedPageViewProps) {
  return (
    <Wrapped contact={contact}>
      <ContactoPage contact={contact} social={social} />
    </Wrapped>
  );
}