import { z } from "zod";

import { WORKSPACE_ROLES } from "@/lib/constants";

const invitableRoles = WORKSPACE_ROLES.filter((role) => role !== "owner") as [
  Exclude<(typeof WORKSPACE_ROLES)[number], "owner">,
  ...Exclude<(typeof WORKSPACE_ROLES)[number], "owner">[],
];

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Email invalid").max(200),
  role: z.enum(invitableRoles),
});

export const changeMemberRoleSchema = z.object({
  role: z.enum(WORKSPACE_ROLES),
  confirmOwnerTransfer: z.boolean().optional().default(false),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
