import { getSafeRedirectPath } from "@/lib/auth/redirect";

export const PASSWORD_RESET_PATH = "/update-password";

export function sanitizeNextPath(next: string | null | undefined): string {
  return getSafeRedirectPath(next, "/dashboard");
}
