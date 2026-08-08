/**
 * Fix remaining standalone RO button labels in CRM leftovers.
 */
import fs from "node:fs";

function fixFile(file, reps) {
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of reps) {
    if (!text.includes(from)) continue;
    const before = text.split(from).length - 1;
    text = text.split(from).join(to);
    n += before;
  }
  fs.writeFileSync(file, text);
  console.log(file, n);
}

const cancelBtn = [
  ["\n              Anulează\n", '\n              {t("common.cancel")}\n'],
  ["\n            Anulează\n", '\n            {t("common.cancel")}\n'],
  ["\n                  Anulează\n", '\n                  {t("common.cancel")}\n'],
];

fixFile("components/leads/lead-detail.tsx", [
  ...cancelBtn,
]);
fixFile("components/leads/convert-lead-dialog.tsx", cancelBtn);
fixFile("components/payments/payment-detail.tsx", [
  ...cancelBtn,
  ["\n              Editează\n", '\n              {t("common.edit")}\n'],
  ["\n              Șterge\n", '\n              {t("common.delete")}\n'],
]);
fixFile("components/projects/project-detail.tsx", [
  ["\n              Editează\n", '\n              {t("common.edit")}\n'],
  ["\n              Arhivează\n", '\n              {t("common.archive")}\n'],
  ["\n              Șterge\n", '\n              {t("common.delete")}\n'],
  ["\n              Renunță\n", '\n              {t("common.dismiss")}\n'],
]);
fixFile("components/projects/project-form.tsx", cancelBtn);

console.log("leftovers fixed");
