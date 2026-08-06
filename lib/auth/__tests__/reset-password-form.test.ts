import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("reset password form source contracts", () => {
  const form = readFileSync(
    path.resolve(__dirname, "../../../components/auth/update-password-form.tsx"),
    "utf8",
  );
  const forgot = readFileSync(
    path.resolve(__dirname, "../../../components/auth/forgot-password-form.tsx"),
    "utf8",
  );

  it("updates password then redirects with success message", () => {
    expect(form).toContain("updateUser");
    expect(form).toContain("/login?message=password_updated");
    expect(form).toContain("disabled={pending || success}");
  });

  it("requests recovery via callback next=/auth/reset-password", () => {
    expect(forgot).toContain("getPasswordResetRedirectTo");
    expect(forgot).toContain("resetPasswordForEmail");
  });
});
