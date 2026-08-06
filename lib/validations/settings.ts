import { z } from "zod";

export const profileFormSchema = z.object({
  fullName: z.string().trim().min(2, "Numele este obligatoriu").max(120),
});

export const notificationPrefsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  productUpdates: z.boolean().default(false),
});

export const workspaceFormSchema = z.object({
  name: z.string().trim().min(2, "Numele workspace-ului este obligatoriu").max(120),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3).default("RON"),
  timezone: z.string().trim().min(1).max(60).default("Europe/Bucharest"),
  language: z.enum(["ro", "en"]).default("ro"),
  brandPrimary: z.string().trim().max(20).optional().or(z.literal("")),
  brandAccent: z.string().trim().max(20).optional().or(z.literal("")),
  fiscalCui: z.string().trim().max(40).optional().or(z.literal("")),
  fiscalAddress: z.string().trim().max(200).optional().or(z.literal("")),
  defaultProjectPipeline: z.string().trim().max(40).optional().or(z.literal("")),
  notifications: notificationPrefsSchema.default({
    emailNotifications: true,
    weeklyDigest: true,
    productUpdates: false,
  }),
});

export type WorkspaceFormInput = z.infer<typeof workspaceFormSchema>;
export type ProfileFormInput = z.infer<typeof profileFormSchema>;

export const deleteWorkspaceSchema = z.object({
  confirmation: z.string().trim().min(1, "Confirmarea este obligatorie"),
});

export const transferOwnershipSchema = z.object({
  targetMembershipId: z.string().uuid(),
  confirmation: z.string().trim().min(1, "Confirmarea este obligatorie"),
});
