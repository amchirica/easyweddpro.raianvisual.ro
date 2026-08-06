import type { VendorCategoryGroup } from "@/lib/events/vendor-types";

export type DashboardWidgetId =
  | "new_leads"
  | "conversion"
  | "pipeline_value"
  | "active_contracts"
  | "overdue_payments"
  | "upcoming_events"
  | "urgent_tasks"
  | "estimated_revenue"
  | "venue_occupancy"
  | "venue_capacity"
  | "dj_confirmed_events"
  | "dj_member_availability"
  | "planner_active_events"
  | "planner_vendors"
  | "decor_upcoming_setups"
  | "decor_reserved_inventory";

export type DashboardWidget = {
  id: DashboardWidgetId;
  label: string;
  description: string;
};

export const COMMON_DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: "new_leads", label: "Leaduri noi", description: "Leaduri create recent." },
  { id: "conversion", label: "Conversie", description: "Rata de conversie lead → contract." },
  { id: "pipeline_value", label: "Valoare pipeline", description: "Valoarea ofertelor în lucru." },
  { id: "active_contracts", label: "Contracte active", description: "Contracte publicate sau acceptate." },
  { id: "overdue_payments", label: "Plăți restante", description: "Sume restante de încasat." },
  { id: "upcoming_events", label: "Evenimente viitoare", description: "Evenimente din următoarele 30 de zile." },
  { id: "urgent_tasks", label: "Task-uri urgente", description: "Task-uri cu termen apropiat." },
  { id: "estimated_revenue", label: "Venit estimat", description: "Venit estimat din pipeline." },
];

const SPECIALTY_WIDGETS: Record<VendorCategoryGroup, DashboardWidget[]> = {
  venue: [
    { id: "venue_occupancy", label: "Grad de ocupare", description: "Ocuparea sălilor pe perioadă." },
    { id: "venue_capacity", label: "Capacitate rezervată", description: "Locuri rezervate vs. disponibile." },
  ],
  music_entertainment: [
    {
      id: "dj_confirmed_events",
      label: "Evenimente confirmate",
      description: "Prestații confirmate în calendar.",
    },
    {
      id: "dj_member_availability",
      label: "Disponibilitate membri",
      description: "Disponibilitatea echipei / formației.",
    },
  ],
  planning: [
    {
      id: "planner_active_events",
      label: "Evenimente active",
      description: "Evenimente în coordonare.",
    },
    {
      id: "planner_vendors",
      label: "Furnizori de coordonat",
      description: "Furnizori pe evenimentele active.",
    },
  ],
  decor_flowers: [
    {
      id: "decor_upcoming_setups",
      label: "Montaje viitoare",
      description: "Montaje programate.",
    },
    {
      id: "decor_reserved_inventory",
      label: "Inventar rezervat",
      description: "Elemente de inventar alocate.",
    },
  ],
  photo_video: [],
  beauty: [],
  catering_dessert: [],
  logistics: [],
  stationery: [],
  other: [],
};

export function getDashboardWidgetsForBusinessTypes(
  businessTypes: VendorCategoryGroup[],
): DashboardWidget[] {
  const specialty = businessTypes.flatMap((type) => SPECIALTY_WIDGETS[type] ?? []);
  const seen = new Set<string>();
  return [...COMMON_DASHBOARD_WIDGETS, ...specialty].filter((widget) => {
    if (seen.has(widget.id)) return false;
    seen.add(widget.id);
    return true;
  });
}
