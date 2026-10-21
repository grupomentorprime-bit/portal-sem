import { MATTER_STATUS_LABEL } from "@/sites/cumple/diagnostico";
import { loadInformeDelHost } from "@/lib/cumple/informe";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface InformePageProps {
  params: Promise<{ token: string }>;
}

export default async function InformeDiagnosticoPage({ params }: InformePageProps) {
  const { token } = await params;
  const record = await loadInformeDelHost(token);
  if (!record) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-neutral-900">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
        Diagnóstico orientativo
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">{record.empresaNombre}</h1>
      <p className="mt-3 text-lg">{record.result.headline}</p>
      <p className="mt-4 text-sm leading-6 text-neutral-600">{record.result.disclaimer}</p>
      <p className="mt-2 text-sm text-neutral-600">
        Hallazgos declarados. Cumplimiento legal verificado: no.
      </p>
      <ul className="mt-8 space-y-4">
        {record.result.matters.map((matter) => (
          <li key={matter.id} className="rounded-xl border border-neutral-200 px-4 py-3">
            <p className="font-semibold">
              {matter.label}
              <span className="font-normal text-neutral-500">
                {" "}
                · {MATTER_STATUS_LABEL[matter.status]}
              </span>
            </p>
            {matter.findings.length > 0 ? (
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                {matter.findings.join(". ")}.
              </p>
            ) : null}
            {matter.recommendation ? (
              <p className="mt-2 text-sm leading-6">{matter.recommendation}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <a
        href={`/api/sites/cumple/informe/${encodeURIComponent(record.reportToken)}`}
        className="mt-8 inline-block text-sm font-semibold underline"
      >
        Descargar texto
      </a>
    </main>
  );
}
