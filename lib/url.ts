import { PRODUCTION_SITE_URL } from "@/lib/constants";

export { PRODUCTION_SITE_URL };

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    PRODUCTION_SITE_URL;

  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (
      /localhost|127\.0\.0\.1/i.test(url.hostname) &&
      process.env.NODE_ENV === "production"
    ) {
      return PRODUCTION_SITE_URL;
    }
    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

export function getSignupEmailRedirectTo(): string {
  return `${getSiteUrl()}/auth/confirm?next=/onboarding`;
}

export function getPasswordResetRedirectTo(): string {
  return `${getSiteUrl()}/auth/confirm?next=/update-password`;
}
