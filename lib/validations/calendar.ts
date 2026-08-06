import { z } from "zod";

import { CALENDAR_EVENT_STATUSES } from "@/lib/constants";
import { isEndAfterStart } from "@/lib/calendar/timezone";

const isoDateTime = z
  .string()
  .trim()
  .min(1, "Data este obligatorie")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Dată/oră invalidă");

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().trim().uuid("Identificator invalid").nullable(),
);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""));

const optionalIsoDateTime = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  isoDateTime.nullable(),
);

export const calendarEventBaseSchema = z.object({
  title: z.string().trim().min(1, "Titlul este obligatoriu").max(200),
  description: optionalText(5000),
  eventType: z.string().trim().min(1).max(60).default("event"),
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  allDay: z.boolean().default(false),
  location: optionalText(200),
  clientId: optionalUuid,
  projectId: optionalUuid,
  contractId: optionalUuid,
  memberIds: z.array(z.string().trim().uuid()).default([]),
  color: optionalText(20),
  status: z.enum(CALENDAR_EVENT_STATUSES).default("confirmed"),
  notes: optionalText(5000),
  reminderAt: optionalIsoDateTime,
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const calendarEventFormSchema = calendarEventBaseSchema.refine(
  (data) => isEndAfterStart(data.startsAt, data.endsAt),
  {
    message: "Data de final trebuie să fie după data de start",
    path: ["endsAt"],
  },
);

export const moveCalendarEventSchema = z
  .object({
    startsAt: isoDateTime,
    endsAt: isoDateTime,
  })
  .refine((data) => isEndAfterStart(data.startsAt, data.endsAt), {
    message: "Data de final trebuie să fie după data de start",
    path: ["endsAt"],
  });

export type CalendarEventFormInput = z.infer<typeof calendarEventFormSchema>;
export type MoveCalendarEventInput = z.infer<typeof moveCalendarEventSchema>;
