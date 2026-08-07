import Link from "next/link";
import type { Metadata } from "next";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Contact,
  FileText,
  FolderKanban,
  LayoutTemplate,
  ScrollText,
  Users,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Funcționalități",
  description:
    "Business OS EasyWedd Pro: CRM evenimente, oferte, contracte, plăți, calendar, proiecte, automatizări, analytics și portal client pentru Weddings & Events.",
};

const FEATURE_GROUPS = [
  {
    title: "Workflow comercial",
    description: "De la lead la contract și avans — fără haos pe WhatsApp și email.",
    items: [
      {
        icon: Users,
        title: "CRM & pipeline",
        description:
          "Leaduri, surse, statusuri și follow-up pe un pipeline construit pentru evenimente — nu un CRM generic.",
      },
      {
        icon: Contact,
        title: "Dosare de clienți",
        description:
          "Istoric al ofertelor, contractelor și plăților pentru fiecare client, într-un singur loc.",
      },
      {
        icon: FileText,
        title: "Oferte",
        description:
          "Pachete, extraopțiuni, discount și link public — vezi când oferta a fost vizualizată și acceptată.",
      },
      {
        icon: ScrollText,
        title: "Contracte",
        description:
          "Template-uri, acceptare digitală, versiuni și PDF — fără hârtii pierdute.",
      },
    ],
  },
  {
    title: "Operațiuni",
    description: "Proiect, calendar și echipă — de la rezervare la livrare.",
    items: [
      {
        icon: CalendarDays,
        title: "Calendar",
        description:
          "Evenimente, întâlniri, deadline-uri și task-uri într-un calendar unificat.",
      },
      {
        icon: FolderKanban,
        title: "Proiecte",
        description:
          "Workflow pe tip de business, echipă, checklist și deadline-uri pe eveniment.",
      },
      {
        icon: CheckSquare,
        title: "Task-uri",
        description:
          "Alocă sarcini cu priorități și termene, legate de proiect și eveniment.",
      },
      {
        icon: UsersRound,
        title: "Echipă & roluri",
        description:
          "Fiecare membru vede ce trebuie să facă, cu permisiuni pe rol.",
      },
    ],
  },
  {
    title: "Financiar & insight",
    description: "Plăți clare și analytics pe pipeline.",
    items: [
      {
        icon: Wallet,
        title: "Plăți",
        description:
          "Avansuri, tranșe, restante și remindere — urmărite pe fiecare eveniment.",
      },
      {
        icon: BarChart3,
        title: "Analytics",
        description:
          "Conversie, pipeline, venit, surse și rezultate — fără vanity metrics inventate.",
      },
    ],
  },
  {
    title: "Experiența clientului",
    description: "Automatizări și portal — fără efort manual la fiecare pas.",
    items: [
      {
        icon: Zap,
        title: "Automatizări",
        description:
          "Trigger → condiții → acțiuni: follow-up ofertă, reminder contract, checklist pre-eveniment, review.",
      },
      {
        icon: LayoutTemplate,
        title: "Portal client",
        description:
          "Ofertă, contract, plăți, proiect și documente pe link unic — fără cont obligatoriu.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
          Business OS · Weddings & Events
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          Platformă operațională pentru furnizorii de evenimente
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          Lead → ofertă → contract → avans → proiect → eveniment → follow-up.
          Module conectate, adaptate tipului tău de business.
        </p>
      </section>

      {FEATURE_GROUPS.map((group, index) => (
        <section
          key={group.title}
          className={
            index % 2 === 1
              ? "border-t border-border bg-background-secondary/40 px-6 py-16"
              : "border-t border-border px-6 py-16"
          }
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-medium text-foreground sm:text-3xl">
                {group.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {group.items.map((item) => (
                <div key={item.title} className="surface-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="mt-4 font-heading text-lg font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="border-t border-border px-6 py-20">
        <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            Începe să lucrezi, nu să configurezi zile întregi
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Cont gratuit, fără card pe planul Free.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              Începe gratuit
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/pricing" />} nativeButton={false}>
              Vezi prețurile
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
