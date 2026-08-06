import Link from "next/link";
import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verifică emailul",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-champagne/30 bg-champagne/10 text-champagne">
        <MailCheck className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="font-heading text-2xl font-medium text-foreground">
        Verifică-ți emailul
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ți-am trimis un link de confirmare. Deschide emailul și apasă pe link
        pentru a-ți activa contul. Verifică și folderul Spam dacă nu apare în
        Inbox în câteva minute.
      </p>
      <div className="mt-8 space-y-3">
        <Button className="w-full" render={<Link href="/login" />} nativeButton={false}>
          Înapoi la autentificare
        </Button>
      </div>
    </div>
  );
}
