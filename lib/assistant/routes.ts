import type { AssistantLink } from "@/lib/assistant/knowledge/types";
import { modulesForSurface } from "@/lib/assistant/search";
import type { AssistantSurface } from "@/lib/assistant/knowledge/types";

const EXTRA_ROUTES = new Set([
  "/dashboard",
  "/dashboard/settings/billing",
  "/admin",
  "/admin/system/health",
  "/admin/system/errors",
]);

function allowedRoutes(surface: AssistantSurface): Set<string> {
  const set = new Set(EXTRA_ROUTES);
  for (const m of modulesForSurface(surface)) {
    set.add(m.route);
  }
  return set;
}

/** Only allow internal navigation CTAs from the allowlist. */
export function sanitizeAssistantLinks(
  surface: AssistantSurface,
  links: AssistantLink[],
): AssistantLink[] {
  const allow = allowedRoutes(surface);
  return links.filter((link) => {
    if (!link.href.startsWith("/")) return false;
    if (link.href.startsWith("//")) return false;
    if (link.href.startsWith("/api")) return false;
    if (link.href.includes("://")) return false;
    const path = link.href.split("?")[0]?.split("#")[0] ?? link.href;
    if (allow.has(path)) return true;
    // Allow nested paths under an allowlisted module prefix
    for (const route of allow) {
      if (route !== "/" && path.startsWith(`${route}/`)) return true;
    }
    return false;
  });
}

export function linkForModule(
  surface: AssistantSurface,
  moduleKey: string,
  label: string,
): AssistantLink | null {
  const mod = modulesForSurface(surface).find((m) => m.key === moduleKey);
  if (!mod) return null;
  const links = sanitizeAssistantLinks(surface, [{ href: mod.route, label }]);
  return links[0] ?? null;
}

export function isRouteAllowed(surface: AssistantSurface, href: string): boolean {
  return sanitizeAssistantLinks(surface, [{ href, label: "x" }]).length > 0;
}
