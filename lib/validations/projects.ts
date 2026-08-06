import { z } from "zod";

import { PROJECT_STATUSES } from "@/lib/constants";

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă")
  .optional()
  .or(z.literal(""));

export const projectFormSchema = z.object({
  name: z.string().trim().min(2, "Numele proiectului este obligatoriu").max(200),
  clientId: z.string().uuid().optional().nullable(),
  eventDate: optionalDate,
  status: z.enum(PROJECT_STATUSES).default("booked"),
  pipelineKey: z.string().trim().min(1).max(60).default("generic"),
  deadline: optionalDate,
  progress: z.coerce.number().int().min(0, "Progres invalid").max(100, "Progres invalid").default(0),
  team: z.array(z.string().trim().min(1)).default([]),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  budget: z.coerce.number().min(0, "Buget invalid").default(0),
  cost: z.coerce.number().min(0, "Cost invalid").default(0),
  estimatedRevenue: z.coerce.number().min(0, "Venit estimat invalid").default(0),
  currency: z.string().trim().min(3).max(8).default("RON"),
});

/**
 * Create and update share the same shape today (mirrors clientFormSchema).
 * Kept as distinct exports so call sites can diverge later without a breaking rename.
 */
export const createProjectSchema = projectFormSchema;
export const updateProjectSchema = projectFormSchema;

export type ProjectFormInput = z.infer<typeof projectFormSchema>;
