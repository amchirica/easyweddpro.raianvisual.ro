import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const CIRCLE = [
  "Miri",
  "EasyWedd",
  "Furnizori",
  "EasyWedd Pro",
  "Proiect",
  "Eveniment",
  "Review",
  "Recomandare",
  "Viitori clienți",
];

export function CircularSection() {
  return (
    <SectionShell>
      <SectionHeader
        title="Un eveniment conectează zeci de oameni. Software-ul ar trebui să facă același lucru."
        description="Diferențiatorul față de CRM-urile generale: un ecosistem construit pe verticala Weddings & Events."
      />
      <ol className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-2 sm:gap-1">
        {CIRCLE.map((step, index) => (
          <li key={step} className="flex flex-col items-center">
            <span className="rounded-full border border-champagne/30 bg-champagne/10 px-4 py-1.5 text-sm font-medium text-champagne-soft">
              {step}
            </span>
            {index < CIRCLE.length - 1 ? (
              <span className="py-1 text-muted-soft" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
