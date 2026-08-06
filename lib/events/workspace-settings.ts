import { EVENT_TYPE_CODES } from "@/lib/events/event-types";
import {
  DEFAULT_PIPELINE_TEMPLATE_ID,
  type PipelineTemplateId,
} from "@/lib/events/project-pipelines";
import { DEFAULT_PROPOSAL_UNITS } from "@/lib/events/units";
import type { VendorCategoryGroup } from "@/lib/events/vendor-types";
import type { ContractTemplateKind } from "@/lib/events/contract-templates";

export type WorkspaceIndustrySettings = {
  business_type: VendorCategoryGroup[];
  vendor_categories: string[];
  default_event_types: string[];
  default_units: string[];
  default_project_pipeline: PipelineTemplateId;
  default_contract_template: ContractTemplateKind;
  default_proposal_template: string;
};

export const DEFAULT_WORKSPACE_INDUSTRY_SETTINGS: WorkspaceIndustrySettings = {
  business_type: [],
  vendor_categories: [],
  default_event_types: [...EVENT_TYPE_CODES],
  default_units: [...DEFAULT_PROPOSAL_UNITS],
  default_project_pipeline: DEFAULT_PIPELINE_TEMPLATE_ID,
  default_contract_template: "generic",
  default_proposal_template: "generic_service",
};

export function parseWorkspaceIndustrySettings(
  raw: unknown,
): WorkspaceIndustrySettings {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const businessType = Array.isArray(source.business_type)
    ? source.business_type.filter((item): item is VendorCategoryGroup => typeof item === "string")
    : DEFAULT_WORKSPACE_INDUSTRY_SETTINGS.business_type;

  const vendorCategories = Array.isArray(source.vendor_categories)
    ? source.vendor_categories.filter((item): item is string => typeof item === "string")
    : DEFAULT_WORKSPACE_INDUSTRY_SETTINGS.vendor_categories;

  const defaultEventTypes = Array.isArray(source.default_event_types)
    ? source.default_event_types.filter((item): item is string => typeof item === "string")
    : DEFAULT_WORKSPACE_INDUSTRY_SETTINGS.default_event_types;

  const defaultUnits = Array.isArray(source.default_units)
    ? source.default_units.filter((item): item is string => typeof item === "string")
    : DEFAULT_WORKSPACE_INDUSTRY_SETTINGS.default_units;

  const pipeline =
    typeof source.default_project_pipeline === "string"
      ? (source.default_project_pipeline as PipelineTemplateId)
      : DEFAULT_PIPELINE_TEMPLATE_ID;

  const contractTemplate =
    typeof source.default_contract_template === "string"
      ? (source.default_contract_template as ContractTemplateKind)
      : "generic";

  const proposalTemplate =
    typeof source.default_proposal_template === "string"
      ? source.default_proposal_template
      : DEFAULT_WORKSPACE_INDUSTRY_SETTINGS.default_proposal_template;

  return {
    business_type: businessType,
    vendor_categories: vendorCategories,
    default_event_types: defaultEventTypes,
    default_units: defaultUnits,
    default_project_pipeline: pipeline,
    default_contract_template: contractTemplate,
    default_proposal_template: proposalTemplate,
  };
}
