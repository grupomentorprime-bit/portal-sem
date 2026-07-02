import fs from "fs";
import path from "path";

const replacements = [
  [/bg-zinc-50 dark:bg-zinc-950/g, "bg-background-soft dark:bg-gray-900"],
  [/bg-zinc-50/g, "bg-background-soft"],
  [/dark:bg-zinc-950/g, "dark:bg-gray-900"],
  [/border-zinc-200/g, "border-border"],
  [/dark:border-zinc-800/g, "dark:border-gray-700"],
  [/border-zinc-700/g, "border-gray-700"],
  [/border-zinc-300/g, "border-gray-300"],
  [/dark:border-zinc-700/g, "dark:border-gray-700"],
  [/bg-white dark:bg-zinc-900/g, "bg-background dark:bg-gray-900"],
  [/bg-white/g, "bg-background"],
  [/dark:bg-zinc-900/g, "dark:bg-gray-900"],
  [/text-zinc-500/g, "text-muted"],
  [/text-zinc-900 dark:text-zinc-50/g, "text-foreground dark:text-gray-50"],
  [/text-zinc-900 dark:text-zinc-100/g, "text-foreground dark:text-gray-100"],
  [/text-zinc-900/g, "text-foreground"],
  [/dark:text-zinc-50/g, "dark:text-gray-50"],
  [/dark:text-zinc-100/g, "dark:text-gray-100"],
  [/text-zinc-600/g, "text-muted"],
  [/dark:text-zinc-300/g, "dark:text-gray-300"],
  [/text-zinc-400/g, "text-gray-400"],
  [/dark:text-zinc-400/g, "dark:text-gray-400"],
  [/bg-zinc-100/g, "bg-background-muted"],
  [/dark:bg-zinc-800/g, "dark:bg-gray-800"],
  [/hover:bg-zinc-100/g, "hover:bg-background-muted"],
  [/dark:hover:bg-zinc-800/g, "dark:hover:bg-gray-800"],
  [/bg-zinc-900 text-white/g, "bg-primary text-text-inverse"],
  [/dark:bg-zinc-100 dark:text-zinc-900/g, "dark:bg-gray-100 dark:text-gray-900"],
  [/hover:bg-zinc-800/g, "hover:bg-secondary"],
  [/dark:hover:bg-white/g, "dark:hover:bg-background"],
  [/bg-zinc-900/g, "bg-primary"],
  [/dark:bg-zinc-100/g, "dark:bg-gray-100"],
  [/hover:border-zinc-300/g, "hover:border-gray-300"],
  [/dark:hover:border-zinc-700/g, "dark:hover:border-gray-600"],
  [/hover:border-zinc-400/g, "hover:border-gray-400"],
  [/divide-zinc-200/g, "divide-border"],
  [/dark:divide-zinc-800/g, "dark:divide-gray-700"],
  [/text-red-600/g, "text-[var(--color-danger)]"],
  [/text-red-700/g, "text-[var(--color-danger)]"],
  [/bg-red-50/g, "bg-[var(--state-danger-bg)]"],
  [/border-red-200/g, "border-[var(--state-danger-border)]"],
  [/dark:bg-red-950\/30/g, "dark:bg-[var(--state-danger-bg)]"],
  [/hover:bg-red-50/g, "hover:bg-[var(--state-danger-bg)]"],
  [/hover:text-red-600/g, "hover:text-[var(--color-danger)]"],
  [/text-emerald-600/g, "text-success"],
  [/text-emerald-700/g, "text-success"],
  [/text-emerald-800/g, "text-success"],
  [/text-emerald-900/g, "text-success"],
  [/bg-emerald-100/g, "bg-success/15"],
  [/bg-emerald-50/g, "bg-success/10"],
  [/dark:bg-emerald-950\/50/g, "dark:bg-success/20"],
  [/dark:bg-emerald-950\/30/g, "dark:bg-success/15"],
  [/dark:text-emerald-300/g, "dark:text-success"],
  [/dark:text-emerald-200/g, "dark:text-success"],
  [/border-emerald-200/g, "border-success/30"],
  [/border-emerald-500/g, "border-success"],
  [/dark:border-emerald-900/g, "dark:border-success/40"],
  [/text-amber-500/g, "text-[var(--color-warning)]"],
  [/text-amber-600/g, "text-[var(--color-warning)]"],
  [/text-amber-700/g, "text-[var(--color-warning)]"],
  [/text-amber-800/g, "text-[var(--color-warning)]"],
  [/text-amber-900/g, "text-[var(--color-warning)]"],
  [/bg-amber-50/g, "bg-[var(--state-warning-bg)]"],
  [/bg-amber-100/g, "bg-[var(--state-warning-bg)]"],
  [/border-amber-200/g, "border-[var(--state-warning-border)]"],
  [/border-amber-500/g, "border-[var(--color-warning)]"],
  [/dark:bg-amber-950\/30/g, "dark:bg-[var(--state-warning-bg)]"],
  [/dark:border-amber-900/g, "dark:border-[var(--state-warning-border)]"],
  [/dark:text-amber-200/g, "dark:text-[var(--color-warning)]"],
  [/hover:text-amber-500/g, "hover:text-[var(--color-warning)]"],
  [/text-blue-600/g, "text-secondary"],
  [/border-red-500/g, "border-[var(--color-danger)]"],
];

const skip = new Set([
  "ConfigurationLayout.tsx",
  "PortalStatusCard.tsx",
]);

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
  return files;
}

const roots = [
  "src/components/content",
  "src/components/media",
  "src/components/menu",
  "src/components/identity",
  "src/components/events",
  "src/components/config",
  "src/components/navigation",
  "src/components/workflow",
  "src/app/admin",
];

for (const root of roots) {
  const full = path.join(process.cwd(), root);
  if (!fs.existsSync(full)) continue;
  for (const fp of walk(full)) {
    if (skip.has(path.basename(fp))) continue;
    let content = fs.readFileSync(fp, "utf8");
    const orig = content;
    for (const [re, rep] of replacements) content = content.replace(re, rep);
    if (content !== orig) {
      fs.writeFileSync(fp, content);
      console.log("updated", path.relative(process.cwd(), fp));
    }
  }
}
