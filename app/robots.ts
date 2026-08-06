import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/onboarding", "/portal"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
