import "server-only";

import { colorDefaults, neutralScale } from "@/design/tokens/colors";
import { shadow } from "@/design/tokens/shadow";

export interface TransactionalEmailInput {
  institutionName: string;
  previewText: string;
  headline: string;
  greeting?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

const BRAND = {
  primary: colorDefaults.primary,
  primaryDark: neutralScale[900],
  accent: colorDefaults.accent,
  text: colorDefaults.foreground,
  muted: colorDefaults.muted,
  border: colorDefaults.border,
  background: neutralScale[50],
  card: colorDefaults.surface,
};

export function renderTransactionalEmail(input: TransactionalEmailInput): string {
  const institution = escapeHtml(input.institutionName);
  const greeting = input.greeting
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.text};">${escapeHtml(input.greeting)}</p>`
    : "";

  const cta =
    input.ctaLabel && input.ctaUrl
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
          <tr>
            <td style="border-radius:10px;background:${BRAND.primary};">
              <a href="${escapeHtmlAttr(input.ctaUrl)}" target="_blank" rel="noopener noreferrer"
                style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:${BRAND.card};text-decoration:none;border-radius:10px;">
                ${escapeHtml(input.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">
          Si el botón no funciona, copia este enlace:<br />
          <a href="${escapeHtmlAttr(input.ctaUrl)}" style="color:${BRAND.primary};">${escapeHtml(input.ctaUrl)}</a>
        </p>
      `
      : "";

  const footer = input.footerNote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};">${input.footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(input.headline)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.background};font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.previewText)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 0 20px;text-align:center;">
                <div style="display:inline-block;padding:10px 18px;border-radius:999px;background:${BRAND.primaryDark};color:${BRAND.card};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                  ${institution}
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;padding:32px 28px;box-shadow:${shadow.lg};">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:${BRAND.text};">${escapeHtml(input.headline)}</h1>
                ${greeting}
                <div style="font-size:15px;line-height:1.7;color:${BRAND.text};">
                  ${input.bodyHtml}
                </div>
                ${cta}
                ${footer}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                Este mensaje fue enviado por ${institution}. Si no esperabas este correo, puedes ignorarlo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderInfoBox(html: string): string {
  return `<div style="margin:20px 0;padding:16px 18px;border-radius:12px;background:${BRAND.background};border:1px solid ${BRAND.border};font-size:14px;line-height:1.6;color:${BRAND.text};">${html}</div>`;
}

export function renderCredentialRow(label: string, value: string): string {
  return `<p style="margin:0 0 10px;"><span style="display:block;font-size:12px;font-weight:600;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(label)}</span><span style="display:block;margin-top:4px;font-size:15px;font-weight:600;color:${BRAND.text};">${escapeHtml(value)}</span></p>`;
}

export function renderSteps(items: string[]): string {
  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td style="vertical-align:top;padding:0 12px 14px 0;width:28px;">
            <div style="width:24px;height:24px;border-radius:999px;background:${BRAND.primary};color:${BRAND.card};font-size:12px;font-weight:700;line-height:24px;text-align:center;">
              ${index + 1}
            </div>
          </td>
          <td style="vertical-align:top;padding:0 0 14px;font-size:14px;line-height:1.6;color:${BRAND.text};">
            ${item}
          </td>
        </tr>
      `
    )
    .join("");

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 0;width:100%;">${rows}</table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
