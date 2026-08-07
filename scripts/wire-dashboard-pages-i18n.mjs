import fs from "node:fs";

const pages = [
  {
    file: "app/dashboard/automations/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/automations/new/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/automations/[id]/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/templates/new/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/templates/[id]/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/proposals/new/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/projects/new/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/payments/new/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/tasks/new/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/team/[id]/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/payments/[id]/page.tsx",
    needsImport: true,
  },
  {
    file: "app/dashboard/projects/[id]/edit/page.tsx",
    needsImport: true,
  },
];

const commonReps = [
  [
    'title="Nu ai permisiunea necesară"',
    'title={t("modules.permissionDenied")}',
  ],
  [
    'description="Contactează un administrator al workspace-ului pentru acces la automatizări."',
    'description={t("modules.permissionDeniedHint")}',
  ],
  [
    'description="Contactează un administrator al workspace-ului pentru acces la editarea template-urilor."',
    'description={t("modules.permissionDeniedHint")}',
  ],
  [
    'description="Contactează un administrator al workspace-ului pentru acces la crearea template-urilor."',
    'description={t("modules.permissionDeniedHint")}',
  ],
  [
    'description="Contactează un administrator al workspace-ului pentru acces la crearea ofertelor."',
    'description={t("modules.permissionDeniedHint")}',
  ],
  [
    'description="Contactează un administrator al workspace-ului pentru acces la crearea proiectelor."',
    'description={t("modules.permissionDeniedHint")}',
  ],
  [
    'description="Contactează un administrator al workspace-ului pentru acces la crearea plăților."',
    'description={t("modules.permissionDeniedHint")}',
  ],
  [
    'description="Contactează un administrator al workspace-ului pentru acces la crearea task-urilor."',
    'description={t("modules.permissionDeniedHint")}',
  ],
  ['title="Automatizări"', 'title={t("modules.automations.title")}'],
  [
    'description="Reguli automate care trimit mesaje și reminder-e fără intervenție manuală."',
    'description={t("modules.automations.description")}',
  ],
  [
    'description="Reguli automate pentru workspace-ul tău."',
    'description={t("modules.automations.description")}',
  ],
  ['title="Automatizare nouă"', 'title={t("modules.automations.new")}'],
  [
    'description="Creează o automatizare nouă."',
    'description={t("modules.automations.createDescription")}',
  ],
  [
    'description="Alege un declanșator, condiții opționale și acțiunile care se execută automat."',
    'description={t("modules.automations.createDescription")}',
  ],
  ['title="Automatizare"', 'title={t("modules.automations.edit")}'],
  [
    'description="Editează o automatizare existentă."',
    'description={t("modules.automations.editDescription")}',
  ],
  [
    'description="Actualizează declanșatorul, condițiile și acțiunile acestei automatizări."',
    'description={t("modules.automations.editDescription")}',
  ],
  [">Istoric rulări<", '>{t("modules.automations.runHistory")}<'],
  ["Automatizarea nu a rulat încă.", '{t("modules.automations.neverRan")}'],
  ['title="Eroare la încărcare"', 'title={t("modules.loadError")}'],
  [
    '"Nu am putut încărca automatizările."',
    't("common.loadFailed")',
  ],
  ['title="Template nou"', 'title={t("modules.templates.new")}'],
  [
    'description="Creează un template reutilizabil pentru workspace."',
    'description={t("modules.templates.description")}',
  ],
  [
    'description="Editează template-ul și previzualizează conținutul."',
    'description={t("modules.templates.description")}',
  ],
  ["Înapoi la template-uri", '{t("modules.backToList")}'],
  ['title="Ofertă nouă"', 'title={t("modules.proposals.new")}'],
  [
    'description="Creează o ofertă nouă pentru un client sau un lead."',
    'description={t("modules.proposals.description")}',
  ],
  ["Înapoi la oferte", '{t("modules.backToList")}'],
  ['title="Proiect nou"', 'title={t("modules.projects.new")}'],
  [
    'description="Creează un proiect nou pentru un client."',
    'description={t("modules.projects.description")}',
  ],
  ["Înapoi la proiecte", '{t("modules.backToList")}'],
  ['title="Plată nouă"', 'title={t("modules.payments.new")}'],
  [
    'description="Înregistrează un avans, o tranșă sau o plată."',
    'description={t("modules.payments.description")}',
  ],
  ["Înapoi la plăți", '{t("modules.backToList")}'],
  ['title="Task nou"', 'title={t("modules.tasks.new")}'],
  [
    'description="Creează un task nou pentru echipa ta."',
    'description={t("modules.tasks.description")}',
  ],
  ["Înapoi la task-uri", '{t("modules.backToList")}'],
  [
    'description="Rol, status și volum de lucru curent."',
    'description={t("modules.team.descriptionMember")}',
  ],
  ['"Membru echipă"', 't("modules.team.memberFallback")'],
  ['description="Detalii plată"', 'description={t("common.details")}'],
];

for (const { file, needsImport } of pages) {
  if (!fs.existsSync(file)) {
    console.log("skip missing", file);
    continue;
  }
  let text = fs.readFileSync(file, "utf8");
  if (needsImport && !text.includes("getTranslator")) {
    text = text.replace(
      /(import .+ from ["']@\/lib\/workspace\/session["'];?\r?\n)/,
      `$1import { getTranslator } from "@/lib/i18n/t";\n`,
    );
    if (!text.includes("getTranslator")) {
      // insert after first import block
      text = text.replace(
        /(import type \{ Metadata \} from ["']next["'];?\r?\n)/,
        `$1import { getTranslator } from "@/lib/i18n/t";\n`,
      );
    }
    // inject hook at start of default export function body
    text = text.replace(
      /(export default async function \w+\([^)]*\) \{)\r?\n/,
      `$1\n  const { t } = await getTranslator();\n`,
    );
  }
  for (const [from, to] of commonReps) {
    if (text.includes(from)) text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text);
  console.log("patched", file);
}
