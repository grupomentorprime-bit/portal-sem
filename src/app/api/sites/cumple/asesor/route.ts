import { getActiveTenantId } from "@/core/identity";
import { cumpleAsesorAllowed } from "@/sites/cumple/access";
import { asesorar } from "@/sites/cumple/asesor";

export const maxDuration = 30;

type Turn = { role: "user" | "assistant"; text: string };

const hits = new Map<string, number[]>();

function allowed(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 12) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  const tenant = await getActiveTenantId();
  if (!cumpleAsesorAllowed(tenant)) {
    return Response.json({ error: "No encontrado." }, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) {
    return Response.json(
      { error: "Hubo muchas consultas seguidas. Espere unos minutos y vuelva a preguntar." },
      { status: 429 }
    );
  }

  let messages: Turn[] = [];
  try {
    const body = (await request.json()) as { messages?: Turn[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: "No pude leer la consulta." }, { status: 400 });
  }

  const clean = messages
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
    .slice(-8)
    .map((item) => ({ role: item.role, text: item.text.trim().slice(0, 800) }))
    .filter((item) => item.text.length > 0);

  const question = clean.filter((item) => item.role === "user").at(-1);
  if (!question) {
    return Response.json({ error: "Escriba la consulta para revisarla con la norma." }, { status: 400 });
  }

  try {
    const reply = await asesorar(clean);
    return Response.json({ reply });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "NO_KEY") {
      return Response.json(
        { error: "El asesor todavía no tiene la clave de Google AI Studio. Cuando la agreguen, este chat queda activo." },
        { status: 503 }
      );
    }
    if (code === "GEMINI_503" || code === "GEMINI_429") {
      return Response.json(
        { error: "La clave está activa, pero Google está saturado en este momento. Espere un minuto y vuelva a preguntar." },
        { status: 503 }
      );
    }
    return Response.json(
      { error: "No pude completar la revisión de la norma. Intente de nuevo en un momento." },
      { status: 502 }
    );
  }
}
