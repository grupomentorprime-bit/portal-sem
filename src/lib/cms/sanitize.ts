const FORBIDDEN_TAGS =
  /<\s*\/?\s*(script|iframe|object|embed|form|input|button|link|meta|style)\b[^>]*>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL = /(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

export function sanitizeHtml(input: string): string {
  return input
    .replace(FORBIDDEN_TAGS, "")
    .replace(EVENT_HANDLERS, "")
    .replace(JAVASCRIPT_URL, '$1="#"');
}

export function sanitizeMarkdown(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "");
}

/** Minimal markdown → HTML (headings, paragraphs, links, lists) */
export function markdownToHtml(markdown: string): string {
  const safe = sanitizeMarkdown(markdown);
  const lines = safe.split("\n");
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
  return sanitizeHtml(html.join(""));
}

function inlineMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label: string, url: string) => {
      const safeUrl = url.startsWith("http") || url.startsWith("/") ? url : "#";
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
