import { getSiteConfig } from "@/lib/cms/config";
import Link from "next/link";

export default async function Home() {
  const config = await getSiteConfig();

  if (!config) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <p className="text-sm text-zinc-500">Configuración institucional no disponible.</p>
      </main>
    );
  }

  const { institution, seo, branding, contact } = config;

  if (institution.status === "maintenance") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600">
            Mantenimiento
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {institution.name}
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Estamos realizando mejoras. Vuelve pronto.
          </p>
        </div>
      </main>
    );
  }

  if (institution.status === "inactive") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <p className="text-sm text-zinc-500">Portal temporalmente no disponible.</p>
      </main>
    );
  }

  return (
    <main
      className="flex flex-1 flex-col"
      style={{
        backgroundColor: branding.backgroundColor,
        color: branding.textColor,
      }}
    >
      {branding.heroImage ? (
        <section className="relative h-64 w-full overflow-hidden sm:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={branding.heroImage}
            alt={institution.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="text-center text-white">
              {branding.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logo}
                  alt={institution.shortName}
                  className="mx-auto mb-4 h-16 w-auto"
                />
              ) : null}
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {institution.name}
              </h1>
              <p className="mt-3 text-lg text-white/90">{institution.organization}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center px-6 py-24">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo}
              alt={institution.shortName}
              className="mb-6 h-20 w-auto"
            />
          ) : null}
          <p
            className="text-sm font-medium uppercase tracking-widest"
            style={{ color: branding.secondaryColor }}
          >
            {institution.shortName}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {institution.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 opacity-80">
            {seo.description}
          </p>
        </section>
      )}

      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          <InfoCard title="Organización" value={institution.organization} />
          {contact.city ? (
            <InfoCard title="Ubicación" value={`${contact.city}, ${contact.country}`} />
          ) : null}
          {contact.email ? <InfoCard title="Email" value={contact.email} /> : null}
          {institution.website ? (
            <InfoCard
              title="Sitio web"
              value={
                <a
                  href={institution.website}
                  className="underline"
                  style={{ color: branding.primaryColor }}
                >
                  {institution.website}
                </a>
              }
            />
          ) : null}
        </div>

        <p className="mt-12 text-center text-sm opacity-60">
          <Link href="/admin/config" className="underline">
            Configuration Hub
          </Link>
          {" · "}
          <Link href="/admin/menus" className="underline">
            Menús
          </Link>
        </p>
      </section>
    </main>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-5 dark:border-white/10">
      <p className="text-xs font-semibold uppercase tracking-widest opacity-60">{title}</p>
      <p className="mt-2 text-base font-medium">{value}</p>
    </div>
  );
}
