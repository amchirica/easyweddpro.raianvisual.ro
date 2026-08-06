export const APP_NAME = "EasyWedd Pro";
export const APP_TAGLINE = "Business OS pentru profesioniștii din industria evenimentelor";
export const APP_PROMISE =
  "Gestionează leadurile, clienții, ofertele, contractele, plățile, echipa și proiectele dintr-un singur loc.";
export const APP_HERO_ALT = "Mai multe rezervări. Mai puțin haos.";
export const APP_SUBTITLE =
  "EasyWedd Pro centralizează vânzările, contractele, proiectele și relația cu clienții pentru furnizorii din industria evenimentelor.";
export const APP_SEO_DESCRIPTION =
  "CRM și Business OS pentru furnizori de evenimente — leaduri, oferte, contracte, calendar, plăți, proiecte și echipă.";
export const PRODUCTION_SITE_URL = "https://easyweddpro.raianvisual.ro";
export const WORKSPACE_COOKIE = "ewp_workspace_id";

export const SUPPORT_EMAIL = "hello@raianvisual.ro";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "manager"
  | "sales"
  | "editor"
  | "collaborator"
  | "viewer";

export const WORKSPACE_ROLES: WorkspaceRole[] = [
  "owner",
  "admin",
  "manager",
  "sales",
  "editor",
  "collaborator",
  "viewer",
];

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Proprietar",
  admin: "Administrator",
  manager: "Manager",
  sales: "Vânzări",
  editor: "Editor",
  collaborator: "Colaborator",
  viewer: "Vizitator",
};

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Lead nou",
  contacted: "Contactat",
  qualified: "Calificat",
  proposal_sent: "Ofertă trimisă",
  negotiation: "Negociere",
  won: "Contract câștigat",
  lost: "Pierdut",
};

/**
 * Union of generic + specialized pipeline statuses.
 * Default UI uses the generic pipeline from `lib/events/project-pipelines`.
 * Photo-video statuses remain for specialized templates and legacy demo data.
 */
export const PROJECT_STATUSES = [
  "booked",
  "prep",
  "logistics",
  "event_done",
  "follow_up",
  "backup",
  "selection",
  "photo_edit",
  "video_edit",
  "album",
  "review",
  "delivery",
  "completed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  booked: "Rezervare",
  prep: "Pregătire",
  logistics: "Confirmare logistică",
  event_done: "Eveniment",
  follow_up: "Follow-up",
  backup: "Backup",
  selection: "Selecție",
  photo_edit: "Editare foto",
  video_edit: "Editare video",
  album: "Album",
  review: "Verificare",
  delivery: "Livrare",
  completed: "Închidere",
};

/** Default kanban columns for workspaces without a specialized pipeline. */
export const DEFAULT_PROJECT_PIPELINE = [
  "booked",
  "prep",
  "logistics",
  "event_done",
  "follow_up",
  "delivery",
  "completed",
] as const satisfies readonly ProjectStatus[];

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Ciornă",
  sent: "Trimisă",
  viewed: "Vizualizată",
  accepted: "Acceptată",
  rejected: "Refuzată",
  expired: "Expirată",
  cancelled: "Anulată",
};

export const CONTRACT_STATUSES = [
  "draft",
  "published",
  "viewed",
  "accepted",
  "expired",
  "cancelled",
  "superseded",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Ciornă",
  published: "Publicat",
  viewed: "Vizualizat",
  accepted: "Acceptat",
  expired: "Expirat",
  cancelled: "Anulat",
  superseded: "Înlocuit",
};

export const PAYMENT_STATUSES = [
  "pending",
  "partial",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "În așteptare",
  partial: "Parțial",
  paid: "Plătit",
  overdue: "Restant",
  cancelled: "Anulat",
  refunded: "Rambursat",
};

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "online",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Numerar",
  bank_transfer: "Transfer bancar",
  card: "Card",
  online: "Online",
  other: "Altele",
};

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "De făcut",
  in_progress: "În lucru",
  blocked: "Blocat",
  done: "Finalizat",
  cancelled: "Anulat",
};

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Scăzută",
  normal: "Normală",
  high: "Ridicată",
  urgent: "Urgentă",
};

export const CALENDAR_EVENT_STATUSES = [
  "confirmed",
  "tentative",
  "cancelled",
] as const;

export type CalendarEventStatus = (typeof CALENDAR_EVENT_STATUSES)[number];
