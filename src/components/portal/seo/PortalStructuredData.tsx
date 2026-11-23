interface PortalStructuredDataProps {
  jsonLd: Record<string, unknown>[];
  nonce?: string;
}

export function PortalStructuredData({ jsonLd, nonce }: PortalStructuredDataProps) {
  if (jsonLd.length === 0) return null;

  return (
    <>
      {jsonLd.map((payload, index) => (
        <script
          key={index}
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
        />
      ))}
    </>
  );
}
