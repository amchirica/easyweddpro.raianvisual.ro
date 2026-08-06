import { getSafeRedirectPath } from "@/lib/auth/redirect";

export const PASSWORD_RESET_PATH = "/auth/reset-password";
/** Legacy path kept for old email links / bookmarks. */
export const LEGACY_PASSWORD_RESET_PATH = "/update-password";

export function sanitizeNextPath(next: string | null | undefined): string {
  return getSafeRedirectPath(next, "/dashboard");
}

export function isPasswordResetPath(pathname: string): boolean {
  return (
    pathname === PASSWORD_RESET_PATH ||
    pathname.startsWith(`${PASSWORD_RESET_PATH}/`) ||
    pathname === LEGACY_PASSWORD_RESET_PATH ||
    pathname.startsWith(`${LEGACY_PASSWORD_RESET_PATH}/`)
  );
}
