"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactInfo } from "@/types/cms";

interface ContactFormProps {
  value: ContactInfo;
  onChange: (value: ContactInfo) => void;
}

export function ContactForm({ value, onChange }: ContactFormProps) {
  const update = <K extends keyof ContactInfo>(key: K, fieldValue: ContactInfo[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacto institucional</CardTitle>
        <CardDescription>Datos de contacto públicos del seminario.</CardDescription>
      </CardHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block">Email</Label>
          <Input
            type="email"
            value={value.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="contacto@seminarioipn.cl"
          />
        </div>

        <div>
          <Label className="mb-2 block">Teléfono</Label>
          <Input
            value={value.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+56 9 0000 0000"
          />
        </div>

        <div>
          <Label className="mb-2 block">WhatsApp</Label>
          <Input
            value={value.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            placeholder="+56 9 0000 0000"
          />
        </div>

        <div>
          <Label className="mb-2 block">Ciudad</Label>
          <Input
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Chillán"
          />
        </div>

        <div className="sm:col-span-2">
          <Label className="mb-2 block">Dirección</Label>
          <Input
            value={value.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Calle, número, comuna"
          />
        </div>

        <div>
          <Label className="mb-2 block">País</Label>
          <Input
            value={value.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="Chile"
          />
        </div>

        <div className="sm:col-span-2">
          <Label className="mb-2 block">Horario de atención</Label>
          <Input
            value={value.hours ?? ""}
            onChange={(e) => update("hours", e.target.value)}
            placeholder="Lunes a viernes, 9:00 – 18:00 hrs"
          />
        </div>
      </div>
    </Card>
  );
}
