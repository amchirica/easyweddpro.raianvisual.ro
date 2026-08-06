import type {
  ContractStatus,
  LeadStatus,
  PaymentStatus,
  ProjectStatus,
  ProposalStatus,
} from "@/lib/constants";
import type { ContractSections } from "@/lib/contracts/content";

export type DemoLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  city: string;
  venue: string;
  budget: number;
  source: string;
  services: string[];
  notes: string;
  owner: string;
  status: LeadStatus;
  estimatedValue: number;
  followUpDate: string | null;
  tags: string[];
  lostReason?: string;
  createdAt: string;
};

export type DemoClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  eventDate: string;
  eventType: string;
  status: "active" | "past" | "lead_converted";
  totalValue: number;
  notes: string;
};

export type DemoProposalItem = {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export type DemoProposal = {
  id: string;
  clientName: string;
  title: string;
  packageName: string;
  amount: number;
  status: ProposalStatus;
  validUntil: string;
  createdAt: string;
  publicToken: string;
  items?: DemoProposalItem[];
  notes?: string;
  terms?: string;
  discountType?: "none" | "percent" | "fixed";
  discountValue?: number;
  taxRate?: number;
};

export type DemoContract = {
  id: string;
  clientName: string;
  clientId?: string;
  proposalId?: string;
  title: string;
  amount: number;
  deposit: number;
  remaining?: number;
  status: ContractStatus;
  signedAt: string | null;
  eventDate: string;
  eventLocation?: string | null;
  contractNumber?: string | null;
  publicToken?: string | null;
  validUntil?: string | null;
  updatedAt?: string;
  terms?: string | null;
  services?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  sections?: Partial<ContractSections>;
};

export type DemoPayment = {
  id: string;
  clientName: string;
  label: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  method: "transfer" | "cash" | "card" | "other";
  status: PaymentStatus;
};

export type DemoProject = {
  id: string;
  name: string;
  clientName: string;
  eventDate: string;
  status: ProjectStatus;
  team: string[];
  deadline: string;
  progress: number;
};

export type DemoTask = {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "doing" | "done";
  assignee: string;
};

export type DemoCalendarEvent = {
  id: string;
  title: string;
  type: "event" | "meeting" | "deadline" | "payment" | "task" | "time_off";
  start: string;
  end: string;
  color: string;
};

export type DemoActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  at: string;
  actor: string;
};

export type DemoAutomation = {
  id: string;
  name: string;
  trigger: string;
  channel: "email" | "internal";
  enabled: boolean;
  lastRun: string | null;
};

export const DEMO_WORKSPACE = {
  id: "ws_demo_raian",
  name: "Studio Raian Fine Arts",
  plan: "studio" as const,
  city: "București",
  country: "România",
  currency: "RON",
  activityType: "Fotografie & videografie evenimente",
};

/** Cross-industry demo workspaces (isolated conceptually; active demo remains Raian Visual). */
export const DEMO_INDUSTRY_WORKSPACES = [
  {
    id: "ws_demo_raian",
    name: "Studio Raian Visual",
    industry: "photo_video",
    activityType: "Foto & video",
    note: "Workspace demo / client pilot foto-video",
  },
  {
    id: "ws_demo_nova",
    name: "Nova Events",
    industry: "planning",
    activityType: "Wedding & event planning",
    note: "Planner — coordonare clienți și furnizori",
  },
  {
    id: "ws_demo_elysium",
    name: "Elysium Events",
    industry: "venue",
    activityType: "Locație & salon evenimente",
    note: "Locație — săli, meniuri, rezervări",
  },
  {
    id: "ws_demo_soundcraft",
    name: "SoundCraft",
    industry: "music_entertainment",
    activityType: "DJ & sonorizare",
    note: "DJ — disponibilitate, echipamente, prestații",
  },
  {
    id: "ws_demo_bloom",
    name: "Bloom Atelier",
    industry: "decor_flowers",
    activityType: "Decor & flori",
    note: "Decor — inventar, montaj, demontaj",
  },
  {
    id: "ws_demo_sweet",
    name: "Sweet Moments",
    industry: "catering_dessert",
    activityType: "Candy bar & cofetărie",
    note: "Candy bar — meniuri desert, logistică",
  },
] as const;

export const DEMO_USER = {
  id: "user_demo",
  fullName: "Raian Fine Arts",
  email: "studio@raianvisual.ro",
  role: "owner" as const,
  avatarInitials: "RV",
};

export const DEMO_LEADS: DemoLead[] = [
  {
    id: "lead_1",
    name: "Andreea & Mihai Popescu",
    email: "andreea.popescu@email.com",
    phone: "+40 721 111 222",
    eventType: "Nuntă",
    eventDate: "2026-09-12",
    city: "București",
    venue: "Palatul Snagov",
    budget: 18000,
    source: "Instagram",
    services: ["Foto", "Video", "Same-day edit"],
    notes: "Vor stil editorial, preferă tonuri calde.",
    owner: "Raian Fine Arts",
    status: "negotiation",
    estimatedValue: 16500,
    followUpDate: "2026-08-08",
    tags: ["premium", "nuntă"],
    createdAt: "2026-07-18T10:00:00Z",
  },
  {
    id: "lead_2",
    name: "Ioana Marinescu",
    email: "ioana.m@email.com",
    phone: "+40 722 333 444",
    eventType: "Botez",
    eventDate: "2026-08-22",
    city: "Ploiești",
    venue: "Restaurant Belvedere",
    budget: 4500,
    source: "Recomandare",
    services: ["Foto"],
    notes: "Contactată telefonic, așteaptă ofertă.",
    owner: "Raian Fine Arts",
    status: "proposal_sent",
    estimatedValue: 3900,
    followUpDate: "2026-08-07",
    tags: ["botez"],
    createdAt: "2026-07-25T14:20:00Z",
  },
  {
    id: "lead_3",
    name: "Carmen & Andrei Ionescu",
    email: "carmen.ionescu@email.com",
    phone: "+40 723 555 666",
    eventType: "Nuntă",
    eventDate: "2026-10-03",
    city: "Brașov",
    venue: "Castelul Bran Estate",
    budget: 22000,
    source: "Website",
    services: ["Foto", "Video", "Drone", "Album"],
    notes: "Lead cald, buget confirmat.",
    owner: "Raian Fine Arts",
    status: "qualified",
    estimatedValue: 21000,
    followUpDate: "2026-08-06",
    tags: ["premium", "destination"],
    createdAt: "2026-07-28T09:10:00Z",
  },
  {
    id: "lead_4",
    name: "TechCorp România",
    email: "events@techcorp.ro",
    phone: "+40 724 777 888",
    eventType: "Corporate",
    eventDate: "2026-08-30",
    city: "București",
    venue: "JW Marriott",
    budget: 8000,
    source: "LinkedIn",
    services: ["Foto", "Video"],
    notes: "Eveniment 200 invitați.",
    owner: "Raian Fine Arts",
    status: "contacted",
    estimatedValue: 7500,
    followUpDate: "2026-08-09",
    tags: ["corporate"],
    createdAt: "2026-08-01T11:00:00Z",
  },
  {
    id: "lead_5",
    name: "Elena Radu",
    email: "elena.radu@email.com",
    phone: "+40 725 999 000",
    eventType: "Logodnă",
    eventDate: "2026-08-15",
    city: "Constanța",
    venue: "Mamaia Nord",
    budget: 2500,
    source: "Facebook",
    services: ["Foto"],
    notes: "Lead nou de pe formular.",
    owner: "Raian Fine Arts",
    status: "new",
    estimatedValue: 2200,
    followUpDate: null,
    tags: ["logodnă"],
    createdAt: "2026-08-04T16:40:00Z",
  },
  {
    id: "lead_6",
    name: "Diana & Vlad Stan",
    email: "diana.stan@email.com",
    phone: "+40 726 101 202",
    eventType: "Nuntă",
    eventDate: "2026-11-14",
    city: "Cluj-Napoca",
    venue: "Grand Hotel Italia",
    budget: 12000,
    source: "Google",
    services: ["Foto", "Video"],
    notes: "Au ales alt furnizor — buget depășit.",
    owner: "Raian Fine Arts",
    status: "lost",
    estimatedValue: 11000,
    followUpDate: null,
    tags: ["nuntă"],
    lostReason: "Buget",
    createdAt: "2026-06-12T08:00:00Z",
  },
  {
    id: "lead_7",
    name: "Maria & Cristian Dobre",
    email: "maria.dobre@email.com",
    phone: "+40 727 303 404",
    eventType: "Nuntă",
    eventDate: "2026-07-18",
    city: "București",
    venue: "Berăria H",
    budget: 14000,
    source: "Recomandare",
    services: ["Foto", "Video", "Album"],
    notes: "Contract semnat — convertit în client.",
    owner: "Raian Fine Arts",
    status: "won",
    estimatedValue: 13500,
    followUpDate: null,
    tags: ["câștigat"],
    createdAt: "2026-05-02T12:00:00Z",
  },
];

export const DEMO_CLIENTS: DemoClient[] = [
  {
    id: "client_1",
    name: "Maria & Cristian Dobre",
    email: "maria.dobre@email.com",
    phone: "+40 727 303 404",
    city: "București",
    eventDate: "2026-07-18",
    eventType: "Nuntă",
    status: "active",
    totalValue: 13500,
    notes: "Livrare galerie în august.",
  },
  {
    id: "client_2",
    name: "Ana & Bogdan Enache",
    email: "ana.enache@email.com",
    phone: "+40 728 505 606",
    city: "Timișoara",
    eventDate: "2026-06-06",
    eventType: "Nuntă",
    status: "active",
    totalValue: 15800,
    notes: "Album în producție.",
  },
  {
    id: "client_3",
    name: "Family Georgescu",
    email: "georgescu@email.com",
    phone: "+40 729 707 808",
    city: "București",
    eventDate: "2026-05-10",
    eventType: "Botez",
    status: "past",
    totalValue: 3200,
    notes: "Livrat integral.",
  },
  {
    id: "client_4",
    name: "Horizon Events",
    email: "office@horizonevents.ro",
    phone: "+40 730 909 101",
    city: "București",
    eventDate: "2026-09-05",
    eventType: "Corporate",
    status: "active",
    totalValue: 9200,
    notes: "Colaborare recurentă.",
  },
  {
    id: "client_5",
    name: "Laura & Paul Niculescu",
    email: "laura.n@email.com",
    phone: "+40 731 112 213",
    city: "Sibiu",
    eventDate: "2026-08-29",
    eventType: "Nuntă",
    status: "active",
    totalValue: 17200,
    notes: "Pregătire pre-eveniment.",
  },
];

export const DEMO_PROPOSALS: DemoProposal[] = [
  {
    id: "prop_1",
    clientName: "Andreea & Mihai Popescu",
    title: "Pachet Premium Nuntă",
    packageName: "Premium Full Day",
    amount: 16500,
    status: "viewed",
    validUntil: "2026-08-20",
    createdAt: "2026-07-30",
    publicToken: "demo-proposal-popescu",
    items: [
      { name: "Foto + video full day", quantity: 1, unitPrice: 14500 },
      { name: "Album foto premium", quantity: 1, unitPrice: 1500 },
      { name: "Drone", quantity: 1, unitPrice: 800 },
    ],
    notes: "Client interesat de pachetul premium, urmărește follow-up.",
    terms: "Avans 30% la semnarea contractului, rest la eveniment. Anulare cu 30 de zile înainte.",
    discountType: "none",
    discountValue: 0,
    taxRate: 0,
  },
  {
    id: "prop_2",
    clientName: "Ioana Marinescu",
    title: "Pachet Botez Classic",
    packageName: "Classic Photo",
    amount: 3900,
    status: "sent",
    validUntil: "2026-08-15",
    createdAt: "2026-08-01",
    publicToken: "demo-proposal-marinescu",
    items: [{ name: "Foto botez — pachet classic", quantity: 1, unitPrice: 3900 }],
    terms: "Avans 50% la confirmare.",
    discountType: "none",
    discountValue: 0,
    taxRate: 0,
  },
  {
    id: "prop_3",
    clientName: "Laura & Paul Niculescu",
    title: "Pachet Signature",
    packageName: "Signature Cinema",
    amount: 17200,
    status: "accepted",
    validUntil: "2026-07-01",
    createdAt: "2026-06-10",
    publicToken: "demo-proposal-niculescu",
    items: [
      { name: "Foto + video cinematic", quantity: 1, unitPrice: 15200 },
      { name: "Album signature", quantity: 1, unitPrice: 2000 },
    ],
    notes: "Ofertă acceptată — contract în pregătire.",
    terms: "Avans 30%, tranșă finală înainte de eveniment.",
    discountType: "none",
    discountValue: 0,
    taxRate: 0,
  },
];

export const DEMO_CONTRACTS: DemoContract[] = [
  {
    id: "ctr_1",
    clientName: "Laura & Paul Niculescu",
    clientId: "client_5",
    proposalId: "prop_3",
    title: "Contract foto-video nuntă",
    amount: 17200,
    deposit: 5000,
    remaining: 12200,
    status: "accepted",
    signedAt: "2026-06-18T14:00:00Z",
    eventDate: "2026-08-29",
    eventLocation: "Sibiu",
    contractNumber: "CTR-2026-0042",
    publicToken: "demo-contract-niculescu",
    validUntil: "2026-07-01",
    updatedAt: "2026-06-18T14:05:00Z",
    terms: "Avans 30%, restul înainte de eveniment. Anulare cu minim 30 de zile.",
    services: [
      { name: "Foto + video cinematic", quantity: 1, unitPrice: 15200, lineTotal: 15200 },
      { name: "Album signature", quantity: 1, unitPrice: 2000, lineTotal: 2000 },
    ],
  },
  {
    id: "ctr_2",
    clientName: "Maria & Cristian Dobre",
    clientId: "client_1",
    title: "Contract nuntă + album",
    amount: 13500,
    deposit: 4000,
    remaining: 9500,
    status: "accepted",
    signedAt: "2026-05-10T11:30:00Z",
    eventDate: "2026-07-18",
    eventLocation: "București",
    contractNumber: "CTR-2026-0031",
    publicToken: "demo-contract-dobre",
    validUntil: "2026-05-01",
    updatedAt: "2026-05-10T11:35:00Z",
    terms: "Avans 30% la semnare, rest la livrare.",
    services: [
      { name: "Pachet nuntă full day", quantity: 1, unitPrice: 11500, lineTotal: 11500 },
      { name: "Album premium", quantity: 1, unitPrice: 2000, lineTotal: 2000 },
    ],
  },
];

export const DEMO_PAYMENTS: DemoPayment[] = [
  {
    id: "pay_1",
    clientName: "Laura & Paul Niculescu",
    label: "Avans contract",
    amount: 5000,
    paidAmount: 5000,
    dueDate: "2026-06-20",
    method: "transfer",
    status: "paid",
  },
  {
    id: "pay_2",
    clientName: "Laura & Paul Niculescu",
    label: "Tranșă finală",
    amount: 12200,
    paidAmount: 0,
    dueDate: "2026-08-20",
    method: "transfer",
    status: "pending",
  },
  {
    id: "pay_3",
    clientName: "Maria & Cristian Dobre",
    label: "Rest plată",
    amount: 4500,
    paidAmount: 0,
    dueDate: "2026-08-01",
    method: "transfer",
    status: "overdue",
  },
  {
    id: "pay_4",
    clientName: "Horizon Events",
    label: "Avans corporate",
    amount: 3000,
    paidAmount: 3000,
    dueDate: "2026-07-15",
    method: "card",
    status: "paid",
  },
];

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "prj_1",
    name: "Nuntă Niculescu",
    clientName: "Laura & Paul Niculescu",
    eventDate: "2026-08-29",
    status: "prep",
    team: ["Raian", "Alex"],
    deadline: "2026-10-15",
    progress: 25,
  },
  {
    id: "prj_2",
    name: "Nuntă Dobre",
    clientName: "Maria & Cristian Dobre",
    eventDate: "2026-07-18",
    status: "photo_edit",
    team: ["Raian", "Mara"],
    deadline: "2026-08-25",
    progress: 55,
  },
  {
    id: "prj_3",
    name: "Nuntă Enache",
    clientName: "Ana & Bogdan Enache",
    eventDate: "2026-06-06",
    status: "album",
    team: ["Mara"],
    deadline: "2026-08-10",
    progress: 80,
  },
];

export const DEMO_TASKS: DemoTask[] = [
  {
    id: "task_1",
    title: "Trimite reminder ofertă Popescu",
    projectName: "Sales",
    dueDate: "2026-08-06",
    priority: "urgent",
    status: "todo",
    assignee: "Raian Fine Arts",
  },
  {
    id: "task_2",
    title: "Backup carduri nuntă Dobre",
    projectName: "Nuntă Dobre",
    dueDate: "2026-08-07",
    priority: "high",
    status: "doing",
    assignee: "Alex",
  },
  {
    id: "task_3",
    title: "Selecție album Enache",
    projectName: "Nuntă Enache",
    dueDate: "2026-08-08",
    priority: "medium",
    status: "todo",
    assignee: "Mara",
  },
  {
    id: "task_4",
    title: "Pregătire shot list Niculescu",
    projectName: "Nuntă Niculescu",
    dueDate: "2026-08-20",
    priority: "medium",
    status: "todo",
    assignee: "Raian Fine Arts",
  },
];

export const DEMO_CALENDAR: DemoCalendarEvent[] = [
  {
    id: "cal_1",
    title: "Nuntă Niculescu",
    type: "event",
    start: "2026-08-29T10:00:00",
    end: "2026-08-29T23:00:00",
    color: "#c6a76a",
  },
  {
    id: "cal_2",
    title: "Întâlnire Popescu",
    type: "meeting",
    start: "2026-08-08T17:00:00",
    end: "2026-08-08T18:00:00",
    color: "#e0c995",
  },
  {
    id: "cal_3",
    title: "Deadline album Enache",
    type: "deadline",
    start: "2026-08-10T09:00:00",
    end: "2026-08-10T10:00:00",
    color: "#d7a958",
  },
  {
    id: "cal_4",
    title: "Scadență plată Dobre",
    type: "payment",
    start: "2026-08-01T09:00:00",
    end: "2026-08-01T10:00:00",
    color: "#d56f6f",
  },
  {
    id: "cal_5",
    title: "Editare foto Dobre",
    type: "task",
    start: "2026-08-07T09:00:00",
    end: "2026-08-07T17:00:00",
    color: "#62b58c",
  },
];

export const DEMO_ACTIVITY: DemoActivity[] = [
  {
    id: "act_1",
    type: "lead",
    title: "Lead nou",
    description: "Elena Radu a completat formularul de pe website.",
    at: "2026-08-04T16:40:00Z",
    actor: "Sistem",
  },
  {
    id: "act_2",
    type: "proposal",
    title: "Ofertă vizualizată",
    description: "Andreea & Mihai Popescu au deschis oferta Premium.",
    at: "2026-08-04T12:10:00Z",
    actor: "Client",
  },
  {
    id: "act_3",
    type: "payment",
    title: "Plată întârziată",
    description: "Rest plată Maria & Cristian Dobre — scadentă 1 aug.",
    at: "2026-08-02T08:00:00Z",
    actor: "Sistem",
  },
  {
    id: "act_4",
    type: "contract",
    title: "Contract acceptat",
    description: "Contract Niculescu acceptat digital și arhivat.",
    at: "2026-06-18T14:05:00Z",
    actor: "Raian Fine Arts",
  },
  {
    id: "act_5",
    type: "task",
    title: "Task actualizat",
    description: "Alex a început backup-ul cardurilor nuntă Dobre.",
    at: "2026-08-05T09:20:00Z",
    actor: "Alex",
  },
];

export const DEMO_AUTOMATIONS: DemoAutomation[] = [
  {
    id: "auto_1",
    name: "Email după lead nou",
    trigger: "lead.created",
    channel: "email",
    enabled: true,
    lastRun: "2026-08-04T16:41:00Z",
  },
  {
    id: "auto_2",
    name: "Reminder ofertă neacceptată",
    trigger: "proposal.idle_3d",
    channel: "email",
    enabled: true,
    lastRun: "2026-08-03T10:00:00Z",
  },
  {
    id: "auto_3",
    name: "Reminder avans",
    trigger: "payment.due_soon",
    channel: "email",
    enabled: true,
    lastRun: null,
  },
  {
    id: "auto_4",
    name: "Formular pre-eveniment",
    trigger: "event.minus_14d",
    channel: "email",
    enabled: false,
    lastRun: null,
  },
  {
    id: "auto_5",
    name: "Solicitare review",
    trigger: "project.delivered",
    channel: "email",
    enabled: true,
    lastRun: "2026-07-20T11:00:00Z",
  },
];

export const DEMO_LEAD_SOURCES = [
  { source: "Instagram", count: 12 },
  { source: "Recomandare", count: 9 },
  { source: "Website", count: 7 },
  { source: "Google", count: 5 },
  { source: "Facebook", count: 4 },
  { source: "LinkedIn", count: 2 },
];

export const DEMO_MONTHLY_REVENUE = [
  { month: "Mar", value: 18500 },
  { month: "Apr", value: 22400 },
  { month: "Mai", value: 19800 },
  { month: "Iun", value: 27100 },
  { month: "Iul", value: 24600 },
  { month: "Aug", value: 15200 },
];

export function getDashboardStats() {
  const activeLeads = DEMO_LEADS.filter((l) => !["won", "lost"].includes(l.status));
  const won = DEMO_LEADS.filter((l) => l.status === "won").length;
  const closed = DEMO_LEADS.filter((l) => ["won", "lost"].includes(l.status)).length;
  const conversion = closed === 0 ? 0 : (won / closed) * 100;
  const estimatedRevenue = activeLeads.reduce((sum, l) => sum + l.estimatedValue, 0);
  const signedContracts = DEMO_CONTRACTS.filter((c) => c.status === "accepted").length;
  const overduePayments = DEMO_PAYMENTS.filter((p) => p.status === "overdue");
  const upcomingEvents = DEMO_CALENDAR.filter((e) => e.type === "event");
  const urgentTasks = DEMO_TASKS.filter(
    (t) => t.priority === "urgent" || t.priority === "high",
  );
  const delayedProjects = DEMO_PROJECTS.filter((p) => p.progress < 50 && p.status !== "prep");

  return {
    newLeads: DEMO_LEADS.filter((l) => l.status === "new").length,
    conversion,
    estimatedRevenue,
    signedContracts,
    overdueAmount: overduePayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0),
    upcomingEvents: upcomingEvents.length,
    urgentTasks: urgentTasks.length,
    delayedProjects: delayedProjects.length,
  };
}
