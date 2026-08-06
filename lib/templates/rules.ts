/** Pure helpers for `workspace_templates` default-uniqueness rules (no I/O, easy to unit test). */

export type DefaultCandidate = {
  id: string;
  type: string;
  isDefault: boolean;
};

/**
 * Given a set of templates (any type), returns the ids that must be unset
 * (is_default = false) so that `targetId` becomes the sole default *within its own type*.
 * Templates of a different type are never touched, even if they are currently default.
 */
export function idsToUnsetDefault(
  templates: DefaultCandidate[],
  targetId: string,
): string[] {
  const target = templates.find((template) => template.id === targetId);
  if (!target) return [];

  return templates
    .filter(
      (template) =>
        template.isDefault && template.id !== targetId && template.type === target.type,
    )
    .map((template) => template.id);
}

/** Extracts `{{variable}}` tokens (case-insensitive) used anywhere in the given texts. */
export function collectTemplateVariableTokens(texts: string[]): string[] {
  const pattern = /\{\{\s*([a-z_]+)\s*\}\}/gi;
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(pattern)) {
      const name = match[1]?.toLowerCase();
      if (name) found.add(name);
    }
  }
  return [...found];
}
