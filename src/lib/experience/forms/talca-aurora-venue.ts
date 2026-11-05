/** Centro de Convenciones IPN, Talca Aurora. Mismo pin del mapa del formulario. */
export const TALCA_AURORA_VENUE = {
  name: "Centro de Convenciones IPN",
  place: "Talca Aurora",
  latitude: -35.4908396,
  longitude: -71.5411355,
  googleMapsUrl: "https://maps.app.goo.gl/mMieKcyFbgz9iKAF9",
  googleDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=-35.4908396,-71.5411355",
  wazeUrl: "https://www.waze.com/ul?ll=-35.4908396,-71.5411355&navigate=yes",
  embedUrl:
    "https://www.google.com/maps?q=Centro+de+Convenciones+IPN+chile&ll=-35.4945,-71.5373&z=15&hl=es&output=embed",
} as const;

export function isTalcaAuroraLocation(location: string | undefined): boolean {
  const value = location?.trim().toLowerCase() ?? "";
  return value.includes("talca") && value.includes("aurora");
}
