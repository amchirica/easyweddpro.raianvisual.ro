import type { WorkspaceAction } from "@/lib/workspace/role-permissions";

export type AssistantSurface = "dashboard" | "admin";

export type PlanFeatureKey =
  | "automations"
  | "analytics"
  | "customBranding"
  | "productionPipeline"
  | "multiBrand";

export type KnowledgeModule = {
  key: string;
  title: string;
  titleEn: string;
  route: string;
  description: string;
  descriptionEn: string;
  actions: string[];
  actionsEn: string[];
  permissions: WorkspaceAction[] | string[];
  relatedModules: string[];
  keywords: string[];
  suggestedQuestions: string[];
  suggestedQuestionsEn: string[];
  planFeatures?: PlanFeatureKey[];
  pageHints?: string[];
};

export type WorkflowStep = {
  key: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  moduleKey?: string;
};

export type GlossaryEntry = {
  key: string;
  term: string;
  termEn: string;
  definition: string;
  definitionEn: string;
  keywords: string[];
};

export type RoleGuide = {
  role: string;
  summary: string;
  summaryEn: string;
  can: string[];
  canEn: string[];
  cannot: string[];
  cannotEn: string[];
};

export type AssistantLocale = "ro" | "en";

export type AssistantLink = {
  href: string;
  label: string;
};

export type AssistantAnswer = {
  answer: string;
  links: AssistantLink[];
  suggestedQuestions: string[];
  moduleKey: string | null;
  intent: string;
  resolved: boolean;
  provider: "knowledge" | "ai" | "fallback";
};
