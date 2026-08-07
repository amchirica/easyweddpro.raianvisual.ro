import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const ROADMAP_ITEMS = [
  "descoperire furnizori",
  "recomandări",
  "disponibilitate",
  "solicitare ofertă",
  "review-uri",
  "matching",
];

export function RoadmapSection() {
  return (
    <SectionShell muted>
      <SectionHeader
        eyebrow="Roadmap"
        title="Viitorul EasyWedd"
        description="Marketplace-ul nu este activ. Pregătim descoperire, matching și solicitări de ofertă — fără a le prezenta ca funcții live."
      />
      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
        {ROADMAP_ITEMS.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </SectionShell>
  );
}
