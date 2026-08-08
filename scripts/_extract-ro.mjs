/**
 * Extract remaining RO UI lines from priority component files.
 */
import fs from "node:fs";

const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const RO_UI =
  /"(Caută|Salvează|Anulează|Autentificare|Clienți|Oferte|Contracte|Setări|Echipă|Plăți|Bună |Înapoi|Începe|Nu ai |Nimic de|Creează|Editează|Șterge|Trimite|Confirmă)/;

const files = process.argv.slice(2);
for (const f of files) {
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  console.log("\n===" + f + "===");
  lines.forEach((line, i) => {
    if (line.includes("t(") || line.includes("t`")) return;
    if (DIACRITICS.test(line) || RO_UI.test(line)) {
      console.log(String(i + 1).padStart(4) + ": " + line.trim().slice(0, 160));
    }
  });
}
