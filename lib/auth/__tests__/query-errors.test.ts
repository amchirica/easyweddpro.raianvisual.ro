import { describe, expect, it } from "vitest";

import { mapAuthQueryError, mapAuthQueryMessage } from "@/lib/auth/query-errors";

describe("auth query messages", () => {
  it("maps confirmation and session errors", () => {
    expect(mapAuthQueryError("email_confirmed")).toMatch(/confirmat/i);
    expect(mapAuthQueryError("session_initialization_failed")).toMatch(/inițializată/i);
    expect(mapAuthQueryError("invalid_or_expired_link")).toMatch(/invalid|expirat/i);
    expect(mapAuthQueryError("missing_auth_code")).toMatch(/incomplet/i);
  });

  it("maps password updated success message", () => {
    expect(mapAuthQueryMessage("password_updated")).toMatch(/actualizată/i);
    expect(mapAuthQueryError("password_updated")).toMatch(/actualizată/i);
  });
});
