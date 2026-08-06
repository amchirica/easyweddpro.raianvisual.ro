import { z } from "zod";

export const TEMPLATE_TYPES = [
  "proposal",
  "contract",
  "email",
  "task",
  "project",
  "pipeline",
  "automation",
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  proposal: "Ofertă",
  contract: "Contract",
  email: "Email",
  task: "Sarcină",
  project: "Proiect",
  pipeline: "Pipeline",
  automation: "Automatizare",
};

/** Content is intentionally plain text / lists only — never HTML, never evaluated. */
export const templateContentSchema = z.object({
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().max(20000).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  checklist: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  stages: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});

export type TemplateContentInput = z.infer<typeof templateContentSchema>;

export const templateFormSchema = z.object({
  type: z.enum(TEMPLATE_TYPES),
  name: z.string().trim().min(2, "Numele este obligatoriu").max(150),
  category: z.string().trim().min(1).max(60).default("general"),
  businessType: z.string().trim().max(60).optional().or(z.literal("")),
  content: templateContentSchema.default({
    subject: "",
    body: "",
    description: "",
    checklist: [],
    stages: [],
  }),
  isDefault: z.boolean().default(false),
});

export type TemplateFormInput = z.infer<typeof templateFormSchema>;
