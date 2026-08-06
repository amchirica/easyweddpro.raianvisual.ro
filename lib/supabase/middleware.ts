import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { PASSWORD_RESET_PATH } from "@/lib/auth/callback-destination";
import { hasSupabaseEnv, isDemoMode, requireSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

const AUTH_ENTRY_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/check-email",
];

const AUTH_PASS_THROUGH = [
  "/auth/confirm",
  "/auth/error",
  "/auth/callback",
  "/login",
  "/register",
  "/forgot-password",
  "/check-email",
  "/update-password",
];

const PUBLIC_PREFIXES = [
  "/",
  "/features",
  "/pricing",
  "/privacy",
  "/terms",
  "/p",
  "/c",
  "/portal",
  "/auth",
  "/check-email",
  "/update-password",
  "/login",
  "/register",
  "/forgot-password",
];

function isPassThroughAuthPath(pathname: string) {
  return AUTH_PASS_THROUGH.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isPublicPath(pathname: string) {
  if (AUTH_ENTRY_ROUTES.includes(pathname)) return true;
  if (isPassThroughAuthPath(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes("-auth-token") ||
        (c.name.startsWith("sb-") && c.name.includes("auth")),
    );
}

function needsSessionWork(pathname: string, request: NextRequest) {
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding")
  ) {
    return true;
  }
  if (AUTH_ENTRY_ROUTES.includes(pathname)) return true;
  if (
    pathname === PASSWORD_RESET_PATH ||
    pathname.startsWith(`${PASSWORD_RESET_PATH}/`)
  ) {
    return hasSupabaseAuthCookie(request);
  }
  return hasSupabaseAuthCookie(request);
}

function redirectTo(request: NextRequest, pathname: string, search?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (search) {
    for (const [key, value] of Object.entries(search)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static/public assets — never run auth/session work.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|map)$/i.test(pathname)
  ) {
    return NextResponse.next({ request });
  }

  if (pathname === "/") {
    const params = request.nextUrl.searchParams;
    if (params.has("token_hash") && params.has("type")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/confirm";
      if (!redirectUrl.searchParams.get("next")) {
        redirectUrl.searchParams.set(
          "next",
          params.get("type") === "recovery" ? PASSWORD_RESET_PATH : "/onboarding",
        );
      }
      return NextResponse.redirect(redirectUrl);
    }
    if (params.has("code") && !params.has("token_hash")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/callback";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (
    pathname === "/auth/confirm" ||
    pathname.startsWith("/auth/confirm/") ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback/") ||
    pathname === "/auth/signout" ||
    pathname.startsWith("/auth/signout/")
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  // No Supabase env: allow demo browsing only in non-production / explicit demo.
  if (!hasSupabaseEnv()) {
    if (isDemoMode()) {
      return supabaseResponse;
    }
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/onboarding")
    ) {
      return redirectTo(request, "/login", { error: "supabase_not_configured" });
    }
    return supabaseResponse;
  }

  if (!needsSessionWork(pathname, request) && isPublicPath(pathname)) {
    return supabaseResponse;
  }

  const { url, anonKey } = requireSupabasePublicEnv();
  const supabase = createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding");

  if (!user && isProtected) {
    if (isDemoMode() && !pathname.startsWith("/admin")) {
      return supabaseResponse;
    }
    return redirectTo(request, "/login", { next: pathname });
  }

  if (user && (AUTH_ENTRY_ROUTES.includes(pathname) || isProtected)) {
    const isAdminPath = pathname.startsWith("/admin");
    const isOnboardingPath =
      pathname === "/onboarding" || pathname.startsWith("/onboarding/");

    const [{ data: profile }, { data: memberships }, adminCheck] = await Promise.all([
      supabase
        .from("profiles")
        .select("onboarding_completed, suspended_at, account_status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1),
      isAdminPath
        ? supabase.rpc("is_platform_admin")
        : Promise.resolve({ data: null as boolean | null, error: null }),
    ]);

    if (profile?.suspended_at || profile?.account_status === "suspended") {
      await supabase.auth.signOut();
      return redirectTo(request, "/login", { error: "account_suspended" });
    }

    const hasWorkspace = Boolean(memberships?.length);

    if (AUTH_ENTRY_ROUTES.includes(pathname)) {
      return redirectTo(request, hasWorkspace ? "/dashboard" : "/onboarding");
    }

    if (isOnboardingPath && hasWorkspace) {
      return redirectTo(request, "/dashboard");
    }

    if (pathname.startsWith("/dashboard") && !hasWorkspace) {
      return redirectTo(request, "/onboarding");
    }

    if (isAdminPath) {
      const { data: isAdmin, error } = adminCheck;
      if (error || !isAdmin) {
        return redirectTo(request, hasWorkspace ? "/dashboard" : "/onboarding");
      }
    }
  }

  return supabaseResponse;
}
