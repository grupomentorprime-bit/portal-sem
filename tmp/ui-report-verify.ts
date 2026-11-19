import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MongoClient } from "mongodb";
import { chromium, type Page } from "playwright";
import { statusLabel, type CaseStatus } from "../src/lib/desktop/attention";
import {
  filterIncidents,
  incidentCsv,
  incidentTotals,
  intakeChannelLabel,
  resolveIntakeChannel,
} from "../src/lib/desktop/platform-desk";
import { buildIncidentReportPdf, incidentReportLines } from "../src/lib/desktop/platform-report-pdf";

const BASE = "http://localhost:3000";
const OUT = "tmp/ui-report-shots";

type CaseRow = {
  id: string;
  code: string;
  subject: string;
  company: string;
  requesterName: string;
  createdAt: string;
  tenantId: string;
  status: CaseStatus;
  intakeChannel?: string | null;
  originId?: string | null;
  helpFrom?: { originId?: string | null } | null;
  ticketCaseId?: string | null;
  channelLabel?: string;
};

type UiRow = { code: string; subject: string; company: string; requester: string; channel: string; status: string };

function parseCsv(raw: string): UiRow[] {
  const text = raw.replace(/^\uFEFF/, "").trim();
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  for (const line of lines) {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (quoted && char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    rows.push(cells);
  }
  return rows.slice(1).map((cells) => ({
    code: cells[0] ?? "",
    subject: cells[1] ?? "",
    company: cells[2] ?? "",
    requester: cells[3] ?? "",
    channel: cells[4] ?? "",
    status: cells[5] ?? "",
  }));
}

function pdfHas(pdf: Uint8Array, needle: string): boolean {
  return Buffer.from(pdf).toString("latin1").includes(needle);
}

async function readUi(page: Page): Promise<{ received: string; open: string; resolved: string; rows: UiRow[]; empty: boolean }> {
  const stats = page.locator(".plat-stats");
  const received = (await stats.locator("span").nth(0).locator("strong").innerText()).trim();
  const open = (await stats.locator("span").nth(1).locator("strong").innerText()).trim();
  const resolved = (await stats.locator("span").nth(2).locator("strong").innerText()).trim();
  const empty = (await page.locator(".plat-report .attn-placeholder").count()) > 0;
  const rows = empty
    ? []
    : await page.locator(".plat-table > div[role='row']").evaluateAll((nodes) =>
        nodes.map((node) => {
          const cells = [...node.querySelectorAll(":scope > span")].map((cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim());
          const ticket = node.querySelector(".plat-ticket");
          const code = (ticket?.querySelector("b")?.textContent ?? "").trim();
          const subject = (ticket?.querySelector("em")?.textContent ?? "").trim();
          return {
            code,
            subject,
            company: cells[1] ?? "",
            requester: cells[2] ?? "",
            channel: cells[3] ?? "",
            status: cells[4] ?? "",
          };
        })
      );
  return { received, open, resolved, rows, empty };
}

async function shoot(page: Page, name: string) {
  await page.locator(".plat-report").evaluate((el) => {
    const section = el as HTMLElement;
    section.style.overflow = "visible";
    section.style.height = "auto";
    section.style.maxHeight = "none";
    const win = section.closest(".is-platform-capsule") as HTMLElement | null;
    if (win) {
      win.style.height = "auto";
      win.style.maxHeight = "none";
      win.style.overflow = "visible";
    }
  });
  await page.locator(".is-platform-capsule").screenshot({ path: `${OUT}/${name}.png` });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) throw new Error("Faltan MONGODB_URI o MONGODB_DB");
  await mkdir(OUT, { recursive: true });
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const user = await db.collection("identity_users").findOne({ email: "soporte@mentorprime.cl" });
  if (!user?._id) throw new Error("No está el usuario de mesa");
  const sessionId = `sess_ui_report_${randomUUID()}`;
  const now = new Date().toISOString();
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: user._id,
    tenantId: "",
    createdAt: now,
    lastActivity: now,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    userAgent: "cursor-ui-report-verify",
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  await context.addCookies([{ name: "ah_session", value: sessionId, url: BASE }]);
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  try {
    const api = await context.request.get(`${BASE}/api/desktop/attention`);
    const body = (await api.json()) as { ok?: boolean; desk?: string; companies?: { tenantId: string; name: string }[]; cases?: CaseRow[] };
    if (!api.ok() || !body.ok || body.desk !== "platform") {
      throw new Error(`API de atención no está en plataforma (${api.status()}, desk=${body.desk ?? "none"})`);
    }
    const since = Date.now() - 30 * 86_400_000;
    const companies = body.companies ?? [];
    const cases = body.cases ?? [];

    const loaded = await page.goto(`${BASE}/escritorio`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/escritorio.png`, fullPage: true });
    const buttons = await page.getByRole("button").evaluateAll((nodes) =>
      nodes.map((node) => (node.getAttribute("aria-label") || node.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 40)
    );
    const attention = page.getByRole("button", { name: "Atención" }).filter({ hasNotText: "Chat en vivo" });
    if ((await attention.count()) === 0) {
      throw new Error(`No está Atención en ${page.url()} status=${loaded?.status() ?? "?"}. Botones: ${buttons.join(" | ")}`);
    }
    await attention.first().click();
    await page.getByRole("button", { name: "Informes de incidencias" }).click();
    await page.getByLabel("Empresa del informe").waitFor();
    const period = await page.getByLabel("Período").inputValue();
    const periodText = await page.getByLabel("Período").locator("option:checked").innerText();
    if (period !== "30") throw new Error(`El período no es 30: ${period}`);

    const targets = [
      { key: "mentor-capacitacion", label: "Mentor Capacitación", tenantId: "mentor-prime-capacitacion" },
      { key: "seminario-ipn", label: "Seminario Eclesiástico Mayor", tenantId: "seminario-ipn" },
    ];
    const reports = [];

    for (const target of targets) {
      const company = companies.find((item) => item.tenantId === target.tenantId);
      if (!company) {
        const names = companies.map((item) => `${item.name} [${item.tenantId}]`).join(" | ");
        throw new Error(`No está ${target.label}. Empresas: ${names}`);
      }
      await page.getByLabel("Empresa del informe").selectOption(company.tenantId);
      await page.getByLabel("Canal del informe").selectOption({ label: "Chat en vivo" });
      await page.waitForTimeout(200);
      const ui = await readUi(page);
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Exportar" }).click();
      const download = await downloadPromise;
      const csvPath = `${OUT}/${target.key}.csv`;
      await download.saveAs(csvPath);
      const csvText = await readFile(csvPath, "utf8");
      const csvRows = parseCsv(csvText);

      const filtered = filterIncidents(cases, { since, tenantId: company.tenantId, channel: "envivo" });
      const expectedRows: UiRow[] = filtered.map((item) => ({
        code: item.code,
        subject: item.subject,
        company: item.company,
        requester: item.requesterName,
        channel: item.channelLabel || intakeChannelLabel(resolveIntakeChannel(item)),
        status: statusLabel(item.status),
      }));
      const expectedCsv = incidentCsv(expectedRows);
      const totals = incidentTotals(filtered);
      const lines = incidentReportLines({
        company: company.name,
        periodLabel: "Últimos 30 días",
        channelLabel: "Chat en vivo",
        totals,
        rows: expectedRows.map((row) => ({
          code: row.code,
          subject: row.subject,
          requester: row.requester,
          channel: row.channel,
          status: row.status,
        })),
        emittedAt: "cotejo",
      });
      const pdf = buildIncidentReportPdf({
        company: company.name,
        periodLabel: "Últimos 30 días",
        channelLabel: "Chat en vivo",
        totals,
        rows: expectedRows.map((row) => ({
          code: row.code,
          subject: row.subject,
          requester: row.requester,
          channel: row.channel,
          status: row.status,
        })),
        emittedAt: "cotejo",
      });
      await writeFile(`${OUT}/${target.key}.pdf`, pdf);

      await shoot(page, target.key);
      const sameRows = JSON.stringify(ui.rows) === JSON.stringify(expectedRows);
      const sameCsv = csvText.replace(/^\uFEFF/, "").trim() === expectedCsv.trim();
      const pdfCodes = expectedRows.every((row) => pdfHas(pdf, row.code));
      const pdfTotals =
        pdfHas(pdf, `Recibidas: ${totals.received}`) &&
        pdfHas(pdf, `Abiertas: ${totals.open}`) &&
        pdfHas(pdf, `Resueltas: ${totals.resolved}`);
      reports.push({
        company: company.name,
        tenantId: company.tenantId,
        period: periodText,
        channel: await page.getByLabel("Canal del informe").locator("option:checked").innerText(),
        ui,
        csvRows,
        expected: { totals, rows: expectedRows },
        pdfLines: lines,
        checks: {
          uiMatchesFilter: sameRows,
          uiTotals: ui.received === String(totals.received) && ui.open === String(totals.open) && ui.resolved === String(totals.resolved),
          csvMatchesUi: JSON.stringify(csvRows) === JSON.stringify(ui.rows),
          csvMatchesFilter: sameCsv,
          pdfHasEveryCode: pdfCodes,
          pdfHasTotals: pdfTotals,
          pdfHasAC00019: pdfHas(pdf, "AC-00019"),
          pdfHasAC00026: pdfHas(pdf, "AC-00026"),
          countAC00019: ui.rows.filter((row) => row.code === "AC-00019").length,
          countAC00026: ui.rows.filter((row) => row.code === "AC-00026").length,
        },
      });
    }

    const mentor = reports.find((item) => item.tenantId === "mentor-prime-capacitacion");
    const seminario = reports.find((item) => item.tenantId === "seminario-ipn");
    const summary = {
      commit: "53884927d0f4e1f1d962ec81309e4863de42c86c",
      server: "next start http://localhost:3000",
      period: periodText,
      mentorExcludesAC00019: mentor?.checks.countAC00019 === 0,
      seminarioAC00026Once: seminario?.checks.countAC00026 === 1,
      reports: reports.map((item) => ({
        company: item.company,
        channel: item.channel,
        period: item.period,
        uiTotals: { received: item.ui.received, open: item.ui.open, resolved: item.ui.resolved },
        filterTotals: item.expected.totals,
        codes: item.ui.rows.map((row) => row.code),
        checks: item.checks,
        rows: item.ui.rows,
      })),
    };
    await writeFile(`${OUT}/result.json`, JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
    await db.collection("identity_sessions").deleteOne({ _id: sessionId });
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
