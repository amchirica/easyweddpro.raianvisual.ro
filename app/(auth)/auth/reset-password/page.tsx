import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Setează parola nouă",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-medium text-foreground">
          Setează parola nouă
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Alege o parolă nouă pentru contul tău.
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
