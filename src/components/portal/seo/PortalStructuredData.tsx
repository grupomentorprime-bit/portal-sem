interface PortalStructuredDataProps {
  jsonLd: Record<string, unknown>[];
}

export function PortalStructuredData({ jsonLd }: PortalStructuredDataProps) {
  if (jsonLd.length === 0) return null;

  return (
    <>
      {jsonLd.map((payload, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
        />
      ))}
    </>
  );
}
