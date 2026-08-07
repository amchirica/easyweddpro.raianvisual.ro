import Link from "next/link";
import type { Metadata } from "next";

import { PricingGrid } from "@/components/marketing/pricing-grid";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Prețuri",
  description:
    "Free, Solo, Studio și Agency — Business OS EasyWedd Pro pentru Weddings & Events. Începe gratuit, fără card pe planul Free.",
};

const COMPARISON_ROWS = [
  { label: "Leaduri active", free: "5", solo: "Nelimitat", studio: "Nelimitat", agency: "Nelimitat" },
  { label: "Clienți", free: "3", solo: "Nelimitat", studio: "Nelimitat", agency: "Nelimitat" },
  { label: "Utilizatori", free: "1", solo: "1", studio: "5", agency: "15" },
  { label: "Automatizări", free: "—", solo: "—", studio: "✓", agency: "✓" },
  { label: "Analytics", free: "—", solo: "—", studio: "✓", agency: "✓" },
  { label: "Branding personalizat", free: "—", solo: "—", studio: "✓", agency: "✓" },
  { label: "Pipeline proiecte", free: "—", solo: "—", studio: "✓", agency: "✓" },
  { label: "Multi-brand", free: "—", solo: "—", studio: "—", agency: "✓" },
];

const FAQ = [
  {
    question: "Planurile sunt doar pentru studiouri foto-video?",
    answer:
      "Nu. Free, Solo, Studio și Agency se aplică freelancerilor, echipelor, locațiilor și agențiilor din industria evenimentelor. „Studio” este numele planului pentru echipe în creștere, nu doar foto-video.",
  },
  {
    question: "Pot schimba planul mai târziu?",
    answer: "Da, poți face upgrade sau downgrade oricând din setările contului, fără penalizări.",
  },
  {
    question: "Prețurile includ TVA?",
    answer: "Prețurile afișate sunt fără TVA. Factura finală include TVA conform legislației din România.",
  },
  {
    question: "Există perioadă de probă pentru planurile plătite?",
    answer: "Planul Free este disponibil pe termen nelimitat, ideal pentru a testa fluxul înainte de upgrade.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
          Prețuri
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          Prețuri simple, fără surprize
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          Începe gratuit. Treci la un plan plătit doar când echipa și volumul
          de clienți cresc.
        </p>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <PricingGrid />
        </div>
      </section>

      <section className="border-t border-border bg-background-secondary/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-2xl font-medium text-foreground sm:text-3xl">
            Compară planurile
          </h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Funcționalitate</th>
                  <th className="py-3 pr-4 text-center font-medium">Free</th>
                  <th className="py-3 pr-4 text-center font-medium">Solo</th>
                  <th className="py-3 pr-4 text-center font-medium">Studio</th>
                  <th className="py-3 pr-4 text-center font-medium">Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/60">
                    <td className="py-3 pr-4 text-foreground">{row.label}</td>
                    <td className="py-3 pr-4 text-center text-muted-foreground">{row.free}</td>
                    <td className="py-3 pr-4 text-center text-muted-foreground">{row.solo}</td>
                    <td className="py-3 pr-4 text-center text-champagne">{row.studio}</td>
                    <td className="py-3 pr-4 text-center text-champagne">{row.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-2xl font-medium text-foreground sm:text-3xl">
            Întrebări despre prețuri
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details key={item.question} className="surface-card group p-5">
                <summary className="flex list-none cursor-pointer items-center justify-between font-heading text-base font-medium text-foreground marker:content-none">
                  {item.question}
                  <span className="ml-4 text-champagne transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      <section className="px-6 py-20">
        <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            Nu ești sigur care plan e potrivit?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Începe cu planul Free — poți face upgrade oricând din cont.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              Începe gratuit
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
