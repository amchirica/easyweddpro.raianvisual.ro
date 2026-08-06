export const PLATFORM_ROLES = [
  "platform_super_admin",
  "platform_admin",
  "platform_support",
  "platform_billing",
  "platform_content",
  "platform_developer",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  platform_super_admin: "Super Admin",
  platform_admin: "Admin",
  platform_support: "Support",
  platform_billing: "Billing",
  platform_content: "Content",
  platform_developer: "Developer",
};

export function isPlatformRole(value: string | null | undefined): value is PlatformRole {
  return Boolean(value && (PLATFORM_ROLES as readonly string[]).includes(value));
}
