import type { LeadStatus } from "@/lib/constants";
import type { DemoLead } from "@/lib/demo/fixtures";
import type { Database } from "@/types/database";

export type LeadViewModel = {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  city: string;
  venue: string;
  budget: number;
  currency: string;
  source: string;
  services: string[];
  notes: string;
  ownerId: string | null;
  ownerLabel: string;
  status: LeadStatus;
  estimatedValue: number;
  followUpDate: string | null;
  tags: string[];
  lostReason?: string;
  createdAt: string;
  clientId: string | null;
  convertedAt: string | null;
};

export type ClientViewModel = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country: string;
  eventDate: string;
  eventType: string;
  status: string;
  totalValue: number;
  notes: string;
  tags: string[];
  source: string;
  leadId: string | null;
  portalToken: string | null;
};

export type ActivityViewModel = {
  id: string;
  type: string;
  title: string;
  description: string;
  at: string;
  actor: string;
  action: string | null;
};

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export function mapLeadRow(row: LeadRow): LeadViewModel {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    eventType: row.event_type ?? "",
    eventDate: row.event_date ?? "",
    city: row.city ?? "",
    venue: row.venue ?? "",
    budget: Number(row.budget ?? 0),
    currency: row.currency || "RON",
    source: row.source ?? "",
    services: row.services ?? [],
    notes: row.notes ?? "",
    ownerId: row.owner_id,
    ownerLabel: "Tu",
    status: row.status as LeadStatus,
    estimatedValue: Number(row.estimated_value ?? 0),
    followUpDate: row.follow_up_date,
    tags: row.tags ?? [],
    lostReason: row.lost_reason ?? undefined,
    createdAt: row.created_at,
    clientId: row.client_id,
    convertedAt: row.converted_at,
  };
}

export function mapDemoLead(lead: DemoLead): LeadViewModel {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    eventType: lead.eventType,
    eventDate: lead.eventDate,
    city: lead.city,
    venue: lead.venue,
    budget: lead.budget,
    currency: "RON",
    source: lead.source,
    services: lead.services,
    notes: lead.notes,
    ownerId: null,
    ownerLabel: lead.owner,
    status: lead.status,
    estimatedValue: lead.estimatedValue,
    followUpDate: lead.followUpDate,
    tags: lead.tags,
    lostReason: lead.lostReason,
    createdAt: lead.createdAt,
    clientId: null,
    convertedAt: null,
  };
}

export function mapClientRow(row: ClientRow): ClientViewModel {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    company: row.company ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    country: row.country ?? "",
    eventDate: row.event_date ?? "",
    eventType: row.event_type ?? "",
    status: row.status,
    totalValue: Number(row.total_value ?? 0),
    notes: row.notes ?? "",
    tags: row.tags ?? [],
    source: row.source ?? "",
    leadId: row.lead_id,
    portalToken: row.portal_token,
  };
}

export function mapActivityRow(row: ActivityRow): ActivityViewModel {
  return {
    id: row.id,
    type: row.entity_type,
    title: row.title,
    description: row.description ?? "",
    at: row.created_at,
    actor: "Utilizator",
    action: row.action,
  };
}
