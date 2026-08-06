import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirect relative to the current request host (localhost / staging / production).
 * Never hardcodes an absolute app origin.
 */
export function redirectRelative(
  request: NextRequest,
  pathnameWithSearch: string,
): NextResponse {
  return NextResponse.redirect(new URL(pathnameWithSearch, request.url));
}
