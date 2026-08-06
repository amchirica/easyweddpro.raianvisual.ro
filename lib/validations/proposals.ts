import { z } from "zod";

import { PROPOSAL_STATUSES } from "@/lib/constants";

export const proposalItemSchema = z.object({
  name: z.string().trim().min(1, "Numele itemului este obligatoriu").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  quantity: z.coerce.number().positive("Cantitatea trebuie să fie pozitivă"),
  unitPrice: z.coerce.number().min(0, "Preț invalid"),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const proposalFormSchema = z
  .object({
    title: z.string().trim().min(2, "Titlul este obligatoriu").max(200),
    clientId: z.string().uuid().optional().nullable(),
    leadId: z.string().uuid().optional().nullable(),
    currency: z.string().trim().length(3).default("RON"),
    discountType: z.enum(["none", "percent", "fixed"]).default("none"),
    discountValue: z.coerce.number().min(0).default(0),
    taxRate: z.coerce.number().min(0).max(100).default(19),
    validUntil: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă")
      .optional()
      .or(z.literal("")),
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
    terms: z.string().trim().max(10000).optional().or(z.literal("")),
    items: z.array(proposalItemSchema).min(1, "Adaugă cel puțin un item"),
  })
  .refine((data) => Boolean(data.clientId || data.leadId), {
    message: "Selectează un client sau un lead",
    path: ["clientId"],
  });

export const proposalStatusFilterSchema = z.enum([...PROPOSAL_STATUSES, "all"]);

export const acceptProposalSchema = z.object({
  token: z.string().min(16),
  fullName: z.string().trim().min(2, "Numele complet este obligatoriu"),
  email: z.email("Email invalid"),
  acceptedTerms: z
    .boolean()
    .refine((value) => value === true, "Trebuie să accepți condițiile ofertei"),
});

export const rejectProposalSchema = z.object({
  token: z.string().min(16),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ProposalFormInput = z.infer<typeof proposalFormSchema>;
