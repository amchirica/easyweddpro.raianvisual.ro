import type { ProjectStatus } from "@/lib/constants";
import type { VendorCategoryGroup } from "@/lib/events/vendor-types";

export type PipelineTemplateId =
  | "generic"
  | "photo_video"
  | "dj_band"
  | "decor"
  | "venue"
  | "planner"
  | "beauty"
  | "catering";

export type PipelineStage = {
  status: ProjectStatus;
  label: string;
};

export type PipelineTemplate = {
  id: PipelineTemplateId;
  label: string;
  description: string;
  stages: PipelineStage[];
};

/**
 * Canonical project status codes stay compatible with existing DB / demo data.
 * Photo-video stages remain available for specialized workspaces.
 */
export const PIPELINE_TEMPLATES: Record<PipelineTemplateId, PipelineTemplate> = {
  generic: {
    id: "generic",
    label: "Pipeline generic",
    description: "Flux standard pentru furnizori din industria evenimentelor.",
    stages: [
      { status: "booked", label: "Rezervare" },
      { status: "prep", label: "Pregătire" },
      { status: "logistics", label: "Confirmare logistică" },
      { status: "event_done", label: "Eveniment" },
      { status: "follow_up", label: "Follow-up" },
      { status: "delivery", label: "Livrare" },
      { status: "completed", label: "Închidere" },
    ],
  },
  photo_video: {
    id: "photo_video",
    label: "Foto-video",
    description: "Pregătire, eveniment, post-procesare și livrare.",
    stages: [
      { status: "prep", label: "Pregătire" },
      { status: "event_done", label: "Eveniment" },
      { status: "backup", label: "Backup" },
      { status: "selection", label: "Selecție" },
      { status: "photo_edit", label: "Editare" },
      { status: "review", label: "Verificare" },
      { status: "delivery", label: "Livrare" },
    ],
  },
  dj_band: {
    id: "dj_band",
    label: "DJ / formație",
    description: "Contractare, repertoriu, logistică și decont.",
    stages: [
      { status: "booked", label: "Contractare" },
      { status: "prep", label: "Repertoriu" },
      { status: "logistics", label: "Logistică" },
      { status: "review", label: "Soundcheck" },
      { status: "event_done", label: "Eveniment" },
      { status: "follow_up", label: "Decont" },
      { status: "completed", label: "Follow-up" },
    ],
  },
  decor: {
    id: "decor",
    label: "Decor",
    description: "Concept, achiziții, montaj și demontaj.",
    stages: [
      { status: "prep", label: "Concept" },
      { status: "review", label: "Aprobări" },
      { status: "selection", label: "Achiziții" },
      { status: "logistics", label: "Pregătire" },
      { status: "backup", label: "Transport" },
      { status: "album", label: "Montaj" },
      { status: "event_done", label: "Eveniment" },
      { status: "photo_edit", label: "Demontaj" },
      { status: "completed", label: "Retur" },
    ],
  },
  venue: {
    id: "venue",
    label: "Locație",
    description: "Rezervare, meniu, plan sală și închidere.",
    stages: [
      { status: "booked", label: "Rezervare" },
      { status: "prep", label: "Meniu" },
      { status: "logistics", label: "Plan sală" },
      { status: "selection", label: "Plăți" },
      { status: "review", label: "Confirmare invitați" },
      { status: "event_done", label: "Eveniment" },
      { status: "completed", label: "Închidere" },
    ],
  },
  planner: {
    id: "planner",
    label: "Planner",
    description: "Coordonare clienți, furnizori și timeline.",
    stages: [
      { status: "booked", label: "Rezervare" },
      { status: "prep", label: "Planificare" },
      { status: "logistics", label: "Coordonare furnizori" },
      { status: "event_done", label: "Eveniment" },
      { status: "follow_up", label: "Follow-up" },
      { status: "completed", label: "Închidere" },
    ],
  },
  beauty: {
    id: "beauty",
    label: "Beauty",
    description: "Programări, echipă și livrare serviciu.",
    stages: [
      { status: "booked", label: "Rezervare" },
      { status: "prep", label: "Pregătire" },
      { status: "logistics", label: "Confirmare locație" },
      { status: "event_done", label: "Eveniment" },
      { status: "follow_up", label: "Follow-up" },
      { status: "completed", label: "Închidere" },
    ],
  },
  catering: {
    id: "catering",
    label: "Catering",
    description: "Meniu, logistică și livrare pe eveniment.",
    stages: [
      { status: "booked", label: "Rezervare" },
      { status: "prep", label: "Meniu" },
      { status: "logistics", label: "Logistică" },
      { status: "event_done", label: "Eveniment" },
      { status: "follow_up", label: "Decont" },
      { status: "completed", label: "Închidere" },
    ],
  },
};

export const DEFAULT_PIPELINE_TEMPLATE_ID: PipelineTemplateId = "generic";

export function getPipelineTemplate(id?: string | null): PipelineTemplate {
  if (id && id in PIPELINE_TEMPLATES) {
    return PIPELINE_TEMPLATES[id as PipelineTemplateId];
  }
  return PIPELINE_TEMPLATES.generic;
}

export function resolvePipelineTemplateForCategories(
  categories: VendorCategoryGroup[],
): PipelineTemplateId {
  if (categories.includes("photo_video") && categories.length === 1) return "photo_video";
  if (categories.includes("music_entertainment") && categories.length === 1) return "dj_band";
  if (categories.includes("decor_flowers") && categories.length === 1) return "decor";
  if (categories.includes("venue") && categories.length === 1) return "venue";
  if (categories.includes("planning") && categories.length === 1) return "planner";
  if (categories.includes("beauty") && categories.length === 1) return "beauty";
  if (categories.includes("catering_dessert") && categories.length === 1) return "catering";
  return "generic";
}
