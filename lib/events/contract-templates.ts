import type { VendorCategoryGroup } from "@/lib/events/vendor-types";

export type ContractTemplateKind =
  | "generic"
  | "photo_video"
  | "dj_band"
  | "venue"
  | "planner"
  | "decor"
  | "beauty"
  | "catering";

export type ContractTemplateDefinition = {
  id: ContractTemplateKind;
  label: string;
  description: string;
  recommendedFor: VendorCategoryGroup[];
  /** Sections emphasized beyond the common baseline. */
  specialtySections: string[];
};

export const COMMON_CONTRACT_SECTIONS = [
  "object",
  "services",
  "products",
  "value",
  "deposit",
  "installments",
  "provider_obligations",
  "client_obligations",
  "schedule",
  "access_logistics",
  "transport",
  "setup_teardown",
  "cancellation",
  "reschedule",
  "force_majeure",
  "liability",
  "copyright",
  "data_protection",
  "special_clauses",
] as const;

export const CONTRACT_TEMPLATE_CATALOG: ContractTemplateDefinition[] = [
  {
    id: "generic",
    label: "Contract generic evenimente",
    description: "Clauze comune pentru orice furnizor din industria evenimentelor.",
    recommendedFor: ["other"],
    specialtySections: ["services", "schedule", "cancellation"],
  },
  {
    id: "photo_video",
    label: "Contract foto-video",
    description: "Livrare materiale, drepturi de autor și termene de editare.",
    recommendedFor: ["photo_video"],
    specialtySections: ["copyright", "delivery", "selection"],
  },
  {
    id: "dj_band",
    label: "Contract DJ / formație",
    description: "Prestație, echipamente, repertoriu și logistică.",
    recommendedFor: ["music_entertainment"],
    specialtySections: ["schedule", "transport", "equipment"],
  },
  {
    id: "venue",
    label: "Contract locație",
    description: "Săli, meniuri, avansuri și taxe suplimentare.",
    recommendedFor: ["venue"],
    specialtySections: ["menus", "capacity", "deposit"],
  },
  {
    id: "planner",
    label: "Contract planner",
    description: "Coordonare, fee și responsabilități pe furnizori.",
    recommendedFor: ["planning"],
    specialtySections: ["coordination", "vendors", "timeline"],
  },
  {
    id: "decor",
    label: "Contract decor",
    description: "Montaj, demontaj, inventar și garanții.",
    recommendedFor: ["decor_flowers"],
    specialtySections: ["setup_teardown", "inventory", "transport"],
  },
  {
    id: "beauty",
    label: "Contract beauty",
    description: "Programări, locație serviciu și echipă.",
    recommendedFor: ["beauty"],
    specialtySections: ["schedule", "team", "location"],
  },
  {
    id: "catering",
    label: "Contract catering",
    description: "Meniuri, număr persoane și logistică alimentare.",
    recommendedFor: ["catering_dessert"],
    specialtySections: ["menus", "guests", "logistics"],
  },
];

export function getDefaultContractTemplateForCategories(
  categories: VendorCategoryGroup[],
): ContractTemplateKind {
  if (categories.length === 1) {
    const match = CONTRACT_TEMPLATE_CATALOG.find((item) =>
      item.recommendedFor.includes(categories[0]!),
    );
    if (match) return match.id;
  }
  return "generic";
}
