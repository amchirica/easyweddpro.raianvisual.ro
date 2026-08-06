import { z } from "zod";

import { PAYMENT_METHODS } from "@/lib/constants";

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă")
  .optional()
  .or(z.literal(""));

export const paymentFormSchema = z.object({
  label: z.string().trim().min(2, "Denumirea este obligatorie").max(200),
  clientId: z.string().uuid().optional().nullable(),
  contractId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().min(0, "Suma trebuie să fie pozitivă"),
  paidAmount: z.coerce.number().min(0, "Suma plătită trebuie să fie pozitivă").default(0),
  dueDate: optionalDate,
  method: z.enum(PAYMENT_METHODS).optional().nullable(),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  proofUrl: z.string().trim().url("URL invalid").optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3).default("RON"),
  /** Explicit opt-in required for paidAmount to exceed amount. Not persisted. */
  allowOverpay: z.boolean().default(false),
});

export const markPaidSchema = z.object({
  paidAt: optionalDate,
  reference: z.string().trim().max(120).optional().or(z.literal("")),
});

export const markPartialSchema = z.object({
  paidAmount: z.coerce.number().min(0, "Suma trebuie să fie pozitivă"),
  allowOverpay: z.boolean().default(false),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
export type MarkPartialInput = z.infer<typeof markPartialSchema>;
