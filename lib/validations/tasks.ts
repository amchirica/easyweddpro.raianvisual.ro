import { z } from "zod";

import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă")
  .optional()
  .or(z.literal(""));

export const taskSubtaskSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1, "Titlul subtaskului este obligatoriu").max(200),
  done: z.boolean().default(false),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, "Titlul este obligatoriu").max(200),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  dueDate: optionalDate,
  assigneeId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  calendarEventId: z.string().uuid().optional().nullable(),
  subtasks: z.array(taskSubtaskSchema).max(50).default([]),
});

export const taskStatusChangeSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;
export type TaskSubtaskInput = z.infer<typeof taskSubtaskSchema>;
