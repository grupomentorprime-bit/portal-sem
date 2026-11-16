"use client";

import { useId } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactInfo } from "@/types/cms";

interface ContactFormProps {
  value: ContactInfo;
  onChange: (value: ContactInfo) => void;
  /** all: formulario completo. contact/location: bloques NELZURI. */
  scope?: "all" | "contact" | "location";
  /** false: solo campos, sin Card. */
  framed?: boolean;
}

export function ContactForm({
  value,
  onChange,
  scope = "all",
  framed = true,
}: ContactFormProps) {
  const update = <K extends keyof ContactInfo>(key: K, fieldValue: ContactInfo[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  const showContact = scope === "all" || scope === "contact";
  const showLocation = scope === "all" || scope === "location";
  const emailId = useId();
  const phoneId = useId();
  const whatsappId = useId();
  const hoursId = useId();
  const addressId = useId();
  const cityId = useId();
  const countryId = useId();

  const fields = (
    <div className="grid gap-4 sm:grid-cols-2">
      {showContact ? (
        <>
          <div>
            <Label className="mb-2 block" htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              value={value.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="contacto@ejemplo.org"
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor={phoneId}>Teléfono</Label>
            <Input
              id={phoneId}
              value={value.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+56 9 0000 0000"
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor={whatsappId}>WhatsApp</Label>
            <Input
              id={whatsappId}
              value={value.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="+56 9 0000 0000"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-2 block" htmlFor={hoursId}>Horario de atención</Label>
            <Input
              id={hoursId}
              value={value.hours ?? ""}
              onChange={(e) => update("hours", e.target.value)}
              placeholder="Lunes a viernes, 9:00 – 18:00 hrs"
            />
          </div>
        </>
      ) : null}

      {showLocation ? (
        <>
          <div className="sm:col-span-2">
            <Label className="mb-2 block" htmlFor={addressId}>Dirección</Label>
            <Input
              id={addressId}
              value={value.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Calle, número, comuna"
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor={cityId}>Ciudad</Label>
            <Input
              id={cityId}
              value={value.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Chillán"
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor={countryId}>País</Label>
            <Input
              id={countryId}
              value={value.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="Chile"
            />
          </div>
        </>
      ) : null}
    </div>
  );

  if (!framed) return fields;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {scope === "location" ? "Ubicación" : "Contacto institucional"}
        </CardTitle>
        <CardDescription>
          {scope === "location"
            ? "Dirección pública del Espacio."
            : "Datos de contacto públicos del Espacio."}
        </CardDescription>
      </CardHeader>
      {fields}
    </Card>
  );
}
