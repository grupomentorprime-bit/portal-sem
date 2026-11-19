import sanitizeHtmlLib from "sanitize-html";

const HTML_ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "h1", "h2", "h3", "blockquote", "a"];

/** Política de HTML de contenido. No se reutiliza para SVG. */
export const HTML_SANITIZE_OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: HTML_ALLOWED_TAGS,
  allowedAttributes: { a: ["href"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { a: ["http", "https", "mailto"] },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  parser: { lowerCaseTags: true, lowerCaseAttributeNames: true },
};

const SVG_TAGS = [
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "title",
  "desc",
];

const SVG_DRAW_ATTRS = [
  "id",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "width",
  "height",
  "points",
  "transform",
  "opacity",
  "viewBox",
  "xmlns",
  "offset",
  "stop-color",
  "stop-opacity",
  "gradientUnits",
  "gradientTransform",
  "cx",
  "cy",
  "r",
];

/** Política de SVG de carga. Sin script, sin manejadores y sin enlaces externos. */
export const SVG_SANITIZE_OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: SVG_TAGS,
  allowedAttributes: Object.fromEntries(SVG_TAGS.map((tag) => [tag, SVG_DRAW_ATTRS])),
  allowedSchemes: [],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
};

export function sanitizeHtmlContent(input: string): string {
  return sanitizeHtmlLib(input, HTML_SANITIZE_OPTIONS);
}

export function sanitizeHtml(input: string): string {
  return sanitizeHtmlContent(input);
}

export function sanitizeSvgMarkup(input: string): string {
  return sanitizeHtmlLib(input, SVG_SANITIZE_OPTIONS);
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }
    if (trimmed.startsWith("### ")) {
      html.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      html.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      html.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(trimmed.slice(2))}</li>`);
    } else {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return sanitizeHtmlContent(html.join(""));
}

function inlineMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label: string, url: string) => {
      const safeUrl = url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/")
        ? url
        : "#";
      return `<a href="${safeUrl}">${label}</a>`;
    }
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
