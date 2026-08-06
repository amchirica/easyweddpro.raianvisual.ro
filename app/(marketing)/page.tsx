import Link from "next/link";
import type { Metadata } from "next";
import {
  Briefcase,
  CalendarDays,
  Contact,
  FileText,
  Flower2,
  FolderKanban,
  MapPin,
  Music4,
  ScrollText,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Users,
  Camera,
  Wallet,
  Zap,
} from "lucide-react";

import { HeroDashboardMock } from "@/components/marketing/hero-dashboard-mock";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { Button } from "@/components/ui/button";
import {
  APP_HERO_ALT,
  APP_NAME,
  APP_PROMISE,
  APP_SEO_DESCRIPTION,
  APP_SUBTITLE,
  APP_TAGLINE,
  SUPPORT_EMAIL,
} from "@/lib/constants";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "CRM și Business OS pentru furnizori de evenimente",
  description: APP_SEO_DESCRIPTION,
};

const MODULES = [
  { icon: Users, title: "Leaduri", description: "Capturezi și califici fiecare lead înainte să se răcească." },
  { icon: Contact, title: "Clienți", description: "Istoric complet, contracte și comunicare într-un singur dosar." },
  { icon: FileText, title: "Oferte", description: "Oferte clare pe servicii, produse și pachete, cu link public." },
  { icon: ScrollText, title: "Contracte", description: "Acceptare digitală și statusuri clare, fără hârtii pierdute." },
  { icon: CalendarDays, title: "Calendar", description: "Evenimente, termene și disponibilitate într-un calendar unificat." },
  { icon: FolderKanban, title: "Proiecte", description: "Pipeline configurabil de la rezervare la închiderea proiectului." },
  { icon: Wallet, title: "Plăți", description: "Avansuri, tranșe și restanțe urmărite automat." },
  { icon: Zap, title: "Automatizări", description: "Remindere și follow-up-uri care lucrează în locul tău." },
];

const WORKFLOW_STEPS = [
  { step: "01", title: "Lead", description: "Formular, mesaj sau recomandare — totul intră automat în pipeline." },
  { step: "02", title: "Calificare", description: "Filtrezi buget, dată, tip eveniment și servicii dorite." },
  { step: "03", title: "Ofertă", description: "Trimiți o ofertă clară, cu preț și termeni, pe un link public elegant." },
  { step: "04", title: "Contract", description: "Clientul acceptă digital, avansul e urmărit automat." },
  { step: "05", title: "Proiect", description: "Echipa colaborează pe pipeline-ul configurat pentru tipul tău de business." },
  { step: "06", title: "Follow-up", description: "Ceri feedback și finalizezi relația din portalul clientului." },
];

const AUDIENCE = [
  {
    icon: Camera,
    label: "Foto & video",
    description: "Urmărește leadurile, contractele, termenele de livrare și echipa.",
  },
  {
    icon: Music4,
    label: "DJ & entertainment",
    description: "Gestionează disponibilitatea, repertoriul, echipamentele și plățile.",
  },
  {
    icon: MapPin,
    label: "Locații",
    description: "Administrează rezervările, sălile, meniurile, avansurile și calendarul.",
  },
  {
    icon: Sparkles,
    label: "Planners",
    description: "Coordonează clienți, furnizori, task-uri, bugete și timeline-uri.",
  },
  {
    icon: Flower2,
    label: "Decor & flori",
    description: "Gestionează oferta, inventarul, transportul, montajul și demontajul.",
  },
  {
    icon: Sparkles,
    label: "Beauty",
    description: "Organizează programările, echipa, locațiile și serviciile per client.",
  },
  {
    icon: UtensilsCrossed,
    label: "Catering",
    description: "Menține meniuri, număr persoane, logistică și plăți pe eveniment.",
  },
  {
    icon: Truck,
    label: "Logistică",
    description: "Planifică transport, echipamente, cabine și alocări pe eveniment.",
  },
  {
    icon: Briefcase,
    label: "Agenții",
    description: "Operațiuni multi-echipă, roluri, proiecte și relația cu clienții.",
  },
];

const FAQ = [
  {
    question: "EasyWedd Pro este doar pentru fotografi?",
    answer:
      "Nu. Platforma este construită pentru furnizori din întreaga industrie a evenimentelor: foto-video, DJ, formații, locații, planners, decoratori, beauty, catering și agenții.",
  },
  {
    question: "Pot configura platforma pentru tipul meu de business?",
    answer:
      "Da. La onboarding alegi tipul de business, iar workspace-ul preconfigurează tipuri de evenimente, unități de ofertă, pipeline de proiecte și template-uri de contract.",
  },
  {
    question: "Pot folosi mai multe tipuri de servicii în același workspace?",
    answer:
      "Da. Un workspace poate combina, de exemplu, foto + video, planner + decor, locație + catering sau DJ + lumini.",
  },
  {
    question: "Pot avea echipe și roluri diferite?",
    answer:
      "Da. Planurile Studio și Agency includ mai mulți utilizatori, roluri și colaborare pe oferte, contracte, proiecte și task-uri.",
  },
  {
    question: "Cât timp durează implementarea?",
    answer:
      "Sub 10 minute. Wizardul de onboarding te ghidează prin setarea businessului, serviciilor și primului pachet — fără suport tehnic necesar.",
  },
  {
    question: "Clienții mei trebuie să își creeze cont?",
    answer:
      "Nu. Fiecare ofertă, contract și proiect are un portal de client accesibil printr-un link unic, fără parolă.",
  },
  {
    question: "Pot anula abonamentul oricând?",
    answer:
      "Da, fără contract pe termen lung. Poți retrograda la planul Free în orice moment din setările contului.",
  },
];

export default function MarketingHomePage() {
  const siteUrl = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: APP_SEO_DESCRIPTION,
      url: siteUrl,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "RON",
        lowPrice: "0",
        highPrice: "349",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: siteUrl,
      email: SUPPORT_EMAIL,
      logo: `${siteUrl}/logo.png`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.16),transparent)]"
        />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-14">
          <div className="max-w-3xl text-center">
            <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
              {APP_NAME} — {APP_TAGLINE}
            </span>
            <h1 className="animate-fade-up mt-6 font-heading text-4xl font-medium tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
              {APP_HERO_ALT}
            </h1>
            <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              {APP_SUBTITLE} {APP_PROMISE}
            </p>
            <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
                Începe gratuit
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/pricing" />} nativeButton={false}>
                Vezi prețurile
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-soft">
              Fără card bancar. Configurare completă în sub 10 minute.
            </p>
          </div>

          <HeroDashboardMock />
        </div>
      </section>

      <section className="border-t border-border bg-background-secondary/40 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            Recunoști haosul?
          </h2>
          <div className="mt-10 grid gap-5 text-left sm:grid-cols-3">
            {[
              "Leaduri pierdute în DM-uri, WhatsApp și hârtii de birou.",
              "Oferte făcute manual, trimise cu întârziere.",
              "Plăți, echipe și termene urmărite din memorie sau Excel.",
            ].map((problem) => (
              <div key={problem} className="surface-card p-5">
                <p className="text-sm text-muted-foreground">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            Un singur spațiu de lucru, de la primul mesaj la închiderea proiectului
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            {APP_NAME} unifică vânzările, contractele, proiectele și relația cu clienții
            pentru furnizorii din industria evenimentelor.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-background-secondary/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
              Tot ce ai nevoie, deja conectat
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((module) => (
              <div key={module.title} className="surface-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                  <module.icon className="h-4 w-4" aria-hidden />
                </div>
                <p className="mt-4 font-heading text-lg font-medium text-foreground">
                  {module.title}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
              De la primul lead la proiect finalizat
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW_STEPS.map((item) => (
              <div key={item.step} className="surface-card p-6">
                <span className="font-heading text-sm font-medium text-champagne/70">
                  {item.step}
                </span>
                <p className="mt-2 font-heading text-lg font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background-secondary/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
              Pentru cine este
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              De la freelanceri la agenții și locații, {APP_NAME} se adaptează tipului tău de
              business din industria evenimentelor.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCE.map((item) => (
              <div key={item.label} className="surface-card p-5 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                  <item.icon className="h-4 w-4" aria-hidden />
                </div>
                <p className="mt-4 font-heading text-lg font-medium text-foreground">{item.label}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
              Prețuri simple, fără surprize
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Începe gratuit, treci la un plan plătit când businessul tău crește.
            </p>
          </div>
          <div className="mt-12">
            <PricingGrid />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background-secondary/40 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
              Întrebări frecvente
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.question}
                className="surface-card group p-5 [&_summary]:cursor-pointer"
              >
                <summary className="flex list-none items-center justify-between font-heading text-base font-medium text-foreground marker:content-none">
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

      <section className="px-6 py-24">
        <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            Pregătit să pui ordine în business-ul tău?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Creează un cont gratuit și configurează spațiul de lucru în câteva minute.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              Începe gratuit
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/features" />} nativeButton={false}>
              Vezi funcționalitățile
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
