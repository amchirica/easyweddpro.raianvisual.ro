import { z } from "zod";

import { AUTOMATION_CONDITION_OPERATORS, AUTOMATION_TRIGGERS } from "@/lib/automations/catalog";

const conditionSchema = z.object({
  field: z.string().trim().min(1).max(80),
  operator: z.enum(AUTOMATION_CONDITION_OPERATORS as unknown as [string, ...string[]]),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

const createTaskActionSchema = z.object({
  type: z.literal("create_task"),
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  dueInDays: z.coerce.number().int().min(0).max(365).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

const createReminderActionSchema = z.object({
  type: z.literal("create_reminder"),
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  offsetMinutes: z.coerce.number().int().min(0).max(60 * 24 * 60).optional(),
});

const changeStatusActionSchema = z.object({
  type: z.literal("change_status"),
  entityType: z.enum(["lead", "project"]),
  toStatus: z.string().trim().min(1).max(60),
});

const logActivityActionSchema = z.object({
  type: z.literal("log_activity"),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

const prepareEmailActionSchema = z.object({
  type: z.literal("prepare_email"),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
});

const sendEmailActionSchema = z.object({
  type: z.literal("send_email"),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  to: z.string().trim().email().optional().or(z.literal("")),
});

const actionSchema = z.discriminatedUnion("type", [
  createTaskActionSchema,
  createReminderActionSchema,
  changeStatusActionSchema,
  logActivityActionSchema,
  prepareEmailActionSchema,
  sendEmailActionSchema,
]);

export const automationFormSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  triggerKey: z.enum(AUTOMATION_TRIGGERS),
  enabled: z.boolean().default(true),
  channel: z.enum(["email", "internal"]).default("internal"),
  conditions: z.array(conditionSchema).default([]),
  actions: z.array(actionSchema).default([]),
});

export type AutomationFormInput = z.infer<typeof automationFormSchema>;
