import { z } from "zod";

import { LEAD_STATUSES } from "@/lib/constants";

const optionalEmail = z
  .string()
  .trim()
  .email("Email invalid")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă")
  .optional()
  .or(z.literal(""));

export const leadFormSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu"),
  email: optionalEmail,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  eventType: z.string().trim().max(80).optional().or(z.literal("")),
  eventDate: optionalDate,
  city: z.string().trim().max(80).optional().or(z.literal("")),
  venue: z.string().trim().max(120).optional().or(z.literal("")),
  budget: z.coerce.number().min(0, "Buget invalid").optional().nullable(),
  currency: z.string().trim().min(3).max(3).default("RON"),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  services: z.array(z.string()).default([]),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  ownerId: z.string().uuid().optional().nullable(),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  followUpDate: optionalDate,
  status: z.enum(LEAD_STATUSES).default("new"),
  tags: z.array(z.string()).default([]),
  lostReason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const leadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  lostReason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const leadNoteSchema = z.object({
  note: z.string().trim().min(1, "Nota este obligatorie").max(2000),
});

export const clientFormSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu"),
  email: optionalEmail,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  eventType: z.string().trim().max(80).optional().or(z.literal("")),
  eventDate: optionalDate,
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(["active", "past", "lead_converted"]).default("active"),
});

export const convertLeadSchema = z.object({
  leadId: z.string().uuid(),
  mode: z.enum(["create", "existing"]),
  existingClientId: z.string().uuid().optional().nullable(),
});

export const onboardingSchema = z.object({
  companyName: z.string().trim().min(2, "Numele companiei este obligatoriu"),
  activityType: z.string().trim().min(1, "Selectează tipul de business"),
  city: z.string().trim().min(2, "Orașul este obligatoriu"),
  country: z.string().trim().min(2, "Țara este obligatorie"),
  services: z.array(z.string()).default([]),
  eventsPerYear: z.coerce.number().int().min(0).max(10000).optional().nullable(),
  teamSize: z.string().trim().max(40).optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3).default("RON"),
  timezone: z.string().trim().default("Europe/Bucharest"),
  brandAccent: z.string().trim().optional().or(z.literal("")),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  cui: z.string().trim().max(40).optional().or(z.literal("")),
  fiscalAddress: z.string().trim().max(200).optional().or(z.literal("")),
  importSkipped: z.boolean().default(true),
  packageName: z.string().trim().max(120).optional().or(z.literal("")),
  packagePrice: z.coerce.number().min(0).optional().nullable(),
  businessTypes: z.array(z.string()).default([]),
  vendorCategories: z.array(z.string()).default([]),
  defaultProjectPipeline: z.string().trim().optional().or(z.literal("")),
  defaultContractTemplate: z.string().trim().optional().or(z.literal("")),
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;
export type ClientFormInput = z.infer<typeof clientFormSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
