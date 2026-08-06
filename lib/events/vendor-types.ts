export type VendorCapability =
  | "leads"
  | "proposals"
  | "contracts"
  | "calendar"
  | "projects"
  | "inventory"
  | "team"
  | "delivery"
  | "logistics"
  | "menus"
  | "venues";

export type VendorCategoryGroup =
  | "photo_video"
  | "music_entertainment"
  | "planning"
  | "venue"
  | "decor_flowers"
  | "beauty"
  | "catering_dessert"
  | "logistics"
  | "stationery"
  | "other";

export type VendorTypeDefinition = {
  code: string;
  label: string;
  category: VendorCategoryGroup;
  icon: string;
  shortDescription: string;
  defaultCapabilities: VendorCapability[];
};

export const VENDOR_CATEGORY_GROUPS: Array<{
  code: VendorCategoryGroup;
  label: string;
  description: string;
}> = [
  { code: "photo_video", label: "Foto & video", description: "Fotografi, videografi și studiouri" },
  { code: "music_entertainment", label: "Muzică & entertainment", description: "DJ, formații, MC, efecte" },
  { code: "planning", label: "Organizare", description: "Wedding & event planners, agenții" },
  { code: "venue", label: "Locație", description: "Săli, restaurante, locații de evenimente" },
  { code: "decor_flowers", label: "Decor & flori", description: "Decor, florării, aranjamente" },
  { code: "beauty", label: "Beauty", description: "Makeup, hair, rochii și costume" },
  { code: "catering_dessert", label: "Catering & desert", description: "Catering, candy bar, cofetărie" },
  { code: "logistics", label: "Logistică", description: "Transport, lumini, sonorizare, cabine" },
  { code: "stationery", label: "Papetărie", description: "Invitații și papetărie" },
  { code: "other", label: "Alte servicii", description: "Alte tipuri de furnizori" },
];

const DEFAULT_CAPS: VendorCapability[] = [
  "leads",
  "proposals",
  "contracts",
  "calendar",
  "projects",
  "team",
];

export const VENDOR_TYPES: VendorTypeDefinition[] = [
  {
    code: "photographer",
    label: "Fotograf",
    category: "photo_video",
    icon: "Camera",
    shortDescription: "Servicii foto pentru evenimente și ședințe.",
    defaultCapabilities: [...DEFAULT_CAPS, "delivery"],
  },
  {
    code: "videographer",
    label: "Videograf",
    category: "photo_video",
    icon: "Video",
    shortDescription: "Filmări și livrări video pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS, "delivery"],
  },
  {
    code: "photo_video_studio",
    label: "Studio foto-video",
    category: "photo_video",
    icon: "Clapperboard",
    shortDescription: "Echipă integrată foto și video.",
    defaultCapabilities: [...DEFAULT_CAPS, "delivery", "team"],
  },
  {
    code: "wedding_planner",
    label: "Wedding planner",
    category: "planning",
    icon: "Sparkles",
    shortDescription: "Coordonare nunți și evenimente private.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "event_planner",
    label: "Event planner",
    category: "planning",
    icon: "ClipboardList",
    shortDescription: "Planificare evenimente private și corporate.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "dj",
    label: "DJ",
    category: "music_entertainment",
    icon: "Music4",
    shortDescription: "Muzică, mixaje și atmosferă.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "band",
    label: "Formație",
    category: "music_entertainment",
    icon: "AudioLines",
    shortDescription: "Formații live pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics", "team"],
  },
  {
    code: "soloist",
    label: "Solist",
    category: "music_entertainment",
    icon: "Mic2",
    shortDescription: "Interpreți și soliști.",
    defaultCapabilities: [...DEFAULT_CAPS],
  },
  {
    code: "mc",
    label: "MC/prezentator",
    category: "music_entertainment",
    icon: "Megaphone",
    shortDescription: "Prezentare și moderare evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS],
  },
  {
    code: "venue",
    label: "Locație",
    category: "venue",
    icon: "MapPin",
    shortDescription: "Locații de evenimente și spații de închiriat.",
    defaultCapabilities: [...DEFAULT_CAPS, "venues", "menus"],
  },
  {
    code: "event_hall",
    label: "Salon de evenimente",
    category: "venue",
    icon: "Building2",
    shortDescription: "Săli și saloane pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS, "venues", "menus"],
  },
  {
    code: "restaurant",
    label: "Restaurant",
    category: "venue",
    icon: "UtensilsCrossed",
    shortDescription: "Restaurante cu evenimente private.",
    defaultCapabilities: [...DEFAULT_CAPS, "menus"],
  },
  {
    code: "decor",
    label: "Decor",
    category: "decor_flowers",
    icon: "Lamp",
    shortDescription: "Concepte și montaje de decor.",
    defaultCapabilities: [...DEFAULT_CAPS, "inventory", "logistics"],
  },
  {
    code: "florist",
    label: "Florărie",
    category: "decor_flowers",
    icon: "Flower2",
    shortDescription: "Flori și aranjamente florale.",
    defaultCapabilities: [...DEFAULT_CAPS, "inventory", "logistics"],
  },
  {
    code: "arrangements",
    label: "Aranjamente",
    category: "decor_flowers",
    icon: "Leaf",
    shortDescription: "Aranjamente decorative personalizate.",
    defaultCapabilities: [...DEFAULT_CAPS, "inventory"],
  },
  {
    code: "photo_booth",
    label: "Cabină foto",
    category: "logistics",
    icon: "Images",
    shortDescription: "Cabine foto pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "booth_360",
    label: "360 booth",
    category: "logistics",
    icon: "Rotate3d",
    shortDescription: "Experiențe 360 pentru invitați.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "lights_sound",
    label: "Lumini și sonorizare",
    category: "logistics",
    icon: "Speaker",
    shortDescription: "Tehnică de scenă, lumini și sunet.",
    defaultCapabilities: [...DEFAULT_CAPS, "inventory", "logistics"],
  },
  {
    code: "pastry",
    label: "Cofetărie",
    category: "catering_dessert",
    icon: "Cake",
    shortDescription: "Torturi și produse de cofetărie.",
    defaultCapabilities: [...DEFAULT_CAPS],
  },
  {
    code: "candy_bar",
    label: "Candy bar",
    category: "catering_dessert",
    icon: "Candy",
    shortDescription: "Candy bar și deserturi tematice.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "catering",
    label: "Catering",
    category: "catering_dessert",
    icon: "Soup",
    shortDescription: "Servicii de catering pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS, "menus", "logistics"],
  },
  {
    code: "makeup_artist",
    label: "Makeup artist",
    category: "beauty",
    icon: "Sparkle",
    shortDescription: "Machiaj pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS],
  },
  {
    code: "hairstylist",
    label: "Hairstylist",
    category: "beauty",
    icon: "Scissors",
    shortDescription: "Coafură pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS],
  },
  {
    code: "attire",
    label: "Rochii și costume",
    category: "beauty",
    icon: "Shirt",
    shortDescription: "Închirieri și vânzări ținute eveniment.",
    defaultCapabilities: [...DEFAULT_CAPS, "inventory"],
  },
  {
    code: "transport",
    label: "Transport",
    category: "logistics",
    icon: "Car",
    shortDescription: "Transport invitați și logistică.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "limousines",
    label: "Limuzine",
    category: "logistics",
    icon: "CarFront",
    shortDescription: "Limuzine și transfer premium.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "stationery",
    label: "Invitații și papetărie",
    category: "stationery",
    icon: "Mail",
    shortDescription: "Invitații, meniuri și papetărie.",
    defaultCapabilities: [...DEFAULT_CAPS, "delivery"],
  },
  {
    code: "entertainment",
    label: "Entertainment",
    category: "music_entertainment",
    icon: "PartyPopper",
    shortDescription: "Acte și experiențe de divertisment.",
    defaultCapabilities: [...DEFAULT_CAPS],
  },
  {
    code: "pyro_effects",
    label: "Artificii și efecte speciale",
    category: "music_entertainment",
    icon: "Flame",
    shortDescription: "Efecte speciale și artificii.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics"],
  },
  {
    code: "event_agency",
    label: "Agenție de evenimente",
    category: "planning",
    icon: "Briefcase",
    shortDescription: "Agenții full-service pentru evenimente.",
    defaultCapabilities: [...DEFAULT_CAPS, "logistics", "team"],
  },
  {
    code: "corporate_vendor",
    label: "Furnizor servicii corporate",
    category: "planning",
    icon: "Building",
    shortDescription: "Servicii pentru evenimente corporate.",
    defaultCapabilities: [...DEFAULT_CAPS, "team"],
  },
  {
    code: "other_vendor",
    label: "Alt tip de furnizor",
    category: "other",
    icon: "MoreHorizontal",
    shortDescription: "Alte categorii din industria evenimentelor.",
    defaultCapabilities: [...DEFAULT_CAPS],
  },
];

export const VENDOR_TYPE_BY_CODE = Object.fromEntries(
  VENDOR_TYPES.map((item) => [item.code, item]),
) as Record<string, VendorTypeDefinition>;

export function getVendorTypesByCategory(category: VendorCategoryGroup) {
  return VENDOR_TYPES.filter((item) => item.category === category);
}

export function getCapabilitiesForVendorCodes(codes: string[]): VendorCapability[] {
  const set = new Set<VendorCapability>();
  for (const code of codes) {
    const def = VENDOR_TYPE_BY_CODE[code];
    if (!def) continue;
    for (const capability of def.defaultCapabilities) set.add(capability);
  }
  return [...set];
}
