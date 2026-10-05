import { dossier, fichas, fichasPara, normalizar, type Ficha } from "@/sites/cumple/norma";

const revisionSystem = `Eres el revisor normativo de Mentor Cumple. Trabajas solo con la BASE que viene en el mensaje.
Reglas:
- Extrae únicamente los pasajes de la BASE que responden la consulta, no los que solo la mencionan de paso.
- Copia el nombre de la norma tal como aparece en la BASE.
- Si la BASE no alcanza para responder lo que preguntaron, la primera línea debe ser exactamente: COBERTURA: INSUFICIENTE
- Si la BASE sí responde la consulta, la primera línea debe ser exactamente: COBERTURA: SUFICIENTE
- No uses conocimiento externo.
- No inventes artículos, montos, plazos, porcentajes ni fechas.
- No respondas al usuario. Este texto es un informe interno.`;

const respuestaSystem = `Eres el asesor de Mentor Cumple en el chat de la página. Respondes en español de Chile, con un tono claro y profesional.
La consulta ya fue contrastada con la base legal. El informe es tu única fuente normativa.

Responde la pregunta que hicieron. No cambies de tema ni recites otra norma.
Si el informe no trae un dato (artículo, monto, plazo o fecha), no lo inventes: di que ese dato se confirma en el texto oficial, durante el diagnóstico.

Formato:
**Norma:** nombre que está en el informe.

- viñetas que contesten la pregunta, como máximo cinco

Una frase final que invite a solicitar el diagnóstico, sin usar las palabras brecha ni directriz.

Extensión: máximo 120 palabras. Sin introducción larga.
No escribas direcciones web. No cites blogs, consultoras ni mutuales.
No afirmes que la organización ya está en incumplimiento.
No prometas ausencia de multas, fiscalizaciones ni sanciones.`;

const orientacionSystem = `Eres el asesor de Mentor Cumple en el chat de la página. Respondes en español de Chile, con un tono claro y profesional.

Hay dos caminos, y eliges uno:

1. Si la consulta calza con una FICHA VERIFICADA, respondes solo con lo que esa ficha dice. Ahí sí puedes usar los artículos, plazos y fechas que la ficha trae.
2. Si la consulta es otra norma chilena de trabajo, seguridad y salud, acoso, inclusión, datos, emergencias o subcontratación, oriéntala igual. Di el nombre de la ley si lo conoces con seguridad y explica, en viñetas, qué tiene que ordenar la empresa. En este camino no des números de artículo, montos, porcentajes, plazos en días ni fechas.

En los dos caminos:
- Responde lo que preguntaron. No desvíes la respuesta a la Ley Karin ni al DS 44 si no era eso.
- Si no estás seguro del número de la ley, habla del tema sin inventar un número.
- No escribas direcciones web.
- No digas que la consulta no está cubierta ni que no hay norma.
- No afirmes que la organización ya incumple ni prometas que no habrá multas.
- Máximo 130 palabras.
- Cierra con una frase que invite a solicitar el diagnóstico, al final de esta página, para confirmar el texto oficial.

Formato:
**Norma:** nombre de la norma.

- hasta cinco viñetas`;

type Turn = { role: "user" | "assistant"; text: string };

function geminiSaturado(error: unknown) {
  return error instanceof Error && /GEMINI_(503|429)/.test(error.message);
}

function respuestaServicio() {
  return `**Servicio:** Mentor Cumple

- Para contratar, solicite el diagnóstico al final de esta página.
- Ahí se revisa qué obligaciones aplican a su organización y qué conviene atender primero.
- El acompañamiento junta consultoría, gestión y la plataforma, con responsables, vencimientos y evidencia.

Con eso se define el alcance del servicio.`;
}

function esServicio(texto: string) {
  const n = normalizar(texto);
  const pideServicio =
    /(como (puedo |se )?(contrato|contratar)|contrat\w* (el |su |nuestro )?(servicio|asesoria|consultoria|mentor)|precio del servicio|costo del servicio|cotiz|agendar|que incluye el servicio|como funciona el servicio)/.test(
      n,
    );
  const pideNorma =
    /(ley|decreto|ds\s?\d|articulo|karin|jornada|acoso|norma|codigo|discapacidad|contratista|subcontrat|datos personales|emergencia)/.test(
      n,
    );
  return pideServicio && !pideNorma;
}

function seleccionar(messages: Turn[]) {
  const usuarios = messages.filter((item) => item.role === "user").map((item) => item.text);
  const ultima = usuarios.at(-1) ?? "";
  const directas = fichasPara(ultima).filter((ficha) => ficha.fuente);
  if (directas.length > 0) return directas;
  const previa = usuarios.at(-2);
  if (!previa || esServicio(ultima)) return [];
  return fichasPara(previa).filter((ficha) => ficha.fuente);
}

function answerBreaksReview(base: string, answer: string) {
  const answerArticles = [...answer.matchAll(/art[ií]culos?\s+\d+/gi)].map((item) => item[0]);
  if (answerArticles.some((article) => !new RegExp(article.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(base))) {
    return true;
  }
  const answerCitesMoney = /\$\s?\d|\bUTM\b|\bUF\b|unidades tributarias/i.test(answer);
  const baseCitesMoney = /\$\s?\d|\bUTM\b|\bUF\b|unidades tributarias/i.test(base);
  return answerCitesMoney && !baseCitesMoney;
}

function depurar(answer: string, base: string) {
  const sinUrl = answer.replace(/^COBERTURA:\s*\S+\s*/i, "").replace(/https?:\/\/\S+/g, "").trim();
  const baseNormal = normalizar(base);
  const lines = sinUrl.split("\n").filter((line) => {
    const articles = [...line.matchAll(/art[ií]culos?\s+\d+(?:\s*bis)?/gi)].map((item) => item[0]);
    if (articles.some((article) => !baseNormal.includes(normalizar(article)))) return false;
    const citaDinero = /\$\s?\d|\bUTM\b|\bUF\b|unidades tributarias/i.test(line);
    const baseTieneDinero = /\$\s?\d|\bUTM\b|\bUF\b|unidades tributarias/i.test(base);
    if (citaDinero && !baseTieneDinero) return false;
    const fechas = line.match(/\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}/gi) ?? [];
    if (fechas.some((fecha) => !baseNormal.includes(normalizar(fecha)))) return false;
    if (/esta ficha no|no sustituir esa regla/i.test(line)) return false;
    return true;
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const modelos = () =>
  [
    ...new Set([
      process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
    ]),
  ];

async function generate(system: string, user: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_KEY");

  let lastStatus = 502;
  for (const model of modelos()) {
    let response: Response;
    try {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          model,
          store: false,
          system_instruction: system,
          input: user,
          generation_config: {
            max_output_tokens: 2048,
            thinking_level: "low",
          },
        }),
        signal: AbortSignal.timeout(22000),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "sin detalle";
      console.error(`Gemini ${model} no respondió: ${message.slice(0, 180)}`);
      lastStatus = 503;
      continue;
    }

    const data = (await response.json()) as {
      error?: { message?: string; status?: string };
      status?: string;
      steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
    };

    if (response.status === 404 || response.status === 429 || response.status === 503) {
      const message = (data.error?.message || data.status || "sin detalle").slice(0, 180);
      console.error(`Gemini ${model} ${response.status}: ${message}`);
      lastStatus = response.status;
      continue;
    }

    if (!response.ok) {
      const message = (data.error?.message || data.error?.status || "sin detalle").slice(0, 240);
      console.error(`Gemini ${model} ${response.status}: ${message}`);
      throw new Error(`GEMINI_${response.status}`);
    }

    const text = (data.steps ?? [])
      .filter((step) => step.type === "model_output")
      .flatMap((step) => step.content ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) {
      console.error(`Gemini ${model} respuesta vacía: ${data.status || "sin motivo"}`);
      continue;
    }
    return text;
  }

  throw new Error(`GEMINI_${lastStatus}`);
}

export async function asesorar(messages: Turn[]) {
  const latest = messages.filter((item) => item.role === "user").at(-1)?.text.trim() ?? "";
  if (!latest) throw new Error("EMPTY_QUESTION");
  if (esServicio(latest)) return respuestaServicio();

  const seleccion = seleccionar(messages);
  const history = messages
    .slice(-6)
    .map((item) => `${item.role === "user" ? "Consulta" : "Respuesta previa"}: ${item.text}`)
    .join("\n");

  if (seleccion.length === 0) return orientar(latest, history);

  const base = seleccion
    .map((ficha) => {
      const origen = ficha.fuente ? `\nFuente oficial autorizada: ${ficha.fuente.nombre}` : "";
      return `${ficha.titulo}\n${ficha.texto}${origen}`;
    })
    .join("\n\n");

  let review = "";
  try {
    review = await generate(
      revisionSystem,
      `BASE:\n${base}\n\nCONVERSACIÓN:\n${history}\n\nCONSULTA A REVISAR:\n${latest}`,
    );
  } catch (error) {
    if (!geminiSaturado(error)) throw error;
    return `${resumen(seleccion)}${citas(seleccion)}`;
  }

  if (/COBERTURA:\s*INSUFICIENTE/i.test(review)) {
    return orientar(latest, history, seleccion);
  }

  let draft = "";
  try {
    draft = await generate(
      respuestaSystem,
      `INFORME DE LA PRIMERA REVISIÓN:\n${review}\n\nCONVERSACIÓN:\n${history}\n\nCONSULTA:\n${latest}\n\nRedacta la respuesta solo con lo que el informe sostiene y que conteste la consulta.`,
    );
  } catch (error) {
    if (!geminiSaturado(error)) throw error;
    return `${resumen(seleccion)}${citas(seleccion)}`;
  }

  const cleaned = depurar(draft, base);
  const niega = /no está en esta consulta|no hay norma|no está cubierta/i.test(cleaned);
  const cuerpo = !cleaned || niega || answerBreaksReview(base, cleaned) ? resumen(seleccion) : cleaned;
  return `${cuerpo}${citas(seleccion)}`;
}

async function orientar(latest: string, history: string, cercanas: Ficha[] = []) {
  const apoyo = cercanas.length
    ? `La ficha más cercana no alcanza para el punto preciso. Úsala solo para lo que sí dice, y el dato que falta se confirma en el diagnóstico.\n\n${cercanas
        .map((ficha) => `${ficha.titulo}\n${ficha.texto}`)
        .join("\n\n")}`
    : `FICHAS VERIFICADAS:\n${dossier}`;

  let draft = "";
  try {
    draft = await generate(
      orientacionSystem,
      `${apoyo}\n\nCONVERSACIÓN:\n${history}\n\nCONSULTA:\n${latest}`,
    );
  } catch (error) {
    if (cercanas.length && geminiSaturado(error)) return `${resumen(cercanas)}${citas(cercanas)}`;
    throw error;
  }
  const base = cercanas.length ? cercanas.map((ficha) => ficha.texto).join("\n") : "";
  const cleaned = depurar(draft, base);
  const niega = /no está en esta consulta|no hay norma|no está cubierta/i.test(cleaned);
  const cuerpo = !cleaned || niega ? (cercanas.length ? resumen(cercanas) : resumenGeneral()) : cleaned;
  const fuentes = cercanas.length ? citas(cercanas) : citasMencionadas(cuerpo);
  return `${cuerpo}${fuentes}`;
}

function resumenGeneral() {
  return `Puedo orientar la obligación, y el artículo, el plazo o el monto se confirman en el texto oficial.\n\nSolicite el diagnóstico al final de esta página y lo revisamos con la norma que aplica a su caso.`;
}

function resumen(seleccion: Ficha[]) {
  const ficha = seleccion.find((item) => item.fuente) ?? seleccion[0];
  const puntos = ficha.texto
    .split(/(?<=\.)\s+/)
    .map((item) => item.trim())
    .filter((item) => item && !/esta ficha no/i.test(item))
    .slice(0, 4)
    .map((item) => `- ${item.replace(/\.$/, "")}`);
  return `**Norma:** ${ficha.titulo}\n\n${puntos.join("\n")}\n\nPuede solicitar el diagnóstico al final de esta página.`;
}

function citas(seleccion: Ficha[]) {
  const vistas = new Set<string>();
  const lineas: string[] = [];
  for (const ficha of seleccion) {
    if (!ficha.fuente || vistas.has(ficha.fuente.url)) continue;
    vistas.add(ficha.fuente.url);
    lineas.push(`${ficha.fuente.nombre}\n${ficha.fuente.url}`);
  }
  if (lineas.length === 0) return "";
  return `\n\n**Fuente oficial:**\n${lineas.join("\n")}`;
}

function citasMencionadas(answer: string) {
  const texto = normalizar(answer);
  const vistas = new Set<string>();
  const lineas: string[] = [];
  for (const ficha of fichas) {
    if (!ficha.fuente || vistas.has(ficha.fuente.url)) continue;
    const marcas = ficha.keys.filter((key) => /\d/.test(key) || normalizar(key) === "karin");
    if (!marcas.some((marca) => texto.includes(normalizar(marca)))) continue;
    vistas.add(ficha.fuente.url);
    lineas.push(`${ficha.fuente.nombre}\n${ficha.fuente.url}`);
    if (lineas.length === 2) break;
  }
  if (lineas.length === 0) return "";
  return `\n\n**Fuente oficial:**\n${lineas.join("\n")}`;
}
