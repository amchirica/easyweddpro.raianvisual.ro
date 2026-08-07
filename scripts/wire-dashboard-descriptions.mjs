import fs from "node:fs";

const patches = [
  {
    file: "components/contracts/contracts-list.tsx",
    from: 'description="Contractele semnate și în curs de negociere cu clienții tăi."',
    to: 'description={t("modules.contracts.description")}',
  },
  {
    file: "components/payments/payments-list.tsx",
    from: 'description="Avansuri, tranșe și plăți restante pentru toți clienții."',
    to: 'description={t("modules.payments.description")}',
  },
  {
    file: "components/tasks/tasks-board.tsx",
    from: 'description="Task-urile echipei, organizate pe stadiu de progres."',
    to: 'description={t("modules.tasks.description")}',
  },
  {
    file: "components/calendar/calendar-board.tsx",
    from: 'description="Evenimente, întâlniri și termene limită."',
    to: 'description={t("modules.calendar.description")}',
  },
  {
    file: "components/calendar/calendar-board.tsx",
    from: 'title="Niciun eveniment"',
    to: 'title={t("modules.calendar.empty")}',
  },
  {
    file: "components/calendar/calendar-board.tsx",
    from: 'description="Adaugă primul eveniment în calendar."',
    to: 'description={t("modules.calendar.emptyHint")}',
  },
  {
    file: "components/calendar/calendar-board.tsx",
    from: 'title="Niciun eveniment găsit"',
    to: 'title={t("modules.calendar.emptyFiltered")}',
  },
  {
    file: "components/calendar/calendar-board.tsx",
    from: 'description="Ajustează căutarea sau filtrele pentru a vedea evenimente."',
    to: 'description={t("modules.calendar.emptyFilteredHint")}',
  },
  {
    file: "components/calendar/calendar-board.tsx",
    from: 'title="Fără evenimente în această zi"',
    to: 'title={t("modules.calendar.emptyDay")}',
  },
  {
    file: "components/calendar/calendar-board.tsx",
    from: 'description="Alege o altă zi sau adaugă un eveniment nou."',
    to: 'description={t("modules.calendar.emptyDayHint")}',
  },
  {
    file: "components/automations/automations-list-client.tsx",
    from: 'description="Reguli automate care trimit mesaje, creează task-uri și reminder-e fără intervenție manuală."',
    to: 'description={t("modules.automations.description")}',
  },
  {
    file: "components/automations/automations-list-client.tsx",
    from: 'title="Nicio automatizare"',
    to: 'title={t("modules.automations.empty")}',
  },
  {
    file: "components/automations/automations-list-client.tsx",
    from: 'description="Creează prima automatizare pentru a economisi timp."',
    to: 'description={t("modules.automations.emptyHint")}',
  },
  {
    file: "components/templates/templates-list.tsx",
    from: 'description="Template-uri reutilizabile pentru oferte, contracte, emailuri, sarcini, proiecte, pipeline-uri și automatizări."',
    to: 'description={t("modules.templates.description")}',
  },
  {
    file: "components/projects/projects-list.tsx",
    from: 'description="Pipeline configurabil — de la rezervare la închiderea proiectului."',
    to: 'description={t("modules.projects.description")}',
  },
  {
    file: "components/team/team-page-client.tsx",
    from: 'description="Invită colegi pentru a colabora în workspace."',
    to: 'description={t("modules.team.emptyHint")}',
  },
  {
    file: "components/clients/clients-page-client.tsx",
    from: 'description="Clienții apar automat după ce un lead este câștigat sau adăugat manual."',
    to: 'description={t("modules.clients.emptyHint")}',
  },
  {
    file: "components/leads/leads-board.tsx",
    from: 'description="Ajustează căutarea sau filtrele pentru a vedea leaduri."',
    to: 'description={t("modules.leads.emptyFilteredHint")}',
  },
];

for (const { file, from, to } of patches) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes(from)) {
    console.log("MISS", file, from.slice(0, 60));
    continue;
  }
  fs.writeFileSync(file, text.split(from).join(to));
  console.log("OK", file);
}
