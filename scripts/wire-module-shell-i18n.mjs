import fs from "node:fs";

const importLine = `import { useI18n } from "@/components/providers/i18n-provider";\n`;

const files = [
  {
    file: "components/proposals/proposals-list.tsx",
    reps: [
      ['title="Oferte"', 'title={t("modules.proposals.title")}'],
      [
        'description="Creează, trimite și urmărește ofertele pentru clienți și leaduri."',
        'description={t("modules.proposals.description")}',
      ],
    ],
  },
  {
    file: "components/contracts/contracts-list.tsx",
    reps: [['title="Contracte"', 'title={t("modules.contracts.title")}']],
  },
  {
    file: "components/payments/payments-list.tsx",
    reps: [['title="Plăți"', 'title={t("modules.payments.title")}']],
  },
  {
    file: "components/projects/projects-list.tsx",
    reps: [['title="Proiecte"', 'title={t("modules.projects.title")}']],
  },
  {
    file: "components/tasks/tasks-board.tsx",
    reps: [['title="Task-uri"', 'title={t("modules.tasks.title")}']],
  },
  {
    file: "components/calendar/calendar-board.tsx",
    reps: [['title="Calendar"', 'title={t("modules.calendar.title")}']],
  },
  {
    file: "components/templates/templates-list.tsx",
    reps: [['title="Template-uri"', 'title={t("modules.templates.title")}']],
  },
  {
    file: "components/automations/automations-list-client.tsx",
    reps: [['title="Automatizări"', 'title={t("modules.automations.title")}']],
  },
];

for (const { file, reps } of files) {
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes("useI18n")) {
    text = text.replace(/("use client";\r?\n)/, `$1\n${importLine}`);
    text = text.replace(/(export function \w+\([^{]*\{\r?\n)/, (m) => `${m}  const { t } = useI18n();\n`);
  }
  for (const [from, to] of reps) {
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text);
  console.log("updated", file);
}
