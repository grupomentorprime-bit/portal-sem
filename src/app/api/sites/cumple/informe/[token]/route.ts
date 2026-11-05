import { loadInformeDelHost } from "@/lib/cumple/informe";
import { renderInformeTexto } from "@/sites/cumple/diagnostico-record";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const record = await loadInformeDelHost(token);
  if (!record) {
    return new Response("Informe no disponible.", { status: 404 });
  }
  return new Response(renderInformeTexto(record), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="diagnostico-${record.empresaClave.replace(/[^a-z0-9]+/g, "-")}.txt"`,
      "Cache-Control": "private, no-store",
    },
  });
}
