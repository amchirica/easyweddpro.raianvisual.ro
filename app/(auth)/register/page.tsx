import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Creează cont",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-medium text-foreground">Creează cont</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Configurezi businessul în câteva minute, fără card bancar.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
