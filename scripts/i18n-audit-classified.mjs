/**
 * Classified i18n audit for dashboard/admin/portal/auth/onboarding surfaces.
 * Categories: translated | intentionally-english | technical | user-generated | remaining
 *
 * Usage: node scripts/i18n-audit-classified.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = ["app", "components"];
const EXT = new Set([".tsx", ".ts"]);

const INTENTIONALLY_ENGLISH = [
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

const UGC_HINT = [
  /\.name\b/,
  /\.title\b/,
  /\.notes\b/,
  /\.description\b/,
  /fullName/,
  /clientName/,
  /company/,
];

const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const RO_UI = /"(Caută|Salvează|Anulează|Autentificare|Clienți|Oferte|Contracte|Setări|Echipă|Plăți|Bună |Înapoi|Începe|Nu ai |Nimic de|Creează|Editează|Șterge|Trimite|Confirmă)/;

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

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "messages"].includes(entry.name)) continue;
      walk(full, out);
    } else if (EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function inScope(file) {
  const rel = file.slice(ROOT.length);
  return SCOPE.some((s) => rel.includes(s));
}

const classified = {
  translated: 0,
  "intentionally-english": [],
  technical: [],
  "user-generated": [],
  remaining: [],
};

for (const target of TARGETS) {
  for (const file of walk(path.join(ROOT, target))) {
    if (!inScope(file)) continue;
    if (file.includes(`${path.sep}__tests__${path.sep}`)) continue;
    if (file.includes(`assistant${path.sep}knowledge`)) continue;

    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (trimmed.includes("t(") || trimmed.includes("t`")) {
        classified.translated += 1;
        return;
      }
      const hasRo = DIACRITICS.test(line) || RO_UI.test(line);
      const hasIntentional = INTENTIONALLY_ENGLISH.some((re) => re.test(line));
      if (!hasRo && !hasIntentional) return;

      const item = { file: rel, line: idx + 1, text: trimmed.slice(0, 140) };
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

const summary = {
  translatedLinesWithT: classified.translated,
  intentionallyEnglish: classified["intentionally-english"].length,
  technical: classified.technical.length,
  userGenerated: classified["user-generated"].length,
  remainingUserFacingRo: classified.remaining.length,
  remainingByFile: {},
};

for (const hit of classified.remaining) {
  summary.remainingByFile[hit.file] = (summary.remainingByFile[hit.file] ?? 0) + 1;
}

const outPath = path.join(ROOT, "scripts", "i18n-audit-classified.json");
fs.writeFileSync(
  outPath,
  JSON.stringify({ summary, remaining: classified.remaining.slice(0, 500) }, null, 2),
);

console.log("=== i18n classified audit ===");
console.log(JSON.stringify(summary, null, 2));
console.log(`\nWrote ${path.relative(ROOT, outPath)}`);
console.log(
  `\nTop remaining files:\n` +
    Object.entries(summary.remainingByFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([f, n]) => `  ${n}\t${f}`)
      .join("\n"),
);
