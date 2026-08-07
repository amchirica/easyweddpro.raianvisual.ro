import type { WorkflowStep } from "@/lib/assistant/knowledge/types";

/** Canonical commercial + delivery flow — only existing product steps. */
export const MAIN_WORKFLOW: WorkflowStep[] = [
  {
    key: "lead",
    title: "Lead",
    titleEn: "Lead",
    description: "Capturezi cererea în pipeline (Leaduri).",
    descriptionEn: "Capture the request in the Leads pipeline.",
    moduleKey: "leads",
  },
  {
    key: "client",
    title: "Client",
    titleEn: "Client",
    description: "Convertești leadul în client (acțiune dedicată pe lead).",
    descriptionEn: "Convert the lead to a client.",
    moduleKey: "clients",
  },
  {
    key: "proposal",
    title: "Ofertă",
    titleEn: "Proposal",
    description: "Creezi și publici oferta pe link public.",
    descriptionEn: "Create and publish the proposal public link.",
    moduleKey: "proposals",
  },
  {
    key: "acceptance",
    title: "Acceptare ofertă",
    titleEn: "Proposal acceptance",
    description: "Clientul acceptă oferta din portal/link.",
    descriptionEn: "Client accepts via portal/link.",
    moduleKey: "proposals",
  },
  {
    key: "contract",
    title: "Contract",
    titleEn: "Contract",
    description:
      "Creezi contract (inclusiv din ofertă), editezi draftul, publici, aștepți acceptarea digitală.",
    descriptionEn: "Create contract (incl. from proposal), edit draft, publish, await acceptance.",
    moduleKey: "contracts",
  },
  {
    key: "payment",
    title: "Plată / avans",
    titleEn: "Payment / deposit",
    description: "Înregistrezi avansul și tranșele în Plăți.",
    descriptionEn: "Record deposit and installments in Payments.",
    moduleKey: "payments",
  },
  {
    key: "project",
    title: "Proiect",
    titleEn: "Project",
    description: "Deschizi proiectul (inclusiv din contract) și urmezi etapele.",
    descriptionEn: "Open the project (incl. from contract) and follow stages.",
    moduleKey: "projects",
  },
  {
    key: "tasks",
    title: "Task-uri",
    titleEn: "Tasks",
    description: "Aloci checklist și task-uri echipei.",
    descriptionEn: "Assign checklist and tasks to the team.",
    moduleKey: "tasks",
  },
  {
    key: "event",
    title: "Eveniment",
    titleEn: "Event",
    description: "Urmărești data în Calendar și pe proiect.",
    descriptionEn: "Track the date in Calendar and on the project.",
    moduleKey: "calendar",
  },
  {
    key: "delivery",
    title: "Livrare",
    titleEn: "Delivery",
    description: "Finalizezi etapele de livrare din proiect.",
    descriptionEn: "Complete delivery stages on the project.",
    moduleKey: "projects",
  },
  {
    key: "follow_up",
    title: "Follow-up",
    titleEn: "Follow-up",
    description: "Remindere și review prin automatizări / task-uri (unde planul permite).",
    descriptionEn: "Reminders and review via automations/tasks (plan permitting).",
    moduleKey: "automations",
  },
];

export function workflowAfterProposalAccepted(locale: "ro" | "en"): string {
  if (locale === "en") {
    return [
      "After the client accepts the proposal:",
      "1. Create a contract (from the proposal when available) — Contracts module.",
      "2. Edit the draft, then publish for digital acceptance.",
      "3. Record the deposit/payment in Payments.",
      "4. Create a project from the contract and assign tasks.",
      "5. Track the event in Calendar through delivery and follow-up.",
    ].join("\n");
  }
  return [
    "După ce clientul acceptă oferta:",
    "1. Creezi contractul (din ofertă, când e disponibil) — modulul Contracte.",
    "2. Editezi draftul, apoi publici pentru acceptare digitală.",
    "3. Înregistrezi avansul/plata în Plăți.",
    "4. Creezi proiectul din contract și aloci task-uri.",
    "5. Urmărești evenimentul în Calendar până la livrare și follow-up.",
  ].join("\n");
}
