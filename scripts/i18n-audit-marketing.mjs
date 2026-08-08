/**
 * Audit marketing/landing components for remaining hardcoded Romanian UI strings.
 * Usage: node scripts/i18n-audit-marketing.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  "components/marketing",
  "app/(marketing)",
];
const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const RO_UI =
  /"(Începe|Vezi |Prețuri|Întrebări|Condu |Organizează|Modulele|Construit|Disponibil|Confidențialitate|Autentificare|Creează cont|Funcționalități|Cel mai popular|Gratuit|Nelimitat)/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const remaining = [];
let translated = 0;

for (const target of TARGETS) {
  for (const file of walk(path.join(ROOT, target))) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (trimmed.includes('t("') || trimmed.includes("t(`") || trimmed.includes("ta(") || trimmed.includes("tm(")) {
        translated += 1;
        return;
      }
      if (DIACRITICS.test(line) || RO_UI.test(line)) {
        remaining.push({ file: rel, line: idx + 1, text: trimmed.slice(0, 160) });
      }
    });
  }
}

console.log(
  JSON.stringify(
    {
      translatedLinesWithT: translated,
      remainingUserFacingRo: remaining.length,
      remaining,
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(ROOT, "scripts", "i18n-audit-marketing.json"),
  JSON.stringify({ translatedLinesWithT: translated, remainingUserFacingRo: remaining.length, remaining }, null, 2),
);
