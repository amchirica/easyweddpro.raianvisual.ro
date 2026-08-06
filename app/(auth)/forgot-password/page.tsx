import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperare parolă",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-medium text-foreground">
          Recuperare parolă
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Introdu emailul contului tău și îți trimitem un link de resetare.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
