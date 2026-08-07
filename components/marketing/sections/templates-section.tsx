import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const TEMPLATES = [
  "pipeline recomandat",
  "ofertă",
  "contract",
  "task-uri",
  "automatizări",
  "emailuri",
  "follow-up",
  "proiect",
];

export function TemplatesSection() {
  return (
    <SectionShell>
      <SectionHeader
        title="Nu începi de la zero."
        description="La onboarding, în funcție de categoria aleasă, poți primi template-uri gata configurate."
      />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
        {TEMPLATES.map((item) => (
          <span
            key={item}
            className="rounded-full border border-champagne/25 bg-champagne/10 px-3 py-1.5 text-xs text-champagne-soft"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-xl text-center text-base text-muted-foreground">
        În loc să petreci zile configurând un CRM, începi să lucrezi.
      </p>
    </SectionShell>
  );
}
