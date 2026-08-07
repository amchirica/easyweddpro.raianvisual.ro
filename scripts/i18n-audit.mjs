/**
 * Scans app/ and components/ for likely leftover Romanian UI strings
 * that are not routed through i18n keys (heuristic audit).
 *
 * Usage: node scripts/i18n-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = ["app", "components"];
const EXT = new Set([".tsx", ".ts", ".jsx", ".js"]);

const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const RO_PATTERNS = [
  /"(Caută|Salvează|Anulează|Autentificare|Leaduri|Clienți|Oferte|Contracte|Setări|Echipă|Plăți|Bună |Înapoi|Începe|Nu ai |Nimic de)/,
  /'(Caută|Salvează|Anulează|Autentificare|Leaduri|Clienți|Oferte|Contracte|Setări|Echipă|Plăți|Bună |Înapoi|Începe|Nu ai |Nimic de)/,
];

const IGNORE_PATH_PARTS = [
  `${path.sep}messages${path.sep}`,
  `${path.sep}__tests__${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `assistant${path.sep}knowledge${path.sep}`,
  `assistant${path.sep}i18n.ts`,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, out);
    } else if (EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function ignored(file) {
  return IGNORE_PATH_PARTS.some((p) => file.includes(p));
}

const hits = [];
for (const target of TARGETS) {
  for (const file of walk(path.join(ROOT, target))) {
    if (ignored(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!DIACRITICS.test(line) && !RO_PATTERNS.some((re) => re.test(line))) return;
      if (line.includes("t(") || line.includes("t`")) return;
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      hits.push({
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        line: idx + 1,
        text: line.trim().slice(0, 160),
      });
    });
  }
}

const byFile = new Map();
for (const hit of hits) {
  const list = byFile.get(hit.file) ?? [];
  list.push(hit);
  byFile.set(hit.file, list);
}

console.log(`i18n audit: ${hits.length} candidate leftover lines in ${byFile.size} files`);
const top = [...byFile.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 40);
for (const [file, list] of top) {
  console.log(`\n${file} (${list.length})`);
  for (const item of list.slice(0, 5)) {
    console.log(`  L${item.line}: ${item.text}`);
  }
}

const reportPath = path.join(ROOT, "scripts", "i18n-audit-report.json");
fs.writeFileSync(reportPath, JSON.stringify({ count: hits.length, files: byFile.size, hits }, null, 2));
console.log(`\nWrote ${path.relative(ROOT, reportPath)}`);
