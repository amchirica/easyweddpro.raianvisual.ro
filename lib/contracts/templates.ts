export const CONTRACT_TEMPLATE_VARIABLES = [
  "client_name",
  "client_email",
  "client_phone",
  "company_name",
  "company_email",
  "company_phone",
  "event_date",
  "event_location",
  "contract_number",
  "proposal_number",
  "total",
  "deposit",
  "remaining",
  "currency",
] as const;

export type ContractTemplateVariable = (typeof CONTRACT_TEMPLATE_VARIABLES)[number];

export type TemplateVariableValues = Partial<Record<ContractTemplateVariable, string | null | undefined>>;

const VARIABLE_PATTERN = /\{\{\s*([a-z_]+)\s*\}\}/gi;

const CRITICAL_VARIABLES: ContractTemplateVariable[] = [
  "client_name",
  "company_name",
  "total",
  "currency",
  "contract_number",
];

export function isAllowedTemplateVariable(name: string): name is ContractTemplateVariable {
  return (CONTRACT_TEMPLATE_VARIABLES as readonly string[]).includes(name);
}

export function extractTemplateVariables(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]?.toLowerCase();
    if (name) found.add(name);
  }
  return [...found];
}

export type ResolveTemplateResult = {
  text: string;
  unresolved: string[];
  unresolvedCritical: string[];
};

/** Safe resolver: only allowlisted variables; never evaluates expressions. */
export function resolveTemplateVariables(
  text: string,
  values: TemplateVariableValues,
): ResolveTemplateResult {
  const unresolved = new Set<string>();

  const resolved = text.replace(VARIABLE_PATTERN, (_full, name: string) => {
    const key = name.toLowerCase();
    if (!isAllowedTemplateVariable(key)) {
      unresolved.add(key);
      return `{{${key}}}`;
    }
    const value = values[key];
    if (value === null || value === undefined || String(value).trim() === "") {
      unresolved.add(key);
      return `{{${key}}}`;
    }
    return String(value);
  });

  const unresolvedList = [...unresolved];
  return {
    text: resolved,
    unresolved: unresolvedList,
    unresolvedCritical: unresolvedList.filter((name) =>
      CRITICAL_VARIABLES.includes(name as ContractTemplateVariable),
    ),
  };
}

export function hasUnresolvedCriticalPlaceholders(
  texts: string[],
  values: TemplateVariableValues,
): string[] {
  const critical = new Set<string>();
  for (const text of texts) {
    const result = resolveTemplateVariables(text, values);
    for (const name of result.unresolvedCritical) critical.add(name);
  }
  return [...critical];
}
