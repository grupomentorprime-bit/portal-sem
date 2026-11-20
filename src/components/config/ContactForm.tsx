"use client";

import { useId } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChilePhoneInput } from "@/components/portal/experience/forms/ChilePhoneInput";
import { inputBase } from "@/components/ui/shared";
import {
  canonicalChileRegion,
  chileRegionForCity,
  chileRegionNames,
  citiesInChileRegion,
  isChileCountry,
} from "@/lib/geo/chile-locations";
import { cn } from "@/lib/utils";
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
  const regionId = useId();
  const cityId = useId();
  const countryId = useId();
  const chile = isChileCountry(value.country);
  const regionValue = chile
    ? canonicalChileRegion(value.region) || value.region?.trim() || chileRegionForCity(value.city)
    : value.region?.trim() || "";
  const regionOptions = chileRegionNames(regionValue);
  const cityOptions = citiesInChileRegion(regionValue, value.city);

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

          <ChilePhoneInput
            label="Teléfono"
            name={phoneId}
            value={value.phone}
            onChange={(next) => update("phone", next)}
            helper="Celular o teléfono chileno, con +56."
          />

          <ChilePhoneInput
            label="WhatsApp"
            name={whatsappId}
            value={value.whatsapp}
            onChange={(next) => update("whatsapp", next)}
            helper="Celular chileno, con +56."
          />

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
              placeholder="Calle y número"
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor={regionId}>Región</Label>
            {chile ? (
              <select
                id={regionId}
                className={cn(inputBase, "h-11")}
                value={regionOptions.includes(regionValue) ? regionValue : ""}
                onChange={(e) => {
                  const region = e.target.value;
                  const cities = citiesInChileRegion(region);
                  const city = cities.includes(value.city) ? value.city : "";
                  onChange({ ...value, region, city });
                }}
              >
                <option value="">Elige una región</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={regionId}
                value={value.region ?? ""}
                onChange={(e) => update("region", e.target.value)}
                placeholder="Región o estado"
              />
            )}
          </div>

          <div>
            <Label className="mb-2 block" htmlFor={cityId}>Ciudad</Label>
            {chile ? (
              <select
                id={cityId}
                className={cn(inputBase, "h-11")}
                value={cityOptions.includes(value.city) ? value.city : ""}
                disabled={!regionValue}
                onChange={(e) => onChange({ ...value, region: regionValue, city: e.target.value })}
              >
                <option value="">{regionValue ? "Elige una ciudad" : "Primero elige la región"}</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={cityId}
                value={value.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Ciudad"
              />
            )}
          </div>

          <div>
            <Label className="mb-2 block" htmlFor={countryId}>País</Label>
            <Input
              id={countryId}
              value={value.country}
              onChange={(e) => {
                const country = e.target.value;
                if (isChileCountry(country)) {
                  const region = canonicalChileRegion(value.region) || chileRegionForCity(value.city);
                  onChange({ ...value, country, region });
                  return;
                }
                onChange({ ...value, country });
              }}
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
