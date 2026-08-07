import { Camera, Flower2, MapPin, Music4, Sparkles, UtensilsCrossed, Users } from "lucide-react";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const FITS = [
  {
    icon: Camera,
    title: "Foto & Video",
    items: ["lead", "contract", "shooting", "editare", "livrare"],
  },
  {
    icon: Music4,
    title: "DJ & Formații",
    items: ["rezervări", "playlist", "echipamente", "logistică", "soundcheck"],
  },
  {
    icon: Users,
    title: "Wedding Planner",
    items: ["furnizori", "timeline", "task-uri", "buget", "coordonare"],
  },
  {
    icon: MapPin,
    title: "Locații",
    items: ["disponibilitate", "rezervări", "săli", "meniuri", "avansuri"],
  },
  {
    icon: Flower2,
    title: "Decor & Flori",
    items: ["concept", "inventar", "transport", "montaj", "demontaj"],
  },
  {
    icon: UtensilsCrossed,
    title: "Catering",
    items: ["meniuri", "persoane", "logistică", "plăți"],
  },
  {
    icon: Sparkles,
    title: "Beauty",
    items: ["programări", "persoane", "locații", "servicii"],
  },
];

export function BusinessFitSection() {
  return (
    <SectionShell muted>
      <SectionHeader
        title="Nu toate businessurile de evenimente funcționează la fel. EasyWedd Pro știe asta."
        description="Aceeași platformă. Workflow adaptat activității tale."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FITS.map((fit) => (
          <div key={fit.title} className="surface-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
              <fit.icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="mt-4 font-heading text-lg font-medium text-foreground">{fit.title}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {fit.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border/80 px-2.5 py-0.5 text-[0.7rem] text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center font-heading text-xl text-champagne-soft sm:text-2xl">
        Aceeași platformă. Workflow adaptat activității tale.
      </p>
    </SectionShell>
  );
}
