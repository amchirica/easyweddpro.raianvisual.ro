import { PRODUCTION_SITE_URL } from "@/lib/constants";

export { PRODUCTION_SITE_URL };

const PRODUCTION_HOST = "easyweddpro.raianvisual.ro";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function warnIfLocalPointsToProduction(configured: string) {
  if (process.env.NODE_ENV !== "development") return;
  try {
    const host = new URL(
      configured.includes("://") ? configured : `https://${configured}`,
    ).hostname;
    if (host === PRODUCTION_HOST || host.endsWith(`.${PRODUCTION_HOST}`)) {
      console.warn(
        "NEXT_PUBLIC_APP_URL points to production while running locally.",
      );
    }
  } catch {
    // ignore invalid URLs here; getAppUrl will surface config errors
  }
}

/**
 * Canonical application origin for absolute auth/email/billing callbacks.
 * Does not fall back to production in development.
 */
export function getAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    undefined;

  if (configured) {
    const withProtocol = configured.includes("://")
      ? configured
      : `https://${configured}`;
    try {
      const url = new URL(withProtocol);
      const origin = stripTrailingSlash(url.origin);
      if (
        process.env.NODE_ENV === "development" &&
        (url.hostname === PRODUCTION_HOST ||
          url.hostname.endsWith(`.${PRODUCTION_HOST}`))
      ) {
        warnIfLocalPointsToProduction(configured);
        // Keep local auth emails on localhost; never force production host in dev.
        return "http://localhost:3000";
      }
      return origin;
    } catch {
      throw new Error("Application URL is not configured");
    }
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  throw new Error("Application URL is not configured");
}

/**
 * Site URL for SEO/metadata. Prefers getAppUrl(); falls back only when
 * absolute URLs are required at build time without env.
 */
export function getSiteUrl(): string {
  try {
    return getAppUrl();
  } catch {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000";
    }
    return PRODUCTION_SITE_URL;
  }
}

export function getSignupEmailRedirectTo(): string {
  return `${getAppUrl()}/auth/confirm?next=/onboarding`;
}

export function getPasswordResetRedirectTo(): string {
  return `${getAppUrl()}/auth/callback?next=/auth/reset-password`;
}
