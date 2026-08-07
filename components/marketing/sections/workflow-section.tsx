import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const STEPS = [
  "Lead",
  "Calificare",
  "Ofertă",
  "Follow-up",
  "Acceptare",
  "Contract",
  "Avans",
  "Proiect",
  "Calendar",
  "Task-uri",
  "Eveniment",
  "Livrare",
  "Plată finală",
  "Review",
  "Follow-up",
] as const;

export function WorkflowSection() {
  return (
    <SectionShell id="workflow">
      <SectionHeader
        eyebrow="Semnătura produsului"
        title="Un singur workflow. De la cerere la eveniment."
        description="De la primul contact până la review și recomandare — același fir, fără să schimbi unelte."
      />
      <ol className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3">
        {STEPS.map((step, index) => (
          <li key={`${step}-${index}`} className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1.5 text-sm font-medium text-champagne-soft">
              {step}
            </span>
            {index < STEPS.length - 1 ? (
              <span className="hidden text-muted-soft sm:inline" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
