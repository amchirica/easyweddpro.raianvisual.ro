/**
 * Full bidirectional i18n audit for EasyWedd Pro.
 *
 * Classifies string-like hits in app/components as:
 *   translated | intentionally-english | technical | user-generated | remaining
 *
 * Also checks RO↔EN message key parity.
 *
 * Usage:
 *   npx tsx scripts/i18n-audit.ts
 *   node --experimental-strip-types scripts/i18n-audit.ts
 *   npm run i18n:audit:full
 *
 * Writes:
 *   scripts/i18n-audit-full.json
 *   docs/I18N_FULL_AUDIT.md (summary tables)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = ["app", "components"];
const EXT = new Set([".tsx", ".ts"]);

const INTENTIONALLY_ENGLISH = [
  /\bEasyWedd Pro\b/,
  /\bDashboard\b/,
  /\bLeaduri?\b/,
  /\bCRM\b/,
  /\bBusiness OS\b/,
  /\bPipeline\b/,
  /\bWorkflow\b/,
  /\bFollow-up\b/i,
  /\bTemplate\b/,
  /\bAnalytics\b/,
  /\bFeature Flags?\b/,
  /\bWebhook\b/,
  /\bCron\b/,
  /\bAPI\b/,
  /\bAI\b/,
  /\bStorage\b/,
  /\bStripe\b/,
  /\bSupabase\b/,
  /\bCloudflare\b/,
  /\bPlatform Admin Help\b/,
];

const TECHNICAL = [
  /href=/,
  /className=/,
  /from\("/,
  /import /,
  /console\./,
  /process\.env/,
  /supabase/,
  /\.from\(/,
  /rpc\(/,
  /enum/,
  /status ===/,
  /type ===/,
];

const UGC_HINT = [/\.name\b/, /\.title\b/, /\.notes\b/, /\.description\b/, /fullName/, /clientName/, /company/];

/** Known non-UI persistence / sample data — not user-facing copy. */
const INTENTIONAL_REMAINING = [
  /Invitați:/,
  /Durată:/,
  /country:\s*"România"/,
  /event_location:\s*"Sala Regală/,
  /"București"/,
];

const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const RO_UI =
  /"(Caută|Salvează|Anulează|Autentificare|Clienți|Oferte|Contracte|Setări|Echipă|Plăți|Bună |Înapoi|Începe|Nu ai |Nimic de|Creează|Editează|Șterge|Trimite|Confirmă)/;

const SCOPE = [
  `${path.sep}dashboard${path.sep}`,
  `${path.sep}admin${path.sep}`,
  `${path.sep}portal${path.sep}`,
  `${path.sep}onboarding${path.sep}`,
  `${path.sep}(auth)${path.sep}`,
  `${path.sep}auth${path.sep}`,
  `${path.sep}components${path.sep}`,
  `${path.sep}app${path.sep}p${path.sep}`,
  `${path.sep}app${path.sep}c${path.sep}`,
];

type Hit = { file: string; line: number; text: string };

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "messages", "__tests__"].includes(entry.name)) continue;
      walk(full, out);
    } else if (EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function inScope(file: string): boolean {
  const rel = file.slice(ROOT.length);
  return SCOPE.some((s) => rel.includes(s));
}

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...flattenKeys(v, next));
    else keys.push(next);
  }
  return keys;
}

function messageParity(): {
  namespaces: string[];
  missingInEn: string[];
  missingInRo: string[];
} {
  const roDir = path.join(ROOT, "messages", "ro");
  const enDir = path.join(ROOT, "messages", "en");
  const namespaces = fs
    .readdirSync(roDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();

  const missingInEn: string[] = [];
  const missingInRo: string[] = [];

  for (const ns of namespaces) {
    const roPath = path.join(roDir, `${ns}.json`);
    const enPath = path.join(enDir, `${ns}.json`);
    if (!fs.existsSync(enPath)) {
      missingInEn.push(`${ns} (entire file)`);
      continue;
    }
    const ro = JSON.parse(fs.readFileSync(roPath, "utf8"));
    const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
    const roKeys = new Set(flattenKeys(ro));
    const enKeys = new Set(flattenKeys(en));
    for (const k of roKeys) if (!enKeys.has(k)) missingInEn.push(`${ns}.${k}`);
    for (const k of enKeys) if (!roKeys.has(k)) missingInRo.push(`${ns}.${k}`);
  }

  return { namespaces, missingInEn, missingInRo };
}

const classified = {
  translated: 0,
  "intentionally-english": [] as Hit[],
  technical: [] as Hit[],
  "user-generated": [] as Hit[],
  remaining: [] as Hit[],
  "intentional-remaining": [] as Hit[],
};

for (const target of TARGETS) {
  for (const file of walk(path.join(ROOT, target))) {
    if (!inScope(file)) continue;
    if (file.includes(`assistant${path.sep}knowledge`)) continue;

    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (trimmed.includes("t(") || trimmed.includes("t`") || trimmed.includes("getTranslator")) {
        classified.translated += 1;
        return;
      }
      const hasRo = DIACRITICS.test(line) || RO_UI.test(line);
      const hasIntentional = INTENTIONALLY_ENGLISH.some((re) => re.test(line));
      if (!hasRo && !hasIntentional) return;

      const item: Hit = { file: rel, line: idx + 1, text: trimmed.slice(0, 160) };
      if (INTENTIONAL_REMAINING.some((re) => re.test(line))) {
        classified["intentional-remaining"].push(item);
        return;
      }
      if (TECHNICAL.some((re) => re.test(line))) {
        classified.technical.push(item);
        return;
      }
      if (UGC_HINT.some((re) => re.test(line)) && !hasRo) {
        classified["user-generated"].push(item);
        return;
      }
      if (hasIntentional && !hasRo) {
        classified["intentionally-english"].push(item);
        return;
      }
      if (hasRo) classified.remaining.push(item);
    });
  }
}

const parity = messageParity();

const remainingByFile: Record<string, number> = {};
for (const hit of classified.remaining) {
  remainingByFile[hit.file] = (remainingByFile[hit.file] ?? 0) + 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  translatedLinesWithT: classified.translated,
  intentionallyEnglish: classified["intentionally-english"].length,
  technical: classified.technical.length,
  userGenerated: classified["user-generated"].length,
  intentionalRemaining: classified["intentional-remaining"].length,
  remainingUserFacingRo: classified.remaining.length,
  remainingByFile,
  parity: {
    namespaces: parity.namespaces,
    missingInEnCount: parity.missingInEn.length,
    missingInRoCount: parity.missingInRo.length,
    missingInEn: parity.missingInEn.slice(0, 100),
    missingInRo: parity.missingInRo.slice(0, 100),
  },
  acceptancePages: [
    "/dashboard",
    "/dashboard/settings",
    "/dashboard/proposals",
    "/dashboard/contracts",
    "/dashboard/leads",
    "/dashboard/clients",
    "/dashboard/payments",
    "/dashboard/projects",
    "/dashboard/tasks",
    "/dashboard/calendar",
    "/dashboard/analytics",
    "/admin/*",
  ],
};

const jsonOut = path.join(ROOT, "scripts", "i18n-audit-full.json");
fs.writeFileSync(
  jsonOut,
  JSON.stringify(
    {
      summary,
      remaining: classified.remaining,
      intentionalRemaining: classified["intentional-remaining"],
      intentionallyEnglishSample: classified["intentionally-english"].slice(0, 50),
    },
    null,
    2,
  ),
);

const md = `# I18N Full Audit — EasyWedd Pro

Generated: ${summary.generatedAt}

## Verdict

- User-facing RO leftovers (excluding intentional markers/samples): **${summary.remainingUserFacingRo}**
- Intentional non-UI leftovers: **${summary.intentionalRemaining}**
- RO↔EN key parity: missing in EN **${parity.missingInEn.length}**, missing in RO **${parity.missingInRo.length}**
- Lines already using \`t()\` / \`getTranslator\`: **${summary.translatedLinesWithT}**

## Classification counts

| Category | Count |
|---|---|
| translated | ${summary.translatedLinesWithT} |
| intentionally-english | ${summary.intentionallyEnglish} |
| technical | ${summary.technical} |
| user-generated (heuristic) | ${summary.userGenerated} |
| intentional-remaining | ${summary.intentionalRemaining} |
| remaining | ${summary.remainingUserFacingRo} |

## Intentionally English glossary

EasyWedd Pro, Business OS, CRM, Lead / Leaduri, Pipeline, Workflow, Follow-up, Template, Analytics, Feature Flags, Webhook, Cron, API, AI, Storage, Stripe, Supabase, Cloudflare. Product term **Dashboard** may remain in RO nav/titles.

## Intentional remaining (not UI copy)

${
  classified["intentional-remaining"].length === 0
    ? "_None_"
    : classified["intentional-remaining"]
        .map((h) => `- \`${h.file}:${h.line}\` — \`${h.text.replace(/`/g, "'")}\``)
        .join("\n")
}

## Remaining user-facing RO

${
  classified.remaining.length === 0
    ? "_None — acceptance criterion met for scanned surfaces._"
    : Object.entries(remainingByFile)
        .sort((a, b) => b[1] - a[1])
        .map(([f, n]) => `- **${n}** \`${f}\``)
        .join("\n")
}

## Message namespaces

${parity.namespaces.map((n) => `- \`${n}\``).join("\n")}

## Parity gaps

${
  parity.missingInEn.length === 0 && parity.missingInRo.length === 0
    ? "_RO and EN keys are in full parity._"
    : [
        parity.missingInEn.length
          ? `### Missing in EN\n\n${parity.missingInEn
              .slice(0, 50)
              .map((k) => `- \`${k}\``)
              .join("\n")}`
          : "",
        parity.missingInRo.length
          ? `### Missing in RO\n\n${parity.missingInRo
              .slice(0, 50)
              .map((k) => `- \`${k}\``)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")
}

## Acceptance pages (RO + EN)

${summary.acceptancePages.map((p) => `- \`${p}\``).join("\n")}

Soft locale switch: cookie \`ewp_locale\` + \`setLocale\` + \`router.refresh()\`. Client surfaces use \`useI18n()\`; SSR uses \`getTranslator()\`.

## How to re-run

\`\`\`bash
npm run i18n:audit:full
\`\`\`
`;

const docsDir = path.join(ROOT, "docs");
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
const mdOut = path.join(docsDir, "I18N_FULL_AUDIT.md");
fs.writeFileSync(mdOut, md);

console.log("=== i18n full audit ===");
console.log(JSON.stringify(summary, null, 2));
console.log(`\nWrote ${path.relative(ROOT, jsonOut)}`);
console.log(`Wrote ${path.relative(ROOT, mdOut)}`);

if (parity.missingInEn.length || parity.missingInRo.length) {
  console.error("\nParity failed.");
  process.exitCode = 1;
}
if (classified.remaining.length) {
  console.error(`\n${classified.remaining.length} remaining user-facing RO strings.`);
  process.exitCode = 1;
}
