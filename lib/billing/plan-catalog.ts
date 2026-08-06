export type PlanId = "free" | "solo" | "studio" | "agency";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceMonthlyRon: number;
  description: string;
  features: string[];
  limits: {
    activeLeads: number | null;
    clients: number | null;
    users: number;
    automations: boolean;
    analytics: boolean;
    customBranding: boolean;
    productionPipeline: boolean;
    multiBrand: boolean;
  };
  highlighted?: boolean;
  cta: string;
};

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceMonthlyRon: 0,
    description: "Pentru a testa fluxul de bază.",
    features: [
      "5 leaduri active",
      "3 clienți",
      "1 utilizator",
      "Funcții de bază",
      "Branding EasyWedd Pro",
    ],
    limits: {
      activeLeads: 5,
      clients: 3,
      users: 1,
      automations: false,
      analytics: false,
      customBranding: false,
      productionPipeline: false,
      multiBrand: false,
    },
    cta: "Începe gratuit",
  },
  {
    id: "solo",
    name: "Solo",
    priceMonthlyRon: 79,
    description: "Pentru freelanceri și furnizori independenți.",
    features: [
      "Leaduri nelimitate",
      "Clienți, oferte, contracte",
      "Calendar și plăți",
      "Portal client",
      "1 utilizator",
    ],
    limits: {
      activeLeads: null,
      clients: null,
      users: 1,
      automations: false,
      analytics: false,
      customBranding: false,
      productionPipeline: false,
      multiBrand: false,
    },
    highlighted: true,
    cta: "Alege Solo",
  },
  {
    id: "studio",
    name: "Studio",
    priceMonthlyRon: 179,
    description: "Pentru echipe și businessuri de evenimente în creștere.",
    features: [
      "Până la 5 utilizatori",
      "Automatizări",
      "Analytics",
      "Pipeline producție",
      "Template-uri",
      "Branding personalizat",
    ],
    limits: {
      activeLeads: null,
      clients: null,
      users: 5,
      automations: true,
      analytics: true,
      customBranding: true,
      productionPipeline: true,
      multiBrand: false,
    },
    cta: "Alege Studio",
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthlyRon: 349,
    description: "Pentru agenții, locații și operațiuni cu mai multe echipe.",
    features: [
      "Până la 15 utilizatori",
      "Roluri avansate",
      "Rapoarte",
      "Multiple branduri",
      "Suport prioritar",
      "Funcții avansate",
    ],
    limits: {
      activeLeads: null,
      clients: null,
      users: 15,
      automations: true,
      analytics: true,
      customBranding: true,
      productionPipeline: true,
      multiBrand: true,
    },
    cta: "Alege Agency",
  },
];
