import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Autentificare",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-medium text-foreground">Autentificare</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Bine ai revenit! Introdu datele contului tău.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
